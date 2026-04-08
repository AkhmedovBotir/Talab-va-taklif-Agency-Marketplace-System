package domain

import "time"

type IntegrationKPIPayoutTarget struct {
	ID                     uint      `gorm:"primaryKey" json:"id"`
	IntegrationKPIPayoutID uint      `gorm:"column:integration_k_p_i_payout_id;index;not null" json:"integration_kpi_payout_id"`
	Category               string    `gorm:"size:16;not null;index" json:"category"`
	TargetID               uint      `gorm:"index;not null" json:"target_id"`
	CreatedAt              time.Time `json:"created_at"`
}

func (IntegrationKPIPayoutTarget) TableName() string {
	return "integration_kpi_payout_targets"
}
