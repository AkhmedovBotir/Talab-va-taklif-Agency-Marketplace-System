package repository

import (
	"time"

	"gorm.io/gorm"
)

type ContragentSalesStatsRow struct {
	OrdersCount        int64   `gorm:"column:orders_count"`
	LinesCount         int64   `gorm:"column:lines_count"`
	GrossSalesTotal    float64 `gorm:"column:gross_sales_total"`
	CostTotal          float64 `gorm:"column:cost_total"`
	MarginTotal        float64 `gorm:"column:margin_total"`
	KpiPoolTotal       float64 `gorm:"column:kpi_pool_total"`
	PayoutTotal        float64 `gorm:"column:payout_total"`
}

type ContragentOrderSaleRow struct {
	OrderID             uint      `gorm:"column:order_id"`
	OrderStatus         string    `gorm:"column:order_status"`
	OrderUpdatedAt      time.Time `gorm:"column:order_updated_at"`
	LinesCount          int64     `gorm:"column:lines_count"`
	GrossSalesTotal     float64   `gorm:"column:gross_sales_total"`
	CostTotal           float64   `gorm:"column:cost_total"`
	PayoutTotal         float64   `gorm:"column:payout_total"`
}

type ContragentAnalyticsRepository interface {
	GetSalesStats(contragentID uint, start, end *time.Time) (*ContragentSalesStatsRow, error)
	ListOrderSales(contragentID uint, start, end *time.Time, page, limit int) ([]ContragentOrderSaleRow, int64, error)
}

type contragentAnalyticsPostgresRepository struct {
	db *gorm.DB
}

func NewContragentAnalyticsRepository(db *gorm.DB) ContragentAnalyticsRepository {
	return &contragentAnalyticsPostgresRepository{db: db}
}

func (r *contragentAnalyticsPostgresRepository) GetSalesStats(contragentID uint, start, end *time.Time) (*ContragentSalesStatsRow, error) {
	out := &ContragentSalesStatsRow{}
	query := `
SELECT
  COALESCE(COUNT(DISTINCT o.id), 0) AS orders_count,
  COALESCE(COUNT(i.id), 0) AS lines_count,
  COALESCE(SUM(i.unit_price * i.quantity), 0) AS gross_sales_total,
  COALESCE(SUM(i.unit_original_price * i.quantity), 0) AS cost_total,
  COALESCE(SUM(GREATEST((i.unit_price - i.unit_original_price) * i.quantity, 0)), 0) AS margin_total,
  COALESCE(SUM(GREATEST((i.unit_price - i.unit_original_price) * i.quantity, 0) * (i.kpi_bonus_percent/100.0)), 0) AS kpi_pool_total,
  COALESCE(SUM(i.unit_price * i.quantity * COALESCE(i.punkt_contragent_payout_percent, 100) / 100.0), 0) AS payout_total
FROM marketplace_order_items i
JOIN marketplace_orders o ON o.id = i.order_id
WHERE i.contragent_id = ?
`
	args := []interface{}{contragentID}
	if start != nil {
		query += " AND o.updated_at >= ?"
		args = append(args, *start)
	}
	if end != nil {
		query += " AND o.updated_at < ?"
		args = append(args, *end)
	}
	err := r.db.Raw(query, args...).Scan(out).Error
	if err != nil {
		return nil, err
	}
	return out, nil
}

func (r *contragentAnalyticsPostgresRepository) ListOrderSales(contragentID uint, start, end *time.Time, page, limit int) ([]ContragentOrderSaleRow, int64, error) {
	base := r.db.Table("marketplace_order_items i").
		Joins("JOIN marketplace_orders o ON o.id = i.order_id").
		Where("i.contragent_id = ?", contragentID)
	if start != nil {
		base = base.Where("o.updated_at >= ?", *start)
	}
	if end != nil {
		base = base.Where("o.updated_at < ?", *end)
	}

	var total int64
	countQ := `
SELECT COALESCE(COUNT(DISTINCT o.id), 0) AS total
FROM marketplace_order_items i
JOIN marketplace_orders o ON o.id = i.order_id
WHERE i.contragent_id = ?
`
	countArgs := []interface{}{contragentID}
	if start != nil {
		countQ += " AND o.updated_at >= ?"
		countArgs = append(countArgs, *start)
	}
	if end != nil {
		countQ += " AND o.updated_at < ?"
		countArgs = append(countArgs, *end)
	}
	if err := r.db.Raw(countQ, countArgs...).Scan(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	var rows []ContragentOrderSaleRow
	err := base.Select(`
o.id AS order_id,
o.status AS order_status,
o.updated_at AS order_updated_at,
COUNT(i.id) AS lines_count,
COALESCE(SUM(i.unit_price * i.quantity), 0) AS gross_sales_total,
COALESCE(SUM(i.unit_original_price * i.quantity), 0) AS cost_total,
COALESCE(SUM(i.unit_price * i.quantity * COALESCE(i.punkt_contragent_payout_percent, 100) / 100.0), 0) AS payout_total
`).
		Group("o.id, o.status, o.updated_at").
		Order("o.updated_at desc, o.id desc").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}
