package repository

import (
	"errors"

	"backend/modules/core/domain"
	"gorm.io/gorm"
)

var ErrKPIAllocationNotFound = errors.New("KPI ajratish topilmadi")

type IntegrationKPIAllocationRepository interface {
	GetByIntegrationKeyID(integrationKeyID uint) (*domain.IntegrationKPIAllocation, error)
	Create(row *domain.IntegrationKPIAllocation) error
	UpdateByIntegrationKeyID(integrationKeyID uint, punkt, agent, manager, finance, delivery int) error
	DeleteByIntegrationKeyID(integrationKeyID uint) error
}

type integrationKPIAllocationPostgresRepository struct {
	db *gorm.DB
}

func NewIntegrationKPIAllocationRepository(db *gorm.DB) IntegrationKPIAllocationRepository {
	return &integrationKPIAllocationPostgresRepository{db: db}
}

func (r *integrationKPIAllocationPostgresRepository) GetByIntegrationKeyID(integrationKeyID uint) (*domain.IntegrationKPIAllocation, error) {
	var row domain.IntegrationKPIAllocation
	err := r.db.Where("integration_api_key_id = ?", integrationKeyID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *integrationKPIAllocationPostgresRepository) Create(row *domain.IntegrationKPIAllocation) error {
	return r.db.Create(row).Error
}

func (r *integrationKPIAllocationPostgresRepository) UpdateByIntegrationKeyID(integrationKeyID uint, punkt, agent, manager, finance, delivery int) error {
	res := r.db.Model(&domain.IntegrationKPIAllocation{}).
		Where("integration_api_key_id = ?", integrationKeyID).
		Updates(map[string]interface{}{
			"punkt_percent":    punkt,
			"agent_percent":    agent,
			"manager_percent":  manager,
			"finance_percent":  finance,
			"delivery_percent": delivery,
		})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrKPIAllocationNotFound
	}
	return nil
}

func (r *integrationKPIAllocationPostgresRepository) DeleteByIntegrationKeyID(integrationKeyID uint) error {
	res := r.db.Where("integration_api_key_id = ?", integrationKeyID).Delete(&domain.IntegrationKPIAllocation{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrKPIAllocationNotFound
	}
	return nil
}
