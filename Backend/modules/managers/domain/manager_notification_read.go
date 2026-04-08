package domain

import "time"

type ManagerNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	ManagerID      uint       `gorm:"not null;index:idx_manager_notification_read,unique" json:"manager_id"`
	NotificationID uint       `gorm:"not null;index:idx_manager_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (ManagerNotificationRead) TableName() string {
	return "manager_notification_reads"
}
