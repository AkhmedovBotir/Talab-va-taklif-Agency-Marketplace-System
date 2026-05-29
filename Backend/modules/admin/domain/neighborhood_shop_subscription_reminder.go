package domain

import "time"

// NeighborhoodShopSubscriptionReminder — obuna tugashidan 3/2/1 kun oldin yuborilgan eslatma jurnali.
type NeighborhoodShopSubscriptionReminder struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	NeighborhoodShopID uint      `gorm:"not null;uniqueIndex:idx_ns_sub_reminder,unique" json:"neighborhood_shop_id"`
	DaysBefore         int       `gorm:"not null;uniqueIndex:idx_ns_sub_reminder,unique" json:"days_before"`
	PeriodEndAt        time.Time `gorm:"not null;uniqueIndex:idx_ns_sub_reminder,unique" json:"period_end_at"`
	NotificationID     uint      `gorm:"not null" json:"notification_id"`
	CreatedAt          time.Time `json:"created_at"`
}

func (NeighborhoodShopSubscriptionReminder) TableName() string {
	return "neighborhood_shop_subscription_reminders"
}
