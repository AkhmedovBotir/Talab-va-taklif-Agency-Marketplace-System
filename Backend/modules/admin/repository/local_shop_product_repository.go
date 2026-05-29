package repository

import (
	"strings"
	"time"

	lsdomain "backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type LocalShopProductListFilter struct {
	Page           int
	Limit          int
	Q              string
	LocalShopID    *uint
	TemplateID     *uint
	RegionID       *uint
	DistrictID     *uint
	MFYID          *uint
	ShopStatus     string
	TemplateStatus string
}

type LocalShopProductRow struct {
	ID             uint
	LocalShopID    uint
	TemplateID     uint
	Quantity       float64
	Price          float64
	OriginalPrice  float64
	CreatedAt      time.Time
	UpdatedAt      time.Time
	ShopName       string
	ShopStatus     string
	RegionID       uint
	DistrictID     uint
	MFYID          uint
	Phone          string
	TemplateName   string
	TemplateStatus string
	Description    string
	CategoryID     uint
	SubcategoryID  uint
	Unit           string
	UnitSize       string
}

type LocalShopProductRepository interface {
	GetPaginated(filter LocalShopProductListFilter) ([]LocalShopProductRow, int64, error)
	GetByID(id uint) (*LocalShopProductRow, error)
	GetTemplateImages(templateIDs []uint) (map[uint][]string, error)
	GetDeliveryAreas(shopIDs []uint) (map[uint][]LocalShopProductDeliveryAreaRow, error)
}

type LocalShopProductDeliveryAreaRow struct {
	LocalShopID uint
	MFYID       uint
	MFYName     string
}

type localShopProductPostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopProductRepository(db *gorm.DB) LocalShopProductRepository {
	return &localShopProductPostgresRepository{db: db}
}

func (r *localShopProductPostgresRepository) baseQuery(filter LocalShopProductListFilter) *gorm.DB {
	base := r.db.Model(&lsdomain.Product{}).
		Joins("JOIN neighborhood_shops ns ON ns.id = local_shop_products.local_shop_id").
		Joins("JOIN local_shop_product_templates t ON t.id = local_shop_products.template_id")

	q := strings.TrimSpace(filter.Q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("t.name ILIKE ? OR ns.name ILIKE ?", p, p)
	}
	if filter.LocalShopID != nil {
		base = base.Where("local_shop_products.local_shop_id = ?", *filter.LocalShopID)
	}
	if filter.TemplateID != nil {
		base = base.Where("local_shop_products.template_id = ?", *filter.TemplateID)
	}
	if filter.RegionID != nil {
		base = base.Where("ns.region_id = ?", *filter.RegionID)
	}
	if filter.DistrictID != nil {
		base = base.Where("ns.district_id = ?", *filter.DistrictID)
	}
	if filter.MFYID != nil {
		base = base.Where("ns.mfy_id = ?", *filter.MFYID)
	}
	if filter.ShopStatus != "" {
		base = base.Where("ns.status = ?", filter.ShopStatus)
	}
	if filter.TemplateStatus != "" {
		base = base.Where("t.status = ?", filter.TemplateStatus)
	}
	return base
}

func (r *localShopProductPostgresRepository) selectClause() string {
	return `
		local_shop_products.id,
		local_shop_products.local_shop_id,
		local_shop_products.template_id,
		local_shop_products.quantity,
		local_shop_products.price,
		local_shop_products.original_price,
		local_shop_products.created_at,
		local_shop_products.updated_at,
		ns.name AS shop_name,
		ns.status AS shop_status,
		ns.region_id,
		ns.district_id,
		ns.mfy_id,
		ns.phone,
		t.name AS template_name,
		t.status AS template_status,
		t.description,
		t.category_id,
		t.subcategory_id,
		t.unit,
		t.unit_size
	`
}

func (r *localShopProductPostgresRepository) GetPaginated(filter LocalShopProductListFilter) ([]LocalShopProductRow, int64, error) {
	base := r.baseQuery(filter)
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	var rows []LocalShopProductRow
	offset := (filter.Page - 1) * filter.Limit
	if err := base.
		Select(r.selectClause()).
		Order("local_shop_products.id desc").
		Offset(offset).
		Limit(filter.Limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *localShopProductPostgresRepository) GetByID(id uint) (*LocalShopProductRow, error) {
	var row LocalShopProductRow
	err := r.db.Model(&lsdomain.Product{}).
		Joins("JOIN neighborhood_shops ns ON ns.id = local_shop_products.local_shop_id").
		Joins("JOIN local_shop_product_templates t ON t.id = local_shop_products.template_id").
		Where("local_shop_products.id = ?", id).
		Select(r.selectClause()).
		Scan(&row).Error
	if err != nil {
		return nil, err
	}
	if row.ID == 0 {
		return nil, nil
	}
	return &row, nil
}

func (r *localShopProductPostgresRepository) GetTemplateImages(templateIDs []uint) (map[uint][]string, error) {
	out := make(map[uint][]string)
	if len(templateIDs) == 0 {
		return out, nil
	}
	type imgRow struct {
		TemplateID uint
		Image      string
	}
	var rows []imgRow
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

func (r *localShopProductPostgresRepository) GetDeliveryAreas(shopIDs []uint) (map[uint][]LocalShopProductDeliveryAreaRow, error) {
	out := make(map[uint][]LocalShopProductDeliveryAreaRow)
	if len(shopIDs) == 0 {
		return out, nil
	}
	var rows []LocalShopProductDeliveryAreaRow
	if err := r.db.Table("local_shop_service_areas lssa").
		Select("lssa.local_shop_id, lssa.mfy_id, m.name as mfy_name").
		Joins("JOIN mfies m ON m.id = lssa.mfy_id").
		Where("lssa.local_shop_id IN ?", shopIDs).
		Order("lssa.local_shop_id asc, lssa.mfy_id asc").
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	for _, row := range rows {
		out[row.LocalShopID] = append(out[row.LocalShopID], row)
	}
	return out, nil
}
