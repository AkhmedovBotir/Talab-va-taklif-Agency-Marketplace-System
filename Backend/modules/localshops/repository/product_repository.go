package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type ProductRepository interface {
	Create(row *domain.Product) error
	GetPaginated(localShopID uint, page, limit int) ([]domain.Product, int64, error)
	GetByID(localShopID, id uint) (*domain.Product, error)
	Update(row *domain.Product) error
	Delete(localShopID, id uint) error
	GetTemplateByID(id uint) (*adminDomain.LocalShopProductTemplate, error)
	GetTemplateImages(templateID uint) ([]string, error)
}

type productPostgresRepository struct {
	db *gorm.DB
}

func NewProductRepository(db *gorm.DB) ProductRepository {
	return &productPostgresRepository{db: db}
}

func (r *productPostgresRepository) Create(row *domain.Product) error {
	return r.db.Create(row).Error
}

func (r *productPostgresRepository) GetPaginated(localShopID uint, page, limit int) ([]domain.Product, int64, error) {
	var rows []domain.Product
	var total int64
	base := r.db.Model(&domain.Product{}).Where("local_shop_id = ?", localShopID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := base.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *productPostgresRepository) GetByID(localShopID, id uint) (*domain.Product, error) {
	var row domain.Product
	err := r.db.Where("id = ? AND local_shop_id = ?", id, localShopID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *productPostgresRepository) Update(row *domain.Product) error {
	return r.db.Save(row).Error
}

func (r *productPostgresRepository) Delete(localShopID, id uint) error {
	return r.db.Where("id = ? AND local_shop_id = ?", id, localShopID).Delete(&domain.Product{}).Error
}

func (r *productPostgresRepository) GetTemplateByID(id uint) (*adminDomain.LocalShopProductTemplate, error) {
	var row adminDomain.LocalShopProductTemplate
	err := r.db.Where("id = ? AND status = ?", id, "active").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *productPostgresRepository) GetTemplateImages(templateID uint) ([]string, error) {
	var rows []adminDomain.LocalShopProductTemplateImage
	if err := r.db.Where("template_id = ?", templateID).Order("sort_order asc, id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]string, 0, len(rows))
	for _, row := range rows {
		out = append(out, row.Image)
	}
	return out, nil
}
