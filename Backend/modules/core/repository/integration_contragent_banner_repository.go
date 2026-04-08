package repository

import (
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type IntegrationContragentBannerRepository interface {
	Create(row *coreDomain.IntegrationContragentBanner) error
	List() ([]coreDomain.IntegrationContragentBanner, error)
	GetByID(id uint) (*coreDomain.IntegrationContragentBanner, error)
	Update(row *coreDomain.IntegrationContragentBanner) error
	Delete(id uint) error
}

type integrationContragentBannerPostgresRepository struct{ db *gorm.DB }

func NewIntegrationContragentBannerRepository(db *gorm.DB) IntegrationContragentBannerRepository {
	return &integrationContragentBannerPostgresRepository{db: db}
}

func (r *integrationContragentBannerPostgresRepository) Create(row *coreDomain.IntegrationContragentBanner) error {
	return r.db.Create(row).Error
}
func (r *integrationContragentBannerPostgresRepository) List() ([]coreDomain.IntegrationContragentBanner, error) {
	var rows []coreDomain.IntegrationContragentBanner
	err := r.db.Order("id desc").Find(&rows).Error
	return rows, err
}
func (r *integrationContragentBannerPostgresRepository) GetByID(id uint) (*coreDomain.IntegrationContragentBanner, error) {
	var row coreDomain.IntegrationContragentBanner
	if err := r.db.First(&row, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}
func (r *integrationContragentBannerPostgresRepository) Update(row *coreDomain.IntegrationContragentBanner) error {
	return r.db.Save(row).Error
}
func (r *integrationContragentBannerPostgresRepository) Delete(id uint) error {
	return r.db.Delete(&coreDomain.IntegrationContragentBanner{}, id).Error
}
