package domain

import "time"

type ProductRating struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	UserID            uint      `gorm:"not null;index" json:"user_id"`
	OrderID           uint      `gorm:"not null;index" json:"order_id"`
	OrderItemID       uint      `gorm:"not null;index:idx_user_order_item_rating,unique" json:"order_item_id"`
	ProductID         uint      `gorm:"not null;index" json:"product_id"`
	Score             int       `gorm:"not null" json:"score"`
	CommentTemplateID *uint     `gorm:"index" json:"comment_template_id,omitempty"`
	Note              string    `gorm:"type:text" json:"note,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

func (ProductRating) TableName() string {
	return "marketplace_product_ratings"
}
