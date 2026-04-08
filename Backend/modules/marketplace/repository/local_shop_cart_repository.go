package repository

import (
	"errors"

	"backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type LocalShopProductInfo struct {
	ID            uint
	LocalShopID   uint
	TemplateID    uint
	Quantity      float64
	Price         float64
	OriginalPrice float64
	ShopName      string
	RegionID      uint
	DistrictID    uint
	MFYID         uint
	Phone         string
	TemplateName  string
	Description   string
	CategoryID    uint
	SubcategoryID uint
	Unit          string
	UnitSize      string
}

type LocalShopAreaInfo struct {
	LocalShopID uint
	MFYID       uint
	MFYName     string
}

type LocalShopCartRepository interface {
	ListItemsByUserID(userID uint) ([]domain.LocalShopCartItem, error)
	GetItemByIDForUser(id, userID uint) (*domain.LocalShopCartItem, error)
	GetItemByUserAndProduct(userID, localShopProductID uint) (*domain.LocalShopCartItem, error)
	CreateItem(item *domain.LocalShopCartItem) error
	SaveItem(item *domain.LocalShopCartItem) error
	UpdateItemQuantity(id, userID uint, quantity float64) error
	DeleteItem(id, userID uint) error
	DeleteAllByUser(userID uint) error
	GetActiveProductByID(id uint) (*LocalShopProductInfo, error)
	GetActiveProductsByIDs(ids []uint) ([]LocalShopProductInfo, error)
	GetTemplateImages(templateIDs []uint) (map[uint][]string, error)
	GetDeliveryAreas(shopIDs []uint) ([]LocalShopAreaInfo, error)
}

type localShopCartPostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopCartRepository(db *gorm.DB) LocalShopCartRepository {
	return &localShopCartPostgresRepository{db: db}
}

func (r *localShopCartPostgresRepository) ListItemsByUserID(userID uint) ([]domain.LocalShopCartItem, error) {
	var rows []domain.LocalShopCartItem
	err := r.db.Where("user_id = ?", userID).Order("id asc").Find(&rows).Error
	return rows, err
}

func (r *localShopCartPostgresRepository) GetItemByIDForUser(id, userID uint) (*domain.LocalShopCartItem, error) {
	var row domain.LocalShopCartItem
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopCartPostgresRepository) GetItemByUserAndProduct(userID, localShopProductID uint) (*domain.LocalShopCartItem, error) {
	var row domain.LocalShopCartItem
	err := r.db.Where("user_id = ? AND local_shop_product_id = ?", userID, localShopProductID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *localShopCartPostgresRepository) CreateItem(item *domain.LocalShopCartItem) error {
	return r.db.Create(item).Error
}

func (r *localShopCartPostgresRepository) SaveItem(item *domain.LocalShopCartItem) error {
	return r.db.Save(item).Error
}

func (r *localShopCartPostgresRepository) UpdateItemQuantity(id, userID uint, quantity float64) error {
	res := r.db.Model(&domain.LocalShopCartItem{}).Where("id = ? AND user_id = ?", id, userID).Update("quantity", quantity)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *localShopCartPostgresRepository) DeleteItem(id, userID uint) error {
	res := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&domain.LocalShopCartItem{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *localShopCartPostgresRepository) DeleteAllByUser(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.LocalShopCartItem{}).Error
}

func (r *localShopCartPostgresRepository) baseActiveProductsQuery() *gorm.DB {
	return r.db.Table("local_shop_products p").
		Joins("JOIN neighborhood_shops ns ON ns.id = p.local_shop_id").
		Joins("JOIN local_shop_product_templates t ON t.id = p.template_id").
		Where("ns.status = ? AND t.status = ?", "active", "active")
}

func (r *localShopCartPostgresRepository) GetActiveProductByID(id uint) (*LocalShopProductInfo, error) {
	var row LocalShopProductInfo
	err := r.baseActiveProductsQuery().
		Select(`
			p.id, p.local_shop_id, p.template_id, p.quantity, p.price, p.original_price,
			ns.name AS shop_name, ns.region_id, ns.district_id, ns.mfy_id, ns.phone,
			t.name AS template_name, t.description, t.category_id, t.subcategory_id, t.unit, t.unit_size
		`).
		Where("p.id = ?", id).
		Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == 0 {
		return nil, nil
	}
	return &row, nil
}

func (r *localShopCartPostgresRepository) GetActiveProductsByIDs(ids []uint) ([]LocalShopProductInfo, error) {
	if len(ids) == 0 {
		return []LocalShopProductInfo{}, nil
	}
	var rows []LocalShopProductInfo
	err := r.baseActiveProductsQuery().
		Select(`
			p.id, p.local_shop_id, p.template_id, p.quantity, p.price, p.original_price,
			ns.name AS shop_name, ns.region_id, ns.district_id, ns.mfy_id, ns.phone,
			t.name AS template_name, t.description, t.category_id, t.subcategory_id, t.unit, t.unit_size
		`).
		Where("p.id IN ?", ids).
		Find(&rows).Error
	return rows, err
}

func (r *localShopCartPostgresRepository) GetTemplateImages(templateIDs []uint) (map[uint][]string, error) {
	out := map[uint][]string{}
	if len(templateIDs) == 0 {
		return out, nil
	}
	type row struct {
		TemplateID uint
		Image      string
	}
	var rows []row
	if err := r.db.Table("local_shop_product_template_images").
		Select("template_id, image").
		Where("template_id IN ?", templateIDs).
		Order("template_id asc, sort_order asc, id asc").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.TemplateID] = append(out[row.TemplateID], row.Image)
	}
	return out, nil
}

func (r *localShopCartPostgresRepository) GetDeliveryAreas(shopIDs []uint) ([]LocalShopAreaInfo, error) {
	if len(shopIDs) == 0 {
		return []LocalShopAreaInfo{}, nil
	}
	var rows []LocalShopAreaInfo
	err := r.db.Table("local_shop_service_areas lssa").
		Select("lssa.local_shop_id, lssa.mfy_id, m.name as mfy_name").
		Joins("JOIN mfies m ON m.id = lssa.mfy_id").
		Where("lssa.local_shop_id IN ?", shopIDs).
		Order("lssa.local_shop_id asc, lssa.mfy_id asc").
		Scan(&rows).Error
	return rows, err
}
