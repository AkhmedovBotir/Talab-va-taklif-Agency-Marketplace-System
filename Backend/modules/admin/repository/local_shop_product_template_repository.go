package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	"gorm.io/gorm"
)

type LocalShopProductTemplateRepository interface {
	Create(row *adminDomain.LocalShopProductTemplate) error
	SetImages(templateID uint, images []string) error
	GetPaginated(page, limit int) ([]adminDomain.LocalShopProductTemplate, int64, error)
	GetByID(id uint) (*adminDomain.LocalShopProductTemplate, error)
	GetImages(templateID uint) ([]string, error)
	ListImageRows(templateID uint) ([]adminDomain.LocalShopProductTemplateImage, error)
	GetImageRow(templateID, imageID uint) (*adminDomain.LocalShopProductTemplateImage, error)
	CountImages(templateID uint) (int64, error)
	CreateImageRow(row *adminDomain.LocalShopProductTemplateImage) error
	UpdateImageRow(row *adminDomain.LocalShopProductTemplateImage) error
	DeleteImageRow(imageID uint) error
	Update(row *adminDomain.LocalShopProductTemplate, images []string) error
	Delete(id uint) error
	GetCategoryByID(id uint) (*adminDomain.Category, error)
	GetSubcategoryByID(id uint) (*adminDomain.Category, error)
}

type localShopProductTemplatePostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopProductTemplateRepository(db *gorm.DB) LocalShopProductTemplateRepository {
	return &localShopProductTemplatePostgresRepository{db: db}
}

func (r *localShopProductTemplatePostgresRepository) Create(row *adminDomain.LocalShopProductTemplate) error {
	return r.db.Create(row).Error
}

func (r *localShopProductTemplatePostgresRepository) SetImages(templateID uint, images []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("template_id = ?", templateID).Delete(&adminDomain.LocalShopProductTemplateImage{}).Error; err != nil {
			return err
		}
		if len(images) == 0 {
			return nil
		}
		rows := make([]adminDomain.LocalShopProductTemplateImage, len(images))
		for i, image := range images {
			rows[i] = adminDomain.LocalShopProductTemplateImage{TemplateID: templateID, Image: image, SortOrder: i}
		}
		return tx.Create(&rows).Error
	})
}

func (r *localShopProductTemplatePostgresRepository) GetPaginated(page, limit int) ([]adminDomain.LocalShopProductTemplate, int64, error) {
	var rows []adminDomain.LocalShopProductTemplate
	var total int64
	base := r.db.Model(&adminDomain.LocalShopProductTemplate{})
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := base.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *localShopProductTemplatePostgresRepository) GetByID(id uint) (*adminDomain.LocalShopProductTemplate, error) {
	var row adminDomain.LocalShopProductTemplate
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopProductTemplatePostgresRepository) GetImages(templateID uint) ([]string, error) {
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

func (r *localShopProductTemplatePostgresRepository) ListImageRows(templateID uint) ([]adminDomain.LocalShopProductTemplateImage, error) {
	var rows []adminDomain.LocalShopProductTemplateImage
	err := r.db.Where("template_id = ?", templateID).Order("sort_order asc, id asc").Find(&rows).Error
	return rows, err
}

func (r *localShopProductTemplatePostgresRepository) GetImageRow(templateID, imageID uint) (*adminDomain.LocalShopProductTemplateImage, error) {
	var row adminDomain.LocalShopProductTemplateImage
	err := r.db.Where("id = ? AND template_id = ?", imageID, templateID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopProductTemplatePostgresRepository) CountImages(templateID uint) (int64, error) {
	var n int64
	err := r.db.Model(&adminDomain.LocalShopProductTemplateImage{}).Where("template_id = ?", templateID).Count(&n).Error
	return n, err
}

func (r *localShopProductTemplatePostgresRepository) CreateImageRow(row *adminDomain.LocalShopProductTemplateImage) error {
	return r.db.Create(row).Error
}

func (r *localShopProductTemplatePostgresRepository) UpdateImageRow(row *adminDomain.LocalShopProductTemplateImage) error {
	return r.db.Save(row).Error
}

func (r *localShopProductTemplatePostgresRepository) DeleteImageRow(imageID uint) error {
	return r.db.Delete(&adminDomain.LocalShopProductTemplateImage{}, imageID).Error
}

func (r *localShopProductTemplatePostgresRepository) Update(row *adminDomain.LocalShopProductTemplate, images []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(row).Error; err != nil {
			return err
		}
		if images != nil {
			return r.SetImages(row.ID, images)
		}
		return nil
	})
}

func (r *localShopProductTemplatePostgresRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("template_id = ?", id).Delete(&adminDomain.LocalShopProductTemplateImage{}).Error; err != nil {
			return err
		}
		return tx.Delete(&adminDomain.LocalShopProductTemplate{}, id).Error
	})
}

func (r *localShopProductTemplatePostgresRepository) GetCategoryByID(id uint) (*adminDomain.Category, error) {
	var row adminDomain.Category
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopProductTemplatePostgresRepository) GetSubcategoryByID(id uint) (*adminDomain.Category, error) {
	var row adminDomain.Category
	err := r.db.Where("id = ? AND parent_id IS NOT NULL", id).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}
