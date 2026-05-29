package repository

import (
	"time"

	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type SubscriptionReminderRepository interface {
	WasSent(neighborhoodShopID uint, daysBefore int, periodEndAt time.Time) (bool, error)
	MarkSent(row *domain.NeighborhoodShopSubscriptionReminder) error
}

type subscriptionReminderPostgresRepository struct {
	db *gorm.DB
}

func NewSubscriptionReminderRepository(db *gorm.DB) SubscriptionReminderRepository {
	return &subscriptionReminderPostgresRepository{db: db}
}

func (r *subscriptionReminderPostgresRepository) WasSent(neighborhoodShopID uint, daysBefore int, periodEndAt time.Time) (bool, error) {
	var n int64
	err := r.db.Model(&domain.NeighborhoodShopSubscriptionReminder{}).
		Where("neighborhood_shop_id = ? AND days_before = ? AND period_end_at = ?", neighborhoodShopID, daysBefore, periodEndAt.UTC()).
		Count(&n).Error
	return n > 0, err
}

func (r *subscriptionReminderPostgresRepository) MarkSent(row *domain.NeighborhoodShopSubscriptionReminder) error {
	return r.db.Create(row).Error
}
