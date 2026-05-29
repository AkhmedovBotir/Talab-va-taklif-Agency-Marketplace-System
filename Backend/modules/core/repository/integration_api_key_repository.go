package repository

import (
	"errors"

	"backend/modules/core/domain"
	"gorm.io/gorm"
)

var ErrIntegrationKeyNotFound = errors.New("integratsiya kaliti topilmadi")

type IntegrationAPIKeyRepository interface {
	Create(row *domain.IntegrationAPIKey) error
	List() ([]domain.IntegrationAPIKey, error)
	ListForAuth() ([]domain.IntegrationAPIKey, error)
	GetByID(id uint) (*domain.IntegrationAPIKey, error)
	UpdateName(id uint, name string) error
	Delete(id uint) error
}

type integrationAPIKeyPostgresRepository struct {
	db *gorm.DB
}

func NewIntegrationAPIKeyRepository(db *gorm.DB) IntegrationAPIKeyRepository {
	return &integrationAPIKeyPostgresRepository{db: db}
}

func (r *integrationAPIKeyPostgresRepository) Create(row *domain.IntegrationAPIKey) error {
	return r.db.Create(row).Error
}

func (r *integrationAPIKeyPostgresRepository) List() ([]domain.IntegrationAPIKey, error) {
	var rows []domain.IntegrationAPIKey
	err := r.db.Order("id desc").Find(&rows).Error
	return rows, err
}

func (r *integrationAPIKeyPostgresRepository) ListForAuth() ([]domain.IntegrationAPIKey, error) {
	var rows []domain.IntegrationAPIKey
	err := r.db.Model(&domain.IntegrationAPIKey{}).Select("id", "name", "key_hash").Find(&rows).Error
	return rows, err
}

func (r *integrationAPIKeyPostgresRepository) GetByID(id uint) (*domain.IntegrationAPIKey, error) {
	var row domain.IntegrationAPIKey
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *integrationAPIKeyPostgresRepository) UpdateName(id uint, name string) error {
	res := r.db.Model(&domain.IntegrationAPIKey{}).Where("id = ?", id).Update("name", name)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrIntegrationKeyNotFound
	}
	return nil
}

func (r *integrationAPIKeyPostgresRepository) Delete(id uint) error {
	res := r.db.Delete(&domain.IntegrationAPIKey{}, id)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return ErrIntegrationKeyNotFound
	}
	return nil
}
