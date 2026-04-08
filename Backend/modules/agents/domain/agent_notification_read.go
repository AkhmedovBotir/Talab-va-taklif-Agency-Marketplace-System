package domain

import "time"

type AgentNotificationRead struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	AgentID        uint       `gorm:"not null;index:idx_agent_notification_read,unique" json:"agent_id"`
	NotificationID uint       `gorm:"not null;index:idx_agent_notification_read,unique" json:"notification_id"`
	ReadAt         *time.Time `json:"read_at"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (AgentNotificationRead) TableName() string {
	return "agent_notification_reads"
}
