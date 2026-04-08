package domain

import "time"

type QR struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Code        string    `gorm:"size:64;not null;uniqueIndex" json:"code"`
	Name        string    `gorm:"size:255;not null" json:"name"`
	Link        string    `gorm:"type:text;not null" json:"link"`
	ImageBase64 string    `gorm:"type:text;not null" json:"image_base64"`
	ScanCount   uint64    `gorm:"not null;default:0" json:"scan_count"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (QR) TableName() string {
	return "admin_qrs"
}

