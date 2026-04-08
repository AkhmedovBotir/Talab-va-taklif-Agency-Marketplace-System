package repository

import (
	"errors"

	dpDomain "backend/modules/deliveryproviders/domain"
	lsDomain "backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type AuthRepository interface {
	GetCourierByPhone(phone string) (*lsDomain.Courier, error)
	GetCourierByID(id uint) (*lsDomain.Courier, error)
	UpdateCourier(row *lsDomain.Courier) error
	CreateCode(row *dpDomain.VerificationCode) error
	GetLatestActiveCode(phone, purpose string) (*dpDomain.VerificationCode, error)
	UpdateCode(row *dpDomain.VerificationCode) error
}

type authPostgresRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authPostgresRepository{db: db}
}

func (r *authPostgresRepository) GetCourierByPhone(phone string) (*lsDomain.Courier, error) {
	var row lsDomain.Courier
	err := r.db.Where("phone = ?", phone).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *authPostgresRepository) GetCourierByID(id uint) (*lsDomain.Courier, error) {
	var row lsDomain.Courier
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *authPostgresRepository) UpdateCourier(row *lsDomain.Courier) error {
	return r.db.Save(row).Error
}

func (r *authPostgresRepository) CreateCode(row *dpDomain.VerificationCode) error {
	return r.db.Create(row).Error
}

func (r *authPostgresRepository) GetLatestActiveCode(phone, purpose string) (*dpDomain.VerificationCode, error) {
	var row dpDomain.VerificationCode
	err := r.db.Where("phone = ? AND purpose = ? AND used_at IS NULL", phone, purpose).Order("id desc").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *authPostgresRepository) UpdateCode(row *dpDomain.VerificationCode) error {
	return r.db.Save(row).Error
}
