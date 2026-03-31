package domain

import "time"

// CartItem — foydalanuvchi korzinkasidagi bitta mahsulot qatori.
type CartItem struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index;uniqueIndex:uq_marketplace_cart_user_product" json:"user_id"`
	ProductID uint      `gorm:"not null;index;uniqueIndex:uq_marketplace_cart_user_product" json:"product_id"`
	Quantity  float64   `gorm:"not null" json:"quantity"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (CartItem) TableName() string {
	return "marketplace_cart_items"
}

type CartLineOutput struct {
	ID       uint          `json:"id"`
	Quantity float64       `json:"quantity"`
	Product  ProductOutput `json:"product"`
}

type CartOutput struct {
	Items      []CartLineOutput `json:"items"`
	TotalLines int              `json:"total_lines"`
}
