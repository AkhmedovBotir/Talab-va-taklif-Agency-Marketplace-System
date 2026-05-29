package domain

import "time"

type VerificationCode struct {
	ID         uint       `gorm:"primaryKey" json:"id"`
	ManagerID  uint       `gorm:"not null;index" json:"manager_id"`
	Phone      string     `gorm:"size:13;not null;index" json:"phone"`
	Code       string     `gorm:"size:10;not null" json:"code"`
	Purpose    string     `gorm:"size:32;not null;index" json:"purpose"`
	ExpiresAt  time.Time  `gorm:"not null;index" json:"expires_at"`
	Attempts   int        `gorm:"not null;default:0" json:"attempts"`
	VerifiedAt *time.Time `gorm:"index" json:"verified_at,omitempty"`
	UsedAt     *time.Time `gorm:"index" json:"used_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

func (VerificationCode) TableName() string {
	return "manager_verification_codes"
}
