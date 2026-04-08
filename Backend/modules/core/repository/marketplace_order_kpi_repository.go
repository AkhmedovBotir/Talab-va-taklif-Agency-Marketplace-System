package repository

import (
	"errors"
	"time"

	contrDomain "backend/modules/contragents/domain"
	mpdomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

var ErrOrderForKPINotFound = errors.New("buyurtma topilmadi")

// OrderLineForKPI — buyurtma qatori bo‘yicha KPI hisobi uchun.
type OrderLineForKPI struct {
	UnitSale        float64
	UnitCost        float64
	Quantity        float64
	KpiBonusPercent float64
}

type MarketplaceOrderKPIRepository struct {
	db *gorm.DB
}

func NewMarketplaceOrderKPIRepository(db *gorm.DB) *MarketplaceOrderKPIRepository {
	return &MarketplaceOrderKPIRepository{db: db}
}

func orderItemsToKPILines(items []mpdomain.OrderItem, pmap map[uint]contrDomain.Product) []OrderLineForKPI {
	out := make([]OrderLineForKPI, 0, len(items))
	for _, it := range items {
		cost := it.UnitOriginalPrice
		kpi := it.KpiBonusPercent
		if p, ok := pmap[it.ProductID]; ok {
			if cost == 0 {
				cost = p.OriginalPrice
			}
			if kpi == 0 {
				kpi = p.KpiBonusPercent
			}
		}
		out = append(out, OrderLineForKPI{
			UnitSale:        it.UnitPrice,
			UnitCost:        cost,
			Quantity:        it.Quantity,
			KpiBonusPercent: kpi,
		})
	}
	return out
}

func (r *MarketplaceOrderKPIRepository) GetLinesForKPI(orderID uint) ([]OrderLineForKPI, error) {
	var n int64
	if err := r.db.Model(&mpdomain.Order{}).Where("id = ?", orderID).Count(&n).Error; err != nil {
		return nil, err
	}
	if n == 0 {
		return nil, ErrOrderForKPINotFound
	}
	var items []mpdomain.OrderItem
	if err := r.db.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return []OrderLineForKPI{}, nil
	}
	ids := make([]uint, 0, len(items))
	seen := make(map[uint]struct{}, len(items))
	for _, it := range items {
		if _, ok := seen[it.ProductID]; !ok {
			seen[it.ProductID] = struct{}{}
			ids = append(ids, it.ProductID)
		}
	}
	var products []contrDomain.Product
	if err := r.db.Where("id IN ?", ids).Find(&products).Error; err != nil {
		return nil, err
	}
	pmap := make(map[uint]contrDomain.Product, len(products))
	for i := range products {
		pmap[products[i].ID] = products[i]
	}
	return orderItemsToKPILines(items, pmap), nil
}

// OrderKPIBundle — bitta yetkazilgan buyurtma va uning KPI qatorlari.
type OrderKPIBundle struct {
	OrderID   uint
	UpdatedAt time.Time
	AssignedPunktID *uint
	AssignedAgentID *uint
	SnapRegionID uint
	Lines     []OrderLineForKPI
}

