package domain

import "time"

// IntegrationKPIAllocation — bitta tashqi tizim (integratsiya kaliti) uchun KPI foizlari, yig‘indisi 100%.
type IntegrationKPIAllocation struct {
	ID                  uint `gorm:"primaryKey" json:"id"`
	IntegrationAPIKeyID uint `gorm:"uniqueIndex;not null;index" json:"integration_api_key_id"`
	PunktPercent        int  `gorm:"not null" json:"punkt_percent"`
	AgentPercent        int  `gorm:"not null" json:"agent_percent"`
	ManagerPercent      int  `gorm:"not null" json:"manager_percent"`
	FinancePercent      int  `gorm:"not null" json:"finance_percent"`
	DeliveryPercent     int  `gorm:"not null" json:"delivery_percent"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

func (IntegrationKPIAllocation) TableName() string {
	return "integration_kpi_allocations"
}
