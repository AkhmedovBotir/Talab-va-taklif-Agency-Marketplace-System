package domain

import "time"

type Product struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	LocalShopID   uint      `gorm:"not null;index" json:"local_shop_id"`
	TemplateID    uint      `gorm:"not null;index" json:"template_id"`
	Quantity      float64   `gorm:"not null" json:"quantity"`
	Price         float64   `gorm:"not null" json:"price"`
	OriginalPrice float64   `gorm:"not null" json:"original_price"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (Product) TableName() string {
	return "local_shop_products"
}
