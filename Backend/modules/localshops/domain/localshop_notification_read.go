package domain

import "time"

type LocalShopNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	LocalShopID    uint       `gorm:"not null;index:idx_local_shop_notification_read,unique" json:"local_shop_id"`
	NotificationID uint       `gorm:"not null;index:idx_local_shop_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (LocalShopNotificationRead) TableName() string {
	return "local_shop_notification_reads"
}
