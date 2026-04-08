package domain

import "time"

type LocalShopCartItem struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	UserID             uint      `gorm:"not null;index;uniqueIndex:uq_marketplace_local_shop_cart_user_product" json:"user_id"`
	LocalShopProductID uint      `gorm:"not null;index;uniqueIndex:uq_marketplace_local_shop_cart_user_product" json:"local_shop_product_id"`
	Quantity           float64   `gorm:"not null" json:"quantity"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (LocalShopCartItem) TableName() string {
	return "marketplace_local_shop_cart_items"
}

type LocalShopDeliveryAreaOutput struct {
	MFYID   uint   `json:"mfy_id"`
	MFYName string `json:"mfy_name"`
}

type LocalShopMiniOutput struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	RegionID   uint   `json:"region_id"`
	DistrictID uint   `json:"district_id"`
	MFYID      uint   `json:"mfy_id"`
	Phone      string `json:"phone"`
}

type LocalShopTemplateOutput struct {
	ID            uint     `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	CategoryID    uint     `json:"category_id"`
	SubcategoryID uint     `json:"subcategory_id"`
	Unit          string   `json:"unit"`
	UnitSize      string   `json:"unit_size"`
	Images        []string `json:"images"`
}

type LocalShopProductCartOutput struct {
	ID            uint                      `json:"id"`
	LocalShopID   uint                      `json:"local_shop_id"`
	TemplateID    uint                      `json:"template_id"`
	Quantity      float64                   `json:"quantity"`
	Price         float64                   `json:"price"`
	OriginalPrice float64                   `json:"original_price"`
	Template      LocalShopTemplateOutput   `json:"template"`
	Shop          LocalShopMiniOutput       `json:"shop"`
	DeliveryAreas []LocalShopDeliveryAreaOutput `json:"delivery_areas"`
}

type LocalShopCartLineOutput struct {
	ID       uint                       `json:"id"`
	Quantity float64                    `json:"quantity"`
	Product  LocalShopProductCartOutput `json:"product"`
}

type LocalShopCartOutput struct {
	Items      []LocalShopCartLineOutput `json:"items"`
	TotalLines int                       `json:"total_lines"`
}
