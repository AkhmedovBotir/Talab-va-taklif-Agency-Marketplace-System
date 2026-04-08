package domain

import "time"

type ContragentNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ContragentID   uint       `gorm:"not null;index:idx_contragent_notification_read,unique" json:"contragent_id"`
	NotificationID uint       `gorm:"not null;index:idx_contragent_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (ContragentNotificationRead) TableName() string {
	return "contragent_notification_reads"
}
