package repository

import (
	"time"

	mpdomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type TransactionReportFilter struct {
	Status *string
	From   *time.Time
	To     *time.Time
}

type RegionTxRow struct {
	RegionID    uint
	RegionName  string
	OrdersCount int64
	TotalAmount float64
}

type DistrictTxRow struct {
	DistrictID   uint
	DistrictName string
	RegionID     uint
	OrdersCount  int64
	TotalAmount  float64
}

type MFYTxRow struct {
	MFYID       uint
	MFYName     string
	DistrictID  uint
	RegionID    uint
	OrdersCount int64
	TotalAmount float64
}

type TransactionReportRepository interface {
	ByRegion(filter TransactionReportFilter) ([]RegionTxRow, error)
	ByDistrict(filter TransactionReportFilter) ([]DistrictTxRow, error)
	ByMFY(filter TransactionReportFilter) ([]MFYTxRow, error)
}

type transactionReportPostgresRepository struct {
	db *gorm.DB
}

func NewTransactionReportRepository(db *gorm.DB) TransactionReportRepository {
	return &transactionReportPostgresRepository{db: db}
}

func applyTxFilter(q *gorm.DB, f TransactionReportFilter) *gorm.DB {
	if f.Status != nil {
		q = q.Where("o.status = ?", *f.Status)
	} else {
		q = q.Where("o.status = ?", mpdomain.OrderStatusDelivered)
	}
	if f.From != nil {
		q = q.Where("o.created_at >= ?", *f.From)
	}
	if f.To != nil {
		q = q.Where("o.created_at < ?", *f.To)
	}
	return q
}

func (r *transactionReportPostgresRepository) ByRegion(filter TransactionReportFilter) ([]RegionTxRow, error) {
	var rows []RegionTxRow
	q := r.db.Table("marketplace_orders o").
		Select("o.snap_region_id AS region_id, r.name AS region_name, COUNT(*) AS orders_count, COALESCE(SUM(o.total_amount),0) AS total_amount").
		Joins("LEFT JOIN regions r ON r.id = o.snap_region_id").
		Where("o.snap_region_id > 0")
	q = applyTxFilter(q, filter)
	err := q.Group("o.snap_region_id, r.name").Order("o.snap_region_id asc").Scan(&rows).Error
	return rows, err
}

func (r *transactionReportPostgresRepository) ByDistrict(filter TransactionReportFilter) ([]DistrictTxRow, error) {
	var rows []DistrictTxRow
	q := r.db.Table("marketplace_orders o").
		Select("o.snap_district_id AS district_id, d.name AS district_name, d.region_id AS region_id, COUNT(*) AS orders_count, COALESCE(SUM(o.total_amount),0) AS total_amount").
		Joins("LEFT JOIN districts d ON d.id = o.snap_district_id").
		Where("o.snap_district_id > 0")
	q = applyTxFilter(q, filter)
	err := q.Group("o.snap_district_id, d.name, d.region_id").Order("o.snap_district_id asc").Scan(&rows).Error
	return rows, err
}

func (r *transactionReportPostgresRepository) ByMFY(filter TransactionReportFilter) ([]MFYTxRow, error) {
	var rows []MFYTxRow
	q := r.db.Table("marketplace_orders o").
		Select("o.snap_mfy_id AS mfy_id, m.name AS mfy_name, m.district_id AS district_id, d.region_id AS region_id, COUNT(*) AS orders_count, COALESCE(SUM(o.total_amount),0) AS total_amount").
		Joins("LEFT JOIN mfies m ON m.id = o.snap_mfy_id").
		Joins("LEFT JOIN districts d ON d.id = m.district_id").
		Where("o.snap_mfy_id > 0")
	q = applyTxFilter(q, filter)
	err := q.Group("o.snap_mfy_id, m.name, m.district_id, d.region_id").Order("o.snap_mfy_id asc").Scan(&rows).Error
	return rows, err
}
