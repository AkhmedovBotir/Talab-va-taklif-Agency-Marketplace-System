package domain

import "time"

// IntegrationAPIKey — tashqi tizimlar uchun integratsiya kaliti (bir nechta yaratish mumkin).
type IntegrationAPIKey struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Name      string    `gorm:"size:200;not null" json:"name"`
	KeyHash      string `gorm:"size:255;not null" json:"-"`
	KeyEncrypted string `gorm:"type:text" json:"-"` // AES-GCM (admin ro‘yxatida to‘liq kalit uchun)
	KeyHint      string `gorm:"size:80;not null" json:"-"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (IntegrationAPIKey) TableName() string {
	return "integration_api_keys"
}
