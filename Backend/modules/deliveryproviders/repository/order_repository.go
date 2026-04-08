package repository

import (
	"errors"
	"time"

	mpDomain "backend/modules/marketplace/domain"
	lsDomain "backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type OrderRepository interface {
	GetCourierByID(id uint) (*lsDomain.Courier, error)
	ListToday(courierID uint, start, end time.Time, page, limit int) ([]mpDomain.LocalShopOrder, int64, error)
	ListHistory(courierID uint, start time.Time, page, limit int) ([]mpDomain.LocalShopOrder, int64, error)
	GetByIDForCourier(orderID, courierID uint) (*mpDomain.LocalShopOrder, error)
	Update(order *mpDomain.LocalShopOrder) error
}

type orderPostgresRepository struct{ db *gorm.DB }

func NewOrderRepository(db *gorm.DB) OrderRepository { return &orderPostgresRepository{db: db} }

func (r *orderPostgresRepository) GetCourierByID(id uint) (*lsDomain.Courier, error) {
	var row lsDomain.Courier
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orderPostgresRepository) ListToday(courierID uint, start, end time.Time, page, limit int) ([]mpDomain.LocalShopOrder, int64, error) {
	var total int64
	base := r.db.Model(&mpDomain.LocalShopOrder{}).
		Where("assigned_courier_id = ? AND created_at >= ? AND created_at < ?", courierID, start, end)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []mpDomain.LocalShopOrder
	offset := (page - 1) * limit
	err := base.Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	return rows, total, err
}

func (r *orderPostgresRepository) ListHistory(courierID uint, start time.Time, page, limit int) ([]mpDomain.LocalShopOrder, int64, error) {
	var total int64
	base := r.db.Model(&mpDomain.LocalShopOrder{}).
		Where("assigned_courier_id = ? AND created_at < ?", courierID, start)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []mpDomain.LocalShopOrder
	offset := (page - 1) * limit
	err := base.Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	return rows, total, err
}

func (r *orderPostgresRepository) GetByIDForCourier(orderID, courierID uint) (*mpDomain.LocalShopOrder, error) {
	var row mpDomain.LocalShopOrder
	err := r.db.Where("id = ? AND assigned_courier_id = ?", orderID, courierID).Preload("Items").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *orderPostgresRepository) Update(order *mpDomain.LocalShopOrder) error { return r.db.Save(order).Error }
