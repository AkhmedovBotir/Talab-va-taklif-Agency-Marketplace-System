package domain

import "time"

type DeliveryProviderNotificationRead struct {
	ID                 uint       `gorm:"primaryKey" json:"id"`
	DeliveryProviderID uint       `gorm:"not null;index:idx_dp_notification_read,unique" json:"delivery_provider_id"`
	NotificationID     uint       `gorm:"not null;index:idx_dp_notification_read,unique" json:"notification_id"`
	ReadAt             *time.Time `json:"read_at"`
	CreatedAt          time.Time  `json:"created_at"`
	UpdatedAt          time.Time  `json:"updated_at"`
}

func (DeliveryProviderNotificationRead) TableName() string {
	return "delivery_provider_notification_reads"
}