func (r *MarketplaceOrderKPIRepository) listDeliveredBundles(assigneeColumn string, assigneeID uint, start, end time.Time) ([]OrderKPIBundle, error) {
	var orders []mpdomain.Order
	err := r.db.Where(assigneeColumn+" = ? AND status = ?", assigneeID, mpdomain.OrderStatusDelivered).
		Where("updated_at >= ? AND updated_at < ?", start, end).
		Preload("Items").
		Order("updated_at asc").
		Find(&orders).Error
	if err != nil {
		return nil, err
	}
	if len(orders) == 0 {
		return nil, nil
	}
	var allProductIDs []uint
	seen := make(map[uint]struct{})
	for _, o := range orders {
		for _, it := range o.Items {
			if _, ok := seen[it.ProductID]; !ok {
				seen[it.ProductID] = struct{}{}
				allProductIDs = append(allProductIDs, it.ProductID)
			}
		}
	}
	pmap := make(map[uint]contrDomain.Product)
	if len(allProductIDs) > 0 {
		var products []contrDomain.Product
		if err := r.db.Where("id IN ?", allProductIDs).Find(&products).Error; err != nil {
			return nil, err
		}
		for i := range products {
			pmap[products[i].ID] = products[i]
		}
	}
	out := make([]OrderKPIBundle, 0, len(orders))
	for i := range orders {
		o := &orders[i]
		lines := orderItemsToKPILines(o.Items, pmap)
		out = append(out, OrderKPIBundle{
			OrderID:   o.ID,
			UpdatedAt: o.UpdatedAt.UTC(),
			AssignedPunktID: o.AssignedPunktID,
			AssignedAgentID: o.AssignedAgentID,
			SnapRegionID: o.SnapRegionID,
			Lines:     lines,
		})
	}
	return out, nil
}

// ListDeliveredOrderKPIBundlesForPunkt — assigned_punkt_id bo‘yicha yetkazilgan buyurtmalar [start, end).
func (r *MarketplaceOrderKPIRepository) ListDeliveredOrderKPIBundlesForPunkt(punktID uint, start, end time.Time) ([]OrderKPIBundle, error) {
	return r.listDeliveredBundles("assigned_punkt_id", punktID, start, end)
}

// ListDeliveredOrderKPIBundlesForAgent — assigned_agent_id bo‘yicha yetkazilgan buyurtmalar [start, end).
func (r *MarketplaceOrderKPIRepository) ListDeliveredOrderKPIBundlesForAgent(agentID uint, start, end time.Time) ([]OrderKPIBundle, error) {
	return r.listDeliveredBundles("assigned_agent_id", agentID, start, end)
}

// ListDeliveredOrderKPIBundlesFiltered — yetkazilgan buyurtmalar; ixtiyoriy punkt_id va/ham agent_id filtri.
func (r *MarketplaceOrderKPIRepository) ListDeliveredOrderKPIBundlesFiltered(start, end time.Time, punktID *uint, agentID *uint) ([]OrderKPIBundle, error) {
	q := r.db.Where("status = ? AND updated_at >= ? AND updated_at < ?", mpdomain.OrderStatusDelivered, start, end)
	if punktID != nil && *punktID > 0 {
		q = q.Where("assigned_punkt_id = ?", *punktID)
	}
	if agentID != nil && *agentID > 0 {
		q = q.Where("assigned_agent_id = ?", *agentID)
	}
	var orders []mpdomain.Order
	err := q.Preload("Items").Order("updated_at asc").Find(&orders).Error
	if err != nil {
		return nil, err
	}
	if len(orders) == 0 {
		return nil, nil
	}
	var allProductIDs []uint
	seen := make(map[uint]struct{})
	for _, o := range orders {
		for _, it := range o.Items {
			if _, ok := seen[it.ProductID]; !ok {
				seen[it.ProductID] = struct{}{}
				allProductIDs = append(allProductIDs, it.ProductID)
			}
		}
	}
	pmap := make(map[uint]contrDomain.Product)
	if len(allProductIDs) > 0 {
		var products []contrDomain.Product
		if err := r.db.Where("id IN ?", allProductIDs).Find(&products).Error; err != nil {
			return nil, err
		}
		for i := range products {
			pmap[products[i].ID] = products[i]
		}
	}
	out := make([]OrderKPIBundle, 0, len(orders))
	for i := range orders {
		o := &orders[i]
		lines := orderItemsToKPILines(o.Items, pmap)
		out = append(out, OrderKPIBundle{
			OrderID:   o.ID,
			UpdatedAt: o.UpdatedAt.UTC(),
			AssignedPunktID: o.AssignedPunktID,
			AssignedAgentID: o.AssignedAgentID,
			SnapRegionID: o.SnapRegionID,
			Lines:     lines,
		})
	}
	return out, nil
}

