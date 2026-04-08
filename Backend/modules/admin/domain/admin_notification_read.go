package domain

import "time"

type AdminNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	AdminID        uint       `gorm:"not null;index:idx_admin_notification_read,unique" json:"admin_id"`
	NotificationID uint       `gorm:"not null;index:idx_admin_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (AdminNotificationRead) TableName() string {
	return "admin_notification_reads"
}
