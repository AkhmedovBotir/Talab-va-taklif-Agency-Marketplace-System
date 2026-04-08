package domain

import "time"

// MarketplaceNotificationRead — marketplace_users.id bilan bog'langan o'qilgan holat.
type MarketplaceNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	UserID         uint       `gorm:"not null;index:idx_marketplace_notification_read,unique" json:"user_id"`
	NotificationID uint       `gorm:"not null;index:idx_marketplace_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (MarketplaceNotificationRead) TableName() string {
	return "marketplace_notification_reads"
}