func (r *MarketplaceOrderKPIRepository) RoleNamesByIDs(role string, ids []uint) (map[uint]string, error) {
	out := make(map[uint]string)
	if len(ids) == 0 {
		return out, nil
	}
	switch role {
	case "punkt":
		var rows []struct {
			ID   uint
			Name string
		}
		if err := r.db.Table("punkts").Select("id, name").Where("id IN ?", ids).Find(&rows).Error; err != nil {
			return nil, err
		}
		for _, rr := range rows {
			out[rr.ID] = rr.Name
		}
	case "agent":
		var rows []struct {
			ID   uint
			Name string
		}
		if err := r.db.Table("agents").Select("id, name").Where("id IN ?", ids).Find(&rows).Error; err != nil {
			return nil, err
		}
		for _, rr := range rows {
			out[rr.ID] = rr.Name
		}
	case "manager":
		var rows []struct {
			ID   uint
			Name string
		}
		if err := r.db.Table("managers").Select("id, name").Where("id IN ?", ids).Find(&rows).Error; err != nil {
			return nil, err
		}
		for _, rr := range rows {
			out[rr.ID] = rr.Name
		}
	}
	return out, nil
}

func (r *MarketplaceOrderKPIRepository) ManagerByRegion(regionIDs []uint, managerID *uint) (map[uint]uint, error) {
	out := make(map[uint]uint)
	if len(regionIDs) == 0 {
		return out, nil
	}
	q := r.db.Table("managers").Select("id, region_id").Where("region_id IN ?", regionIDs).Order("id asc")
	if managerID != nil && *managerID > 0 {
		q = q.Where("id = ?", *managerID)
	}
	var rows []struct {
		ID       uint
		RegionID uint
	}
	if err := q.Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, rr := range rows {
		if _, ok := out[rr.RegionID]; !ok {
			out[rr.RegionID] = rr.ID
		}
	}
	return out, nil
}

func (r *MarketplaceOrderKPIRepository) PaidByRoleAndDay(role string, start, end time.Time, ids []uint) (map[uint]map[string]float64, error) {
	out := make(map[uint]map[string]float64)
	if len(ids) == 0 {
		return out, nil
	}
	switch role {
	case "agent":
		var rows []struct {
			PersonID uint    `gorm:"column:person_id"`
			Day      string  `gorm:"column:day"`
			Amount   float64 `gorm:"column:amount"`
		}
		if err := r.db.Raw(`
			SELECT agent_id AS person_id, TO_CHAR(paid_at::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(amount),0) AS amount
			FROM agent_kpi_payouts
			WHERE paid_at >= ? AND paid_at < ? AND agent_id IN ?
			GROUP BY agent_id, paid_at::date
		`, start, end, ids).Scan(&rows).Error; err != nil {
			return nil, err
		}
		for _, rr := range rows {
			if out[rr.PersonID] == nil {
				out[rr.PersonID] = map[string]float64{}
			}
			out[rr.PersonID][rr.Day] = rr.Amount
		}
	case "punkt":
		var rows []struct {
			PersonID uint    `gorm:"column:person_id"`
			Day      string  `gorm:"column:day"`
			Amount   float64 `gorm:"column:amount"`
		}
		if err := r.db.Raw(`
			SELECT punkt_id AS person_id, TO_CHAR(paid_at::date, 'YYYY-MM-DD') AS day, COALESCE(SUM(amount),0) AS amount
			FROM punkt_kpi_payouts
			WHERE paid_at >= ? AND paid_at < ? AND punkt_id IN ?
			GROUP BY punkt_id, paid_at::date
		`, start, end, ids).Scan(&rows).Error; err != nil {
			return nil, err
		}
		for _, rr := range rows {
			if out[rr.PersonID] == nil {
				out[rr.PersonID] = map[string]float64{}
			}
			out[rr.PersonID][rr.Day] = rr.Amount
		}
	}
	return out, nil
}
