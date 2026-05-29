package domain

import "time"

const (
	NeighborhoodShopBillingTypeMonthly = "monthly"
	NeighborhoodShopBillingTypeFree    = "free"
)

// NeighborhoodShopSubscription — bitta maxalla do'koni uchun obuna (oylik to'lov yoki bepul muddat).
type NeighborhoodShopSubscription struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	NeighborhoodShopID uint      `gorm:"not null;uniqueIndex" json:"neighborhood_shop_id"`
	BillingType        string    `gorm:"size:16;not null;index" json:"billing_type"`
	MonthlyPriceUZS    *float64  `json:"monthly_price_uzs,omitempty"`
	FreeMonths         int       `gorm:"not null;default:0" json:"free_months"`
	PeriodStartAt      time.Time `gorm:"not null" json:"period_start_at"`
	PeriodEndAt        time.Time `gorm:"not null;index" json:"period_end_at"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (NeighborhoodShopSubscription) TableName() string {
	return "neighborhood_shop_subscriptions"
}
