package domain

import "time"

const (
	LocalShopOrderStatusPending   = "pending"
	LocalShopOrderStatusApproved  = "approved"
	LocalShopOrderStatusCancelled = "cancelled"
	LocalShopOrderStatusDelivered = "delivered"
)

type LocalShopOrder struct {
	ID          uint    `gorm:"primaryKey" json:"id"`
	UserID      uint    `gorm:"not null;index" json:"user_id"`
	LocalShopID uint    `gorm:"not null;index" json:"local_shop_id"`
	Status      string  `gorm:"size:24;not null;index;default:pending" json:"status"`
	TotalAmount float64 `gorm:"not null" json:"total_amount"`

	ExtraPhone  string `gorm:"size:13" json:"-"`
	AddressNote string `gorm:"type:text" json:"-"`

	AddressMode    string `gorm:"size:24;not null" json:"-"`
	DeliveryAreaID *uint  `gorm:"index" json:"-"`

	SnapAreaName   string `gorm:"size:120" json:"-"`
	SnapRegionID   uint   `json:"-"`
	SnapDistrictID uint   `json:"-"`
	SnapMFYID      uint   `gorm:"column:snap_mfy_id" json:"-"`

	PrimaryCustomAddress string `gorm:"type:text" json:"-"`
	AssignedCourierID    *uint  `gorm:"index" json:"-"`
	CourierAssignedAt    *time.Time `gorm:"index" json:"-"`
	CourierAcceptedAt    *time.Time `gorm:"index" json:"-"`
	DeliveredAt          *time.Time `gorm:"index" json:"-"`
	PaymentCollectedAt   *time.Time `gorm:"index" json:"-"`
	PaymentTransferredToShopAt *time.Time `gorm:"index" json:"-"`
	ShopPaymentAcceptedAt *time.Time `gorm:"index" json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Items []LocalShopOrderItem `json:"items,omitempty" gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE"`
}

func (LocalShopOrder) TableName() string {
	return "marketplace_local_shop_orders"
}

type LocalShopOrderItem struct {
	ID                 uint    `gorm:"primaryKey" json:"id"`
	OrderID            uint    `gorm:"not null;index" json:"order_id"`
	LocalShopProductID uint    `gorm:"not null;index" json:"local_shop_product_id"`
	LocalShopID        uint    `gorm:"not null;index" json:"local_shop_id"`
	TemplateID         uint    `gorm:"not null;index" json:"template_id"`
	ProductName        string  `gorm:"size:255;not null" json:"product_name"`
	UnitPrice          float64 `gorm:"not null" json:"unit_price"`
	Quantity           float64 `gorm:"not null" json:"quantity"`
	Unit               string  `gorm:"size:16;not null" json:"unit"`
	UnitOriginalPrice  float64 `gorm:"not null;default:0" json:"unit_original_price"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (LocalShopOrderItem) TableName() string {
	return "marketplace_local_shop_order_items"
}
