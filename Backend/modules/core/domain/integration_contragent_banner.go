package domain

import "time"

type IntegrationContragentBanner struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	ContragentID uint      `gorm:"not null;index" json:"contragent_id"`
	StartAt      time.Time `gorm:"not null;index" json:"start_at"`
	EndAt        time.Time `gorm:"not null;index" json:"end_at"`
	Status       string    `gorm:"size:20;not null;default:active;index" json:"status"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (IntegrationContragentBanner) TableName() string {
	return "integration_contragent_banners"
}
