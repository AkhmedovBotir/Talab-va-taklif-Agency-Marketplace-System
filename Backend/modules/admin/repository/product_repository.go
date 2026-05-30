package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	contrDomain "backend/modules/contragents/domain"
	"gorm.io/gorm"
)

type AdminProductRepository interface {
	NextProductCode() (uint64, error)
	Create(row *contrDomain.Product) error
	SetImages(productID uint, images []string) error
	GetImagesByProductIDs(productIDs []uint) (map[uint][]string, error)
	GetPaginated(page, limit int, contragentID *uint, moderationStatus *string) ([]contrDomain.Product, int64, error)
	GetByID(id uint) (*contrDomain.Product, error)
	GetImages(productID uint) ([]string, error)
	ListImageRows(productID uint) ([]contrDomain.ProductImage, error)
	GetImageRow(productID, imageID uint) (*contrDomain.ProductImage, error)
	CountImages(productID uint) (int64, error)
	CreateImageRow(row *contrDomain.ProductImage) error
	UpdateImageRow(row *contrDomain.ProductImage) error
	DeleteImageRow(imageID uint) error
	Update(row *contrDomain.Product, images []string) error
	Delete(id uint) error

	GetCategoryByID(id uint) (*adminDomain.Category, error)
	GetSubcategoryByID(id uint) (*adminDomain.Category, error)
	ContragentExists(id uint) (bool, error)
}

type adminProductPostgresRepository struct {
	db *gorm.DB
}

func NewAdminProductRepository(db *gorm.DB) AdminProductRepository {
	return &adminProductPostgresRepository{db: db}
}

func (r *adminProductPostgresRepository) NextProductCode() (uint64, error) {
	type result struct {
		Max uint64 `gorm:"column:max"`
	}
	var res result
	if err := r.db.Model(&contrDomain.Product{}).Select("COALESCE(MAX(product_code), 0) + 1 AS max").Scan(&res).Error; err != nil {
		return 0, err
	}
	return res.Max, nil
}

func (r *adminProductPostgresRepository) Create(row *contrDomain.Product) error {
	return r.db.Create(row).Error
}

func (r *adminProductPostgresRepository) SetImages(productID uint, images []string) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", productID).Delete(&contrDomain.ProductImage{}).Error; err != nil {
			return err
		}
		if len(images) > 0 {
			rows := make([]contrDomain.ProductImage, len(images))
			for i, image := range images {
				rows[i] = contrDomain.ProductImage{ProductID: productID, Image: image, SortOrder: i}
			}
			if err := tx.Create(&rows).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *adminProductPostgresRepository) GetPaginated(page, limit int, contragentID *uint, moderationStatus *string) ([]contrDomain.Product, int64, error) {
	var rows []contrDomain.Product
	var total int64
	base := r.db.Model(&contrDomain.Product{})
	if contragentID != nil {
		base = base.Where("contragent_id = ?", *contragentID)
	}
	if moderationStatus != nil && *moderationStatus != "" {
		base = base.Where("moderation_status = ?", *moderationStatus)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	err := base.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *adminProductPostgresRepository) GetByID(id uint) (*contrDomain.Product, error) {
	var row contrDomain.Product
	err := r.db.First(&row, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *adminProductPostgresRepository) GetImages(productID uint) ([]string, error) {
	m, err := r.GetImagesByProductIDs([]uint{productID})
	if err != nil {
		return nil, err
	}
	return m[productID], nil
}

func (r *adminProductPostgresRepository) GetImagesByProductIDs(productIDs []uint) (map[uint][]string, error) {
	out := make(map[uint][]string)
	if len(productIDs) == 0 {
		return out, nil
	}
	var rows []contrDomain.ProductImage
	if err := r.db.Where("product_id IN ?", productIDs).Order("product_id asc, sort_order asc, id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.ProductID] = append(out[row.ProductID], row.Image)
	}
	return out, nil
}

func (r *adminProductPostgresRepository) ListImageRows(productID uint) ([]contrDomain.ProductImage, error) {
	var rows []contrDomain.ProductImage
	err := r.db.Where("product_id = ?", productID).Order("sort_order asc, id asc").Find(&rows).Error
	return rows, err
}

func (r *adminProductPostgresRepository) GetImageRow(productID, imageID uint) (*contrDomain.ProductImage, error) {
	var row contrDomain.ProductImage
	err := r.db.Where("id = ? AND product_id = ?", imageID, productID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *adminProductPostgresRepository) CountImages(productID uint) (int64, error) {
	var n int64
	err := r.db.Model(&contrDomain.ProductImage{}).Where("product_id = ?", productID).Count(&n).Error
	return n, err
}

func (r *adminProductPostgresRepository) CreateImageRow(row *contrDomain.ProductImage) error {
	return r.db.Create(row).Error
}

func (r *adminProductPostgresRepository) UpdateImageRow(row *contrDomain.ProductImage) error {
	return r.db.Save(row).Error
}

func (r *adminProductPostgresRepository) DeleteImageRow(imageID uint) error {
	return r.db.Delete(&contrDomain.ProductImage{}, imageID).Error
}

func (r *adminProductPostgresRepository) Update(row *contrDomain.Product, images []string) error {
	if err := r.db.Save(row).Error; err != nil {
		return err
	}
	if images != nil {
		return r.SetImages(row.ID, images)
	}
	return nil
}

func (r *adminProductPostgresRepository) Delete(id uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("product_id = ?", id).Delete(&contrDomain.ProductImage{}).Error; err != nil {
			return err
		}
		return tx.Delete(&contrDomain.Product{}, id).Error
	})
}

func (r *adminProductPostgresRepository) GetCategoryByID(id uint) (*adminDomain.Category, error) {
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

func (r *adminProductPostgresRepository) GetSubcategoryByID(id uint) (*adminDomain.Category, error) {
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

func (r *adminProductPostgresRepository) ContragentExists(id uint) (bool, error) {
	var count int64
	if err := r.db.Model(&adminDomain.Contragent{}).Where("id = ?", id).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
