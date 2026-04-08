package repository

import (
	"errors"
	"time"

	lsDomain "backend/modules/localshops/domain"
	mpDomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type OrderManagementRepository interface {
	GetPaginated(localShopID uint, page, limit int) ([]mpDomain.LocalShopOrder, int64, error)
	GetByID(localShopID, orderID uint) (*mpDomain.LocalShopOrder, error)
	Update(order *mpDomain.LocalShopOrder) error
	GetCourierByID(localShopID, courierID uint) (*lsDomain.Courier, error)
	GetUsersByIDs(ids []uint) ([]mpDomain.User, error)
	GetAnalytics(localShopID uint, from, to *time.Time) (*OrderAnalyticsRow, error)
}

type OrderAnalyticsRow struct {
	TotalOrders         int64
	TotalAmount         float64
	DeliveredAmount     float64
	UndeliveredAmount   float64
	TransferredAmount   float64
	UntransferredAmount float64
}

type orderManagementPostgresRepository struct {
	db *gorm.DB
}

func NewOrderManagementRepository(db *gorm.DB) OrderManagementRepository {
	return &orderManagementPostgresRepository{db: db}
}

func (r *orderManagementPostgresRepository) GetPaginated(localShopID uint, page, limit int) ([]mpDomain.LocalShopOrder, int64, error) {
	var total int64
	base := r.db.Model(&mpDomain.LocalShopOrder{}).Where("local_shop_id = ?", localShopID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []mpDomain.LocalShopOrder
	if err := base.Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *orderManagementPostgresRepository) GetByID(localShopID, orderID uint) (*mpDomain.LocalShopOrder, error) {
	var row mpDomain.LocalShopOrder
	err := r.db.Where("id = ? AND local_shop_id = ?", orderID, localShopID).Preload("Items").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orderManagementPostgresRepository) Update(order *mpDomain.LocalShopOrder) error {
	return r.db.Save(order).Error
}

func (r *orderManagementPostgresRepository) GetCourierByID(localShopID, courierID uint) (*lsDomain.Courier, error) {
	var row lsDomain.Courier
	err := r.db.Where("id = ? AND local_shop_id = ?", courierID, localShopID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orderManagementPostgresRepository) GetUsersByIDs(ids []uint) ([]mpDomain.User, error) {
	if len(ids) == 0 {
		return []mpDomain.User{}, nil
	}
	var rows []mpDomain.User
	if err := r.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

func (r *orderManagementPostgresRepository) GetAnalytics(localShopID uint, from, to *time.Time) (*OrderAnalyticsRow, error) {
	q := r.db.Table("marketplace_local_shop_orders").Where("local_shop_id = ?", localShopID)
	if from != nil {
		q = q.Where("created_at >= ?", *from)
	}
	if to != nil {
		q = q.Where("created_at <= ?", *to)
	}
	var out OrderAnalyticsRow
	err := q.Select(`
		COUNT(*) as total_orders,
		COALESCE(SUM(total_amount), 0) as total_amount,
		COALESCE(SUM(CASE WHEN delivered_at IS NOT NULL THEN total_amount ELSE 0 END), 0) as delivered_amount,
		COALESCE(SUM(CASE WHEN delivered_at IS NULL THEN total_amount ELSE 0 END), 0) as undelivered_amount,
		COALESCE(SUM(CASE WHEN payment_transferred_to_shop_at IS NOT NULL THEN total_amount ELSE 0 END), 0) as transferred_amount,
		COALESCE(SUM(CASE WHEN payment_transferred_to_shop_at IS NULL THEN total_amount ELSE 0 END), 0) as untransferred_amount
	`).Scan(&out).Error
	if err != nil {
		return nil, err
	}
	return &out, nil
}
