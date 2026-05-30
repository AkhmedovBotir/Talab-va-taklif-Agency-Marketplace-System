package domain

import "time"

type LocalShopProductTemplate struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:255;not null" json:"name"`
	Description   string    `gorm:"type:text;not null" json:"description"` // delta JSON string
	CategoryID    uint      `gorm:"index;not null" json:"category_id"`
	SubcategoryID uint      `gorm:"index;not null" json:"subcategory_id"`
	Unit          string    `gorm:"size:16;not null" json:"unit"`
	UnitSize      string    `gorm:"size:120;not null" json:"unit_size"`
	Status        string    `gorm:"size:20;not null" json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (LocalShopProductTemplate) TableName() string {
	return "local_shop_product_templates"
}

type LocalShopProductTemplateImage struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	TemplateID uint      `gorm:"index;not null" json:"template_id"`
	Image      string    `gorm:"size:2048;not null" json:"image"` // URL yoki templates/... nisbiy yo‘l
	SortOrder  int       `gorm:"not null;default:0" json:"sort_order"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (LocalShopProductTemplateImage) TableName() string {
	return "local_shop_product_template_images"
}
