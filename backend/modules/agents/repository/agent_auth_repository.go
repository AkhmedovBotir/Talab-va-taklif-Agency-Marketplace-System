package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/agents/domain"

	"gorm.io/gorm"
)

type AgentAuthRepository interface {
	GetAgentByPhone(phone string) (*adminDomain.Agent, error)
	GetAgentByID(id uint) (*adminDomain.Agent, error)
	UpdateAgent(row *adminDomain.Agent) error
	CreateCode(row *domain.VerificationCode) error
	GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error)
	UpdateCode(row *domain.VerificationCode) error
}

type agentAuthPostgresRepository struct {
	db *gorm.DB
}

func NewAgentAuthRepository(db *gorm.DB) AgentAuthRepository {
	return &agentAuthPostgresRepository{db: db}
}

func (r *agentAuthPostgresRepository) GetAgentByPhone(phone string) (*adminDomain.Agent, error) {
	var row adminDomain.Agent
	err := r.db.Where("phone = ?", phone).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *agentAuthPostgresRepository) GetAgentByID(id uint) (*adminDomain.Agent, error) {
	var row adminDomain.Agent
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *agentAuthPostgresRepository) UpdateAgent(row *adminDomain.Agent) error {
	return r.db.Save(row).Error
}

func (r *agentAuthPostgresRepository) CreateCode(row *domain.VerificationCode) error {
	return r.db.Create(row).Error
}

func (r *agentAuthPostgresRepository) GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error) {
	var row domain.VerificationCode
	err := r.db.
		Where("phone = ? AND purpose = ? AND used_at IS NULL", phone, purpose).
		Order("id desc").
		First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *agentAuthPostgresRepository) UpdateCode(row *domain.VerificationCode) error {
	return r.db.Save(row).Error
}
