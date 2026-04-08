package repository

import (
	"errors"

	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type QRRepository interface {
	Create(row *domain.QR) error
	GetPaginated(page, limit int) ([]domain.QR, int64, error)
	GetByID(id uint) (*domain.QR, error)
	GetByCode(code string) (*domain.QR, error)
	Update(row *domain.QR) error
	Delete(id uint) error
	IncrementScanCountByCode(code string) error
}

type qrPostgresRepository struct {
	db *gorm.DB
}

func NewQRRepository(db *gorm.DB) QRRepository {
	return &qrPostgresRepository{db: db}
}

func (r *qrPostgresRepository) Create(row *domain.QR) error {
	return r.db.Create(row).Error
}

func (r *qrPostgresRepository) GetPaginated(page, limit int) ([]domain.QR, int64, error) {
	var rows []domain.QR
	var total int64
	if err := r.db.Model(&domain.QR{}).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := r.db.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *qrPostgresRepository) GetByID(id uint) (*domain.QR, error) {
	var row domain.QR
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *qrPostgresRepository) GetByCode(code string) (*domain.QR, error) {
	var row domain.QR
	err := r.db.Where("code = ?", code).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *qrPostgresRepository) Update(row *domain.QR) error {
	return r.db.Save(row).Error
}

func (r *qrPostgresRepository) Delete(id uint) error {
	return r.db.Delete(&domain.QR{}, id).Error
}

func (r *qrPostgresRepository) IncrementScanCountByCode(code string) error {
	return r.db.Model(&domain.QR{}).
		Where("code = ?", code).
		UpdateColumn("scan_count", gorm.Expr("scan_count + ?", 1)).
		Error
}

