package domain

import "time"

// IntegrationKPIPayout — integratsiya kaliti bo‘yicha KPI to‘lovi (rol bo‘yicha).
type IntegrationKPIPayout struct {
	ID                  uint      `gorm:"primaryKey" json:"id"`
	IntegrationAPIKeyID uint      `gorm:"index;not null" json:"integration_api_key_id"`
	Category            string    `gorm:"size:16;not null;index" json:"category"` // punkt, agent, manager, finance, delivery
	Amount              float64   `gorm:"not null" json:"amount"`
	PaidAt              time.Time `gorm:"index;not null" json:"paid_at"`
	// PeriodFrom / PeriodTo — hisobotdagi from_utc / to_utc bilan mos kelganda to‘lov shu davr "paid" ga kiradi (paid_at boshqa kunda bo‘lishi mumkin).
	PeriodFrom *string `gorm:"size:10" json:"period_from,omitempty"`
	PeriodTo   *string `gorm:"size:10" json:"period_to,omitempty"`
	Note       string  `gorm:"size:255" json:"note,omitempty"`
	TargetIDs  []uint  `gorm:"-" json:"target_ids,omitempty"`
	CreatedAt  time.Time `json:"created_at"`
}

func (IntegrationKPIPayout) TableName() string {
	return "integration_kpi_payouts"
}
