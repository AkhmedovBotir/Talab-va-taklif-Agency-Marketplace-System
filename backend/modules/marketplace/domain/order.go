package domain

import "time"

const (
	OrderStatusPending   = "pending"
	OrderStatusCancelled = "cancelled"
	OrderStatusDelivered = "delivered"
)

// Manzil tanlash rejimi (buyurtma vaqtidagi qiymat).
const (
	OrderAddressModeDefault      = "default"
	OrderAddressModeDeliveryArea = "delivery_area"
	OrderAddressModeExtra        = "extra"
)

// Punkt marshruti (yetkazib berish tumani bo'yicha markaziy punkt).
const (
	OrderPunktStatusNone                      = "none"                         // tuman aniqlanmagan (masalan, matnli manzil)
	OrderPunktStatusNoPunkt                   = "no_punkt"                     // tuman bor, lekin shu tumanda faol punkt yo'q
	OrderPunktStatusInbox                     = "inbox"                        // punkt inboxida, qabul kutilmoqda
	OrderPunktStatusRejected                  = "rejected"                     // punkt rad etdi
	OrderPunktStatusContragentRequestsCreated = "contragent_requests_created" // har bir qator bo'yicha kontragentga so'rov yaratildi
)

// Order — marketplace foydalanuvchisi buyurtmasi.
type Order struct {
	ID         uint   `gorm:"primaryKey" json:"id"`
	UserID     uint   `gorm:"not null;index" json:"user_id"`
	Status     string `gorm:"size:24;not null;index;default:pending" json:"status"`
	TotalAmount float64 `gorm:"not null" json:"total_amount"`

	ExtraPhone string `gorm:"size:13" json:"-"`
	// AddressNote — saqlangan manzilga qo'shimcha izoh (ixtiyoriy).
	AddressNote string `gorm:"type:text" json:"-"`

	AddressMode    string `gorm:"size:24;not null" json:"-"`
	DeliveryAreaID *uint  `gorm:"index" json:"-"`

	SnapAreaName   string `gorm:"size:120" json:"-"`
	SnapRegionID   uint   `json:"-"`
	SnapDistrictID uint   `json:"-"`
	SnapMFYID      uint   `gorm:"column:snap_mfy_id" json:"-"`

	// PrimaryCustomAddress — address_mode=extra bo'lganda asosiy matn manzil.
	PrimaryCustomAddress string `gorm:"type:text" json:"-"`

	// Punkt logistikasi: yetkazish tumani (odatda snap_district_id bilan bir xil).
	RoutingDistrictID     uint   `gorm:"not null;default:0;index" json:"-"`
	AssignedPunktID       *uint  `gorm:"index" json:"-"`
	PunktAcceptanceStatus string `gorm:"size:40;not null;default:none;index" json:"-"`

	// Punkt yig‘ish / tayyorlash / agentga topshirish (faqat punkt oqimi).
	PunktCollectedAt  *time.Time `gorm:"index" json:"-"`
	PunktReadyAt      *time.Time `gorm:"index" json:"-"`
	AssignedAgentID   *uint      `gorm:"index" json:"-"`

	// Agent → punkt hisob-kitobi va kontragentlarga qolgan qism (tayinlangach).
	AgentDeclaredPaymentToPunktAt          *time.Time `gorm:"index" json:"-"`
	PunktConfirmedAgentPaymentAt             *time.Time `gorm:"index" json:"-"`
	PunktPostPaymentDeliveredAt            *time.Time `gorm:"index" json:"-"`
	PunktContragentRemainderHandedOverAt   *time.Time `gorm:"index" json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Items []OrderItem `json:"items,omitempty" gorm:"foreignKey:OrderID;constraint:OnDelete:CASCADE"`
}

func (Order) TableName() string {
	return "marketplace_orders"
}

// OrderItem — buyurtma qatori (narx va nom snapshot).
type OrderItem struct {
	ID           uint    `gorm:"primaryKey" json:"id"`
	OrderID      uint    `gorm:"not null;index" json:"order_id"`
	ProductID    uint    `gorm:"not null;index" json:"product_id"`
	ContragentID uint    `gorm:"not null;index" json:"contragent_id"`
	ProductName  string  `gorm:"size:255;not null" json:"product_name"`
	UnitPrice    float64 `gorm:"not null" json:"unit_price"`
	Quantity     float64 `gorm:"not null" json:"quantity"`
	Unit         string  `gorm:"size:16;not null" json:"unit"`
	// Shu qator umumiy summasidan kontragentga berilgan foiz (0–100), punkt belgilaydi.
	PunktContragentPayoutPercent *float64 `json:"-"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (OrderItem) TableName() string {
	return "marketplace_order_items"
}
