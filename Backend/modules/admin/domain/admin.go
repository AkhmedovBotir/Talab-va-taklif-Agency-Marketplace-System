package domain

import "time"

const (
	RoleGeneral = "general"
	RoleAdmin   = "admin"

	StatusActive   = "active"
	StatusInactive = "inactive"
)

type Admin struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	Name        string    `gorm:"size:120;not null" json:"name"`
	Role        string    `gorm:"size:20;not null;index" json:"role"`
	Phone       string    `gorm:"size:13;uniqueIndex;not null" json:"phone"`
	Username    string    `gorm:"size:50;uniqueIndex;not null" json:"username"`
	Password    string    `gorm:"size:255;not null" json:"-"`
	Status      string    `gorm:"size:20;not null" json:"status"`
	Permissions []string  `gorm:"serializer:json;not null" json:"permissions"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}
