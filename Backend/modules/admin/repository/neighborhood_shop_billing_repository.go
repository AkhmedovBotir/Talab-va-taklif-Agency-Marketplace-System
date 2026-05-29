package repository

import (
	"errors"
	"time"

	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type NeighborhoodShopBillingRepository interface {
	GetMonthlyConfig() (*domain.NeighborhoodShopMonthlyConfig, error)
	SaveMonthlyConfig(row *domain.NeighborhoodShopMonthlyConfig) error
	GetSubscriptionByShopID(shopID uint) (*domain.NeighborhoodShopSubscription, error)
	SaveSubscription(row *domain.NeighborhoodShopSubscription) error
	ShopExists(shopID uint) (bool, error)
	GetShopByID(shopID uint) (*domain.NeighborhoodShop, error)
	ListActiveSubscriptions(now time.Time) ([]domain.NeighborhoodShopSubscription, error)
}

type neighborhoodShopBillingPostgresRepository struct {
	db *gorm.DB
}

func NewNeighborhoodShopBillingRepository(db *gorm.DB) NeighborhoodShopBillingRepository {
	return &neighborhoodShopBillingPostgresRepository{db: db}
}

func (r *neighborhoodShopBillingPostgresRepository) GetMonthlyConfig() (*domain.NeighborhoodShopMonthlyConfig, error) {
	var row domain.NeighborhoodShopMonthlyConfig
	err := r.db.First(&row, domain.NeighborhoodShopMonthlyConfigSingletonID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		def := &domain.NeighborhoodShopMonthlyConfig{
			ID:              domain.NeighborhoodShopMonthlyConfigSingletonID,
			MonthlyPriceUZS: 0,
			Currency:        "UZS",
		}
		if createErr := r.db.Create(def).Error; createErr != nil {
			return nil, createErr
		}
		return def, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *neighborhoodShopBillingPostgresRepository) SaveMonthlyConfig(row *domain.NeighborhoodShopMonthlyConfig) error {
	row.ID = domain.NeighborhoodShopMonthlyConfigSingletonID
	return r.db.Save(row).Error
}

func (r *neighborhoodShopBillingPostgresRepository) GetSubscriptionByShopID(shopID uint) (*domain.NeighborhoodShopSubscription, error) {
	var row domain.NeighborhoodShopSubscription
	err := r.db.Where("neighborhood_shop_id = ?", shopID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *neighborhoodShopBillingPostgresRepository) SaveSubscription(row *domain.NeighborhoodShopSubscription) error {
	return r.db.Save(row).Error
}

func (r *neighborhoodShopBillingPostgresRepository) ShopExists(shopID uint) (bool, error) {
	var n int64
	err := r.db.Model(&domain.NeighborhoodShop{}).Where("id = ?", shopID).Count(&n).Error
	return n > 0, err
}

func (r *neighborhoodShopBillingPostgresRepository) GetShopByID(shopID uint) (*domain.NeighborhoodShop, error) {
	var row domain.NeighborhoodShop
	err := r.db.First(&row, shopID).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *neighborhoodShopBillingPostgresRepository) ListActiveSubscriptions(now time.Time) ([]domain.NeighborhoodShopSubscription, error) {
	var rows []domain.NeighborhoodShopSubscription
	err := r.db.
		Where("period_start_at <= ? AND period_end_at > ?", now, now).
		Find(&rows).Error
	return rows, err
}
