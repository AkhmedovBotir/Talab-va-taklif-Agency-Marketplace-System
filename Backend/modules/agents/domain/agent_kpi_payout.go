package domain

import "time"

// AgentKPIPayout — agentga KPI bo‘yicha to‘langan summa.
type AgentKPIPayout struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	AgentID   uint      `gorm:"index;not null" json:"agent_id"`
	Amount    float64   `gorm:"not null" json:"amount"`
	PaidAt    time.Time `gorm:"index;not null" json:"paid_at"`
	Note      string    `gorm:"size:255" json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (AgentKPIPayout) TableName() string {
	return "agent_kpi_payouts"
}
