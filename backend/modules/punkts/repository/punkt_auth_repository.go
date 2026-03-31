package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/punkts/domain"

	"gorm.io/gorm"
)

type PunktAuthRepository interface {
	GetPunktByPhone(phone string) (*adminDomain.Punkt, error)
	GetPunktByID(id uint) (*adminDomain.Punkt, error)
	UpdatePunkt(row *adminDomain.Punkt) error
	CreateCode(row *domain.VerificationCode) error
	GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error)
	UpdateCode(row *domain.VerificationCode) error
}

type punktAuthPostgresRepository struct {
	db *gorm.DB
}

func NewPunktAuthRepository(db *gorm.DB) PunktAuthRepository {
	return &punktAuthPostgresRepository{db: db}
}

func (r *punktAuthPostgresRepository) GetPunktByPhone(phone string) (*adminDomain.Punkt, error) {
	var row adminDomain.Punkt
	err := r.db.Where("phone = ?", phone).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *punktAuthPostgresRepository) GetPunktByID(id uint) (*adminDomain.Punkt, error) {
	var row adminDomain.Punkt
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *punktAuthPostgresRepository) UpdatePunkt(row *adminDomain.Punkt) error {
	return r.db.Save(row).Error
}

func (r *punktAuthPostgresRepository) CreateCode(row *domain.VerificationCode) error {
	return r.db.Create(row).Error
}

func (r *punktAuthPostgresRepository) GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error) {
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

func (r *punktAuthPostgresRepository) UpdateCode(row *domain.VerificationCode) error {
	return r.db.Save(row).Error
}
