package domain

import "time"

type PunktNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	PunktID        uint       `gorm:"not null;index:idx_punkt_notification_read,unique" json:"punkt_id"`
	NotificationID uint       `gorm:"not null;index:idx_punkt_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (PunktNotificationRead) TableName() string {
	return "punkt_notification_reads"
}
