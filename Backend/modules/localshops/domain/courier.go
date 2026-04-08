package domain

import "time"

type Courier struct {
	ID                   uint      `gorm:"primaryKey" json:"id"`
	LocalShopID          uint      `gorm:"not null;index" json:"local_shop_id"`
	FirstName            string    `gorm:"size:120;not null" json:"first_name"`
	LastName             string    `gorm:"size:120;not null" json:"last_name"`
	Phone                string    `gorm:"size:13;not null;index" json:"phone"`
	Note                 string    `gorm:"type:text" json:"note"`
	Password             string    `gorm:"size:255" json:"-"`
	PasswordSetupAllowed bool      `gorm:"not null;default:true" json:"password_setup_allowed"`
	CreatedAt            time.Time `json:"created_at"`
	UpdatedAt            time.Time `json:"updated_at"`
}

func (Courier) TableName() string {
	return "local_shop_couriers"
}
