package domain

import "time"

// PunktKPIPayout — punktga KPI bo‘yicha to‘langan summa (keyinroq admin/ boshqa API yozishi mumkin).
type PunktKPIPayout struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	PunktID   uint      `gorm:"index;not null" json:"punkt_id"`
	Amount    float64   `gorm:"not null" json:"amount"`
	PaidAt    time.Time `gorm:"index;not null" json:"paid_at"`
	Note      string    `gorm:"size:255" json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (PunktKPIPayout) TableName() string {
	return "punkt_kpi_payouts"
}
