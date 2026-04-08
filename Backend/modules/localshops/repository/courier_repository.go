package repository

import (
	"errors"

	"backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type CourierRepository interface {
	Create(row *domain.Courier) error
	GetPaginated(localShopID uint, page, limit int) ([]domain.Courier, int64, error)
	GetByID(localShopID, id uint) (*domain.Courier, error)
	Update(row *domain.Courier) error
	Delete(localShopID, id uint) error
	ExistsByPhone(localShopID uint, phone string, exceptID uint) (bool, error)
}

type courierPostgresRepository struct {
	db *gorm.DB
}

func NewCourierRepository(db *gorm.DB) CourierRepository {
	return &courierPostgresRepository{db: db}
}

func (r *courierPostgresRepository) Create(row *domain.Courier) error {
	return r.db.Create(row).Error
}

func (r *courierPostgresRepository) GetPaginated(localShopID uint, page, limit int) ([]domain.Courier, int64, error) {
	var rows []domain.Courier
	var total int64
	base := r.db.Model(&domain.Courier{}).Where("local_shop_id = ?", localShopID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := base.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *courierPostgresRepository) GetByID(localShopID, id uint) (*domain.Courier, error) {
	var row domain.Courier
	err := r.db.Where("id = ? AND local_shop_id = ?", id, localShopID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *courierPostgresRepository) Update(row *domain.Courier) error {
	return r.db.Save(row).Error
}

func (r *courierPostgresRepository) Delete(localShopID, id uint) error {
	return r.db.Where("id = ? AND local_shop_id = ?", id, localShopID).Delete(&domain.Courier{}).Error
}

func (r *courierPostgresRepository) ExistsByPhone(localShopID uint, phone string, exceptID uint) (bool, error) {
	var count int64
	q := r.db.Model(&domain.Courier{}).Where("local_shop_id = ? AND phone = ?", localShopID, phone)
	if exceptID > 0 {
		q = q.Where("id <> ?", exceptID)
	}
	if err := q.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
