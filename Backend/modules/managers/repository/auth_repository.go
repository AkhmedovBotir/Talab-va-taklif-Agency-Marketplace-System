package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/managers/domain"
	"gorm.io/gorm"
)

type AuthRepository interface {
	GetManagerByPhone(phone string) (*adminDomain.Manager, error)
	GetManagerByID(id uint) (*adminDomain.Manager, error)
	UpdateManager(row *adminDomain.Manager) error
	CreateCode(row *domain.VerificationCode) error
	GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error)
	UpdateCode(row *domain.VerificationCode) error
}

type authPostgresRepository struct{ db *gorm.DB }

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authPostgresRepository{db: db}
}

func (r *authPostgresRepository) GetManagerByPhone(phone string) (*adminDomain.Manager, error) {
	var row adminDomain.Manager
	err := r.db.Where("phone = ?", phone).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *authPostgresRepository) GetManagerByID(id uint) (*adminDomain.Manager, error) {
	var row adminDomain.Manager
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *authPostgresRepository) UpdateManager(row *adminDomain.Manager) error {
	return r.db.Save(row).Error
}
func (r *authPostgresRepository) CreateCode(row *domain.VerificationCode) error {
	return r.db.Create(row).Error
}
func (r *authPostgresRepository) GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error) {
	var row domain.VerificationCode
	err := r.db.Where("phone = ? AND purpose = ? AND used_at IS NULL", phone, purpose).Order("id desc").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}
func (r *authPostgresRepository) UpdateCode(row *domain.VerificationCode) error {
	return r.db.Save(row).Error
}
