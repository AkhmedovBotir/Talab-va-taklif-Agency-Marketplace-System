package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type LocalShopAuthRepository interface {
	GetByPhone(phone string) (*adminDomain.NeighborhoodShop, error)
	GetByID(id uint) (*adminDomain.NeighborhoodShop, error)
	Update(row *adminDomain.NeighborhoodShop) error
	CreateCode(row *domain.VerificationCode) error
	GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error)
	UpdateCode(row *domain.VerificationCode) error
}

type localShopAuthPostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopAuthRepository(db *gorm.DB) LocalShopAuthRepository {
	return &localShopAuthPostgresRepository{db: db}
}

func (r *localShopAuthPostgresRepository) GetByPhone(phone string) (*adminDomain.NeighborhoodShop, error) {
	var row adminDomain.NeighborhoodShop
	err := r.db.Where("phone = ?", phone).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopAuthPostgresRepository) GetByID(id uint) (*adminDomain.NeighborhoodShop, error) {
	var row adminDomain.NeighborhoodShop
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopAuthPostgresRepository) Update(row *adminDomain.NeighborhoodShop) error {
	return r.db.Save(row).Error
}

func (r *localShopAuthPostgresRepository) CreateCode(row *domain.VerificationCode) error {
	return r.db.Create(row).Error
}

func (r *localShopAuthPostgresRepository) GetLatestActiveCode(phone, purpose string) (*domain.VerificationCode, error) {
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

func (r *localShopAuthPostgresRepository) UpdateCode(row *domain.VerificationCode) error {
	return r.db.Save(row).Error
}
