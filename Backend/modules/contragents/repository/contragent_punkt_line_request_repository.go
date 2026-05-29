package repository

import (
	"errors"
	"time"

	mpdomain "backend/modules/marketplace/domain"
	punktdomain "backend/modules/punkts/domain"

	"gorm.io/gorm"
)

var (
	ErrContragentLineRequestNotFound      = errors.New("so'rov topilmadi")
	ErrContragentLineInvalidTransition    = errors.New("so'rov holati bu amal uchun mos emas")
)

// ContragentPunktLineListRow — ro'yxat uchun qo'shma maydonlar.
type ContragentPunktLineListRow struct {
	ID                uint
	OrderID           uint
	OrderItemID       uint
	PunktID           uint
	RoutingDistrictID uint
	Status            string
	CreatedAt         time.Time
	UpdatedAt         time.Time
	OrderStatus       string
	AssignedAgentID   *uint `gorm:"column:assigned_agent_id"`
	ProductName       string
	Quantity          float64
	Unit              string
	UnitPrice         float64
	PayoutPercent     *float64 `gorm:"column:punkt_contragent_payout_percent"`
}

type ContragentPunktLineDetail struct {
	Request punktdomain.PunktContragentLineRequest
	Order   mpdomain.Order
	Item    mpdomain.OrderItem
}

type ContragentPunktLineRequestRepository interface {
	ListByContragent(contragentID uint, page, limit int, status string) ([]ContragentPunktLineListRow, int64, error)
	GetDetail(contragentID, id uint) (*ContragentPunktLineDetail, error)
	SumOrderTotalForContragent(orderID, contragentID uint) (float64, error)
	Transition(contragentID, id uint, allowedFrom []string, to string) error
}

type contragentPunktLineRequestPostgresRepository struct {
	db *gorm.DB
}

func NewContragentPunktLineRequestRepository(db *gorm.DB) ContragentPunktLineRequestRepository {
	return &contragentPunktLineRequestPostgresRepository{db: db}
}

func (r *contragentPunktLineRequestPostgresRepository) ListByContragent(contragentID uint, page, limit int, status string) ([]ContragentPunktLineListRow, int64, error) {
	countQ := r.db.Model(&punktdomain.PunktContragentLineRequest{}).Where("contragent_id = ?", contragentID)
	if status != "" {
		countQ = countQ.Where("status = ?", status)
	}
	var total int64
	if err := countQ.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	var rows []ContragentPunktLineListRow
	q := r.db.Table("punkt_contragent_line_requests AS r").
		Select(`r.id, r.order_id, r.order_item_id, r.punkt_id, r.routing_district_id, r.status, r.created_at, r.updated_at,
			o.status AS order_status, o.assigned_agent_id AS assigned_agent_id, i.product_name, i.quantity, i.unit, i.unit_price, i.punkt_contragent_payout_percent`).
		Joins("JOIN marketplace_orders o ON o.id = r.order_id").
		Joins("JOIN marketplace_order_items i ON i.id = r.order_item_id").
		Where("r.contragent_id = ?", contragentID)
	if status != "" {
		q = q.Where("r.status = ?", status)
	}
	if err := q.Order("r.id DESC").Offset(offset).Limit(limit).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *contragentPunktLineRequestPostgresRepository) GetDetail(contragentID, id uint) (*ContragentPunktLineDetail, error) {
	var req punktdomain.PunktContragentLineRequest
	if err := r.db.Where("id = ? AND contragent_id = ?", id, contragentID).First(&req).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrContragentLineRequestNotFound
		}
		return nil, err
	}
	var order mpdomain.Order
	if err := r.db.Where("id = ?", req.OrderID).First(&order).Error; err != nil {
		return nil, err
	}
	var item mpdomain.OrderItem
	if err := r.db.Where("id = ?", req.OrderItemID).First(&item).Error; err != nil {
		return nil, err
	}
	return &ContragentPunktLineDetail{Request: req, Order: order, Item: item}, nil
}

func (r *contragentPunktLineRequestPostgresRepository) SumOrderTotalForContragent(orderID, contragentID uint) (float64, error) {
	var total float64
	err := r.db.Table("marketplace_order_items").
		Where("order_id = ? AND contragent_id = ?", orderID, contragentID).
		Select("COALESCE(SUM(unit_price * quantity * COALESCE(punkt_contragent_payout_percent, 100) / 100), 0)").
		Scan(&total).Error
	return total, err
}

func (r *contragentPunktLineRequestPostgresRepository) Transition(contragentID, id uint, allowedFrom []string, to string) error {
	res := r.db.Model(&punktdomain.PunktContragentLineRequest{}).
		Where("id = ? AND contragent_id = ? AND status IN ?", id, contragentID, allowedFrom).
		Update("status", to)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected > 0 {
		return nil
	}
	var cur punktdomain.PunktContragentLineRequest
	if err := r.db.Where("id = ? AND contragent_id = ?", id, contragentID).First(&cur).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrContragentLineRequestNotFound
		}
		return err
	}
	if cur.Status == to {
		return nil
	}
	return ErrContragentLineInvalidTransition
}
