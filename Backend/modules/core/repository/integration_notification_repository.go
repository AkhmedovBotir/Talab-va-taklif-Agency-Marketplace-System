package repository

import (
	"errors"

	"backend/modules/core/domain"
	"gorm.io/gorm"
)

type IntegrationNotificationRepository interface {
	Create(row *domain.IntegrationNotification) error
	List(page, limit int) ([]domain.IntegrationNotification, int64, error)
	GetByID(id uint) (*domain.IntegrationNotification, error)
	Update(row *domain.IntegrationNotification) error
	Delete(id uint) error
}

type integrationNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewIntegrationNotificationRepository(db *gorm.DB) IntegrationNotificationRepository {
	return &integrationNotificationPostgresRepository{db: db}
}

func (r *integrationNotificationPostgresRepository) Create(row *domain.IntegrationNotification) error {
	return r.db.Create(row).Error
}

func (r *integrationNotificationPostgresRepository) List(page, limit int) ([]domain.IntegrationNotification, int64, error) {
	var rows []domain.IntegrationNotification
	var total int64
	if err := r.db.Model(&domain.IntegrationNotification{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := r.db.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *integrationNotificationPostgresRepository) GetByID(id uint) (*domain.IntegrationNotification, error) {
	var row domain.IntegrationNotification
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *integrationNotificationPostgresRepository) Update(row *domain.IntegrationNotification) error {
	return r.db.Save(row).Error
}

func (r *integrationNotificationPostgresRepository) Delete(id uint) error {
	return r.db.Delete(&domain.IntegrationNotification{}, id).Error
}

