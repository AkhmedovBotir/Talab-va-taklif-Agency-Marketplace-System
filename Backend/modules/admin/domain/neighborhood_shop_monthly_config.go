package domain

import "time"

// NeighborhoodShopMonthlyConfig — barcha maxalla do'konlari uchun umumiy oylik narx (yagona yozuv, id=1).
type NeighborhoodShopMonthlyConfig struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	MonthlyPriceUZS float64   `gorm:"not null;default:0" json:"monthly_price_uzs"`
	Currency        string    `gorm:"size:8;not null;default:UZS" json:"currency"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

func (NeighborhoodShopMonthlyConfig) TableName() string {
	return "neighborhood_shop_monthly_configs"
}

const NeighborhoodShopMonthlyConfigSingletonID uint = 1
