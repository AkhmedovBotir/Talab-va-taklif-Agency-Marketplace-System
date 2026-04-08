package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"gorm.io/gorm"
)

type TemplateBrowseRepository interface {
	GetPaginated(page, limit int) ([]adminDomain.LocalShopProductTemplate, int64, error)
	GetByID(id uint) (*adminDomain.LocalShopProductTemplate, error)
	GetImages(templateID uint) ([]string, error)
}

type templateBrowsePostgresRepository struct {
	db *gorm.DB
}

func NewTemplateBrowseRepository(db *gorm.DB) TemplateBrowseRepository {
	return &templateBrowsePostgresRepository{db: db}
}

func (r *templateBrowsePostgresRepository) GetPaginated(page, limit int) ([]adminDomain.LocalShopProductTemplate, int64, error) {
	var rows []adminDomain.LocalShopProductTemplate
	var total int64
	base := r.db.Model(&adminDomain.LocalShopProductTemplate{}).Where("status = ?", "active")
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := base.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *templateBrowsePostgresRepository) GetByID(id uint) (*adminDomain.LocalShopProductTemplate, error) {
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

func (r *templateBrowsePostgresRepository) GetImages(templateID uint) ([]string, error) {
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
