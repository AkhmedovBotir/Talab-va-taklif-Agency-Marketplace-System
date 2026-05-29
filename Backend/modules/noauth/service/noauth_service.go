package service

import (
	"strings"
	"time"

	admdomain "backend/modules/admin/domain"
	lsdomain "backend/modules/localshops/domain"
	mpdomain "backend/modules/marketplace/domain"
	mpsvc "backend/modules/marketplace/service"
	"gorm.io/gorm"
)

type NoAuthService struct {
	productSvc    mpsvc.MarketplaceProductService
	categorySvc   mpsvc.MarketplaceCategoryService
	contragentSvc mpsvc.MarketplaceContragentBrowseService
	regionSvc     mpsvc.RegionService
	db            *gorm.DB
}

type ContragentBannerPublicItem struct {
	ID             uint   `json:"id"`
	ContragentID   uint   `json:"contragent_id"`
	ContragentName string `json:"contragent_name"`
	ContragentLogo string `json:"contragent_logo,omitempty"`
	StartAt        string `json:"start_at"`
	EndAt          string `json:"end_at"`
}

func NewNoAuthService(
	productSvc mpsvc.MarketplaceProductService,
	categorySvc mpsvc.MarketplaceCategoryService,
	contragentSvc mpsvc.MarketplaceContragentBrowseService,
	regionSvc mpsvc.RegionService,
	db *gorm.DB,
) *NoAuthService {
	return &NoAuthService{
		productSvc:    productSvc,
		categorySvc:   categorySvc,
		contragentSvc: contragentSvc,
		regionSvc:     regionSvc,
		db:            db,
	}
}

func (s *NoAuthService) Products(filter mpsvc.MarketplaceProductFilter, page, limit int) (*mpdomain.PaginatedProducts, error) {
	return s.productSvc.ListApproved(filter, page, limit)
}

func (s *NoAuthService) ProductByID(id uint) (*mpdomain.ProductOutput, error) {
	return s.productSvc.GetApprovedByID(id)
}

func (s *NoAuthService) Categories(page, limit int) (*mpsvc.MarketplacePaginatedCategories, error) {
	return s.categorySvc.GetCategories(page, limit)
}

func (s *NoAuthService) CategoryByID(id uint) (*admdomain.Category, error) {
	return s.categorySvc.GetCategoryByID(id)
}

func (s *NoAuthService) Subcategories(page, limit int, parentID *uint) (*mpsvc.MarketplacePaginatedCategories, error) {
	return s.categorySvc.GetSubcategories(page, limit, parentID)
}

func (s *NoAuthService) SubcategoryByID(id uint) (*admdomain.Category, error) {
	return s.categorySvc.GetSubcategoryByID(id)
}

func (s *NoAuthService) Contragents(query *string, page, limit int, nestedLimit int, include mpsvc.ContragentBrowseInclude) (*mpdomain.PaginatedContragents, error) {
	return s.contragentSvc.List(query, page, limit, nestedLimit, include)
}

func (s *NoAuthService) Regions() ([]admdomain.Region, error) {
	return s.regionSvc.GetRegions()
}

func (s *NoAuthService) Districts(regionID *uint) ([]admdomain.District, error) {
	return s.regionSvc.GetDistricts(regionID)
}

func (s *NoAuthService) MFYs(districtID *uint) ([]admdomain.MFY, error) {
	return s.regionSvc.GetMFYs(districtID)
}

type AgentPublicItem struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	ViloyatID uint   `json:"viloyat_id"`
	TumanID   uint   `json:"tuman_id"`
	MFYID     uint   `json:"mfy_id"`
	Status    string `json:"status"`
}

type PunktPublicItem struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	ViloyatID uint   `json:"viloyat_id"`
	TumanID   uint   `json:"tuman_id"`
	Status    string `json:"status"`
}

type ManagerPublicItem struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	ViloyatID uint   `json:"viloyat_id"`
	Status    string `json:"status"`
}

type ActivityTypePublicItem struct {
	ID     uint   `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

type MarketplaceUserPublicItem struct {
	ID        uint   `json:"id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func (s *NoAuthService) Agents(page, limit int, q string) ([]AgentPublicItem, int64, error) {
	var total int64
	base := s.db.Model(&admdomain.Agent{}).Where("status = ?", admdomain.StatusActive)
	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("name ILIKE ?", p)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []admdomain.Agent
	if err := base.Order("id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]AgentPublicItem, 0, len(rows))
	for i := range rows {
		out = append(out, AgentPublicItem{
			ID:        rows[i].ID,
			Name:      rows[i].Name,
			ViloyatID: rows[i].RegionID,
			TumanID:   rows[i].DistrictID,
			MFYID:     rows[i].MFYID,
			Status:    rows[i].Status,
		})
	}
	return out, total, nil
}

func (s *NoAuthService) Punkts(page, limit int, q string) ([]PunktPublicItem, int64, error) {
	var total int64
	base := s.db.Model(&admdomain.Punkt{}).Where("status = ?", admdomain.StatusActive)
	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("name ILIKE ?", p)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []admdomain.Punkt
	if err := base.Order("id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]PunktPublicItem, 0, len(rows))
	for i := range rows {
		out = append(out, PunktPublicItem{
			ID:        rows[i].ID,
			Name:      rows[i].Name,
			ViloyatID: rows[i].RegionID,
			TumanID:   rows[i].DistrictID,
			Status:    rows[i].Status,
		})
	}
	return out, total, nil
}

func (s *NoAuthService) MarketplaceUsers(page, limit int, q string) ([]MarketplaceUserPublicItem, int64, error) {
	var total int64
	base := s.db.Model(&mpdomain.User{}).Where("status = ?", admdomain.StatusActive)
	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("first_name ILIKE ? OR last_name ILIKE ?", p, p)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []mpdomain.User
	if err := base.Order("id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]MarketplaceUserPublicItem, 0, len(rows))
	for i := range rows {
		out = append(out, MarketplaceUserPublicItem{
			ID:        rows[i].ID,
			FirstName: rows[i].FirstName,
			LastName:  rows[i].LastName,
		})
	}
	return out, total, nil
}

func (s *NoAuthService) Managers(page, limit int, q string) ([]ManagerPublicItem, int64, error) {
	var total int64
	base := s.db.Model(&admdomain.Manager{}).Where("status = ?", admdomain.StatusActive)
	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("name ILIKE ?", p)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []admdomain.Manager
	if err := base.Order("id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	out := make([]ManagerPublicItem, 0, len(rows))
	for i := range rows {
		out = append(out, ManagerPublicItem{
			ID:        rows[i].ID,
			Name:      rows[i].Name,
			ViloyatID: rows[i].RegionID,
			Status:    rows[i].Status,
		})
	}
	return out, total, nil
}

func (s *NoAuthService) ActivityTypes() ([]ActivityTypePublicItem, error) {
	var rows []admdomain.ContragentType
	if err := s.db.Where("status = ?", admdomain.StatusActive).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]ActivityTypePublicItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, ActivityTypePublicItem{
			ID:     row.ID,
			Name:   row.Name,
			Status: row.Status,
		})
	}
	return out, nil
}

type LocalShopServiceAreaPublic struct {
	MFYID   uint   `json:"mfy_id"`
	MFYName string `json:"mfy_name"`
}

type LocalShopWorkingHourPublic struct {
	Weekday   int    `json:"weekday"`
	IsOff     bool   `json:"is_off"`
	OpenTime  string `json:"open_time,omitempty"`
	CloseTime string `json:"close_time,omitempty"`
}

type LocalShopPublicItem struct {
	ID           uint                         `json:"id"`
	Name         string                       `json:"name"`
	RegionID     uint                         `json:"region_id"`
	DistrictID   uint                         `json:"district_id"`
	MFYID        uint                         `json:"mfy_id"`
	Phone        string                       `json:"phone"`
	Logo         string                       `json:"logo,omitempty"`
	Status       string                       `json:"status"`
	WorkingHours []LocalShopWorkingHourPublic `json:"working_hours"`
}

func (s *NoAuthService) LocalShops(page, limit int, q string, districtID, mfyID *uint) ([]LocalShopPublicItem, int64, error) {
	var total int64
	base := s.db.Model(&admdomain.NeighborhoodShop{}).Where("status = ?", admdomain.StatusActive)
	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("name ILIKE ? OR phone ILIKE ?", p, p)
	}
	if districtID != nil {
		base = base.Where("district_id = ?", *districtID)
	}
	if mfyID != nil {
		base = base.Where("mfy_id = ?", *mfyID)
	}
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []admdomain.NeighborhoodShop
	if err := base.Order("id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}

	shopIDs := make([]uint, 0, len(rows))
	for _, row := range rows {
		shopIDs = append(shopIDs, row.ID)
	}
	whMap := make(map[uint][]LocalShopWorkingHourPublic)
	if len(shopIDs) > 0 {
		var whRows []lsdomain.WorkingHour
		if err := s.db.Where("local_shop_id IN ?", shopIDs).Order("weekday asc").Find(&whRows).Error; err != nil {
			return nil, 0, err
		}
		for _, wh := range whRows {
			whMap[wh.LocalShopID] = append(whMap[wh.LocalShopID], LocalShopWorkingHourPublic{
				Weekday:   wh.Weekday,
				IsOff:     wh.IsOff,
				OpenTime:  wh.OpenTime,
				CloseTime: wh.CloseTime,
			})
		}
	}

	out := make([]LocalShopPublicItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, LocalShopPublicItem{
			ID:           row.ID,
			Name:         row.Name,
			RegionID:     row.RegionID,
			DistrictID:   row.DistrictID,
			MFYID:        row.MFYID,
			Phone:        row.Phone,
			Logo:         row.Logo,
			Status:       row.Status,
			WorkingHours: whMap[row.ID],
		})
	}
	return out, total, nil
}

type LocalShopProductTemplatePublic struct {
	ID            uint     `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	CategoryID    uint     `json:"category_id"`
	SubcategoryID uint     `json:"subcategory_id"`
	Unit          string   `json:"unit"`
	UnitSize      string   `json:"unit_size"`
	Images        []string `json:"images"`
}

type LocalShopMiniPublic struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	RegionID   uint   `json:"region_id"`
	DistrictID uint   `json:"district_id"`
	MFYID      uint   `json:"mfy_id"`
	Phone      string `json:"phone"`
}

type LocalShopProductPublicItem struct {
	ID            uint                           `json:"id"`
	LocalShopID   uint                           `json:"local_shop_id"`
	TemplateID    uint                           `json:"template_id"`
	Quantity      float64                        `json:"quantity"`
	Price         float64                        `json:"price"`
	OriginalPrice float64                        `json:"original_price"`
	Template      LocalShopProductTemplatePublic `json:"template"`
	Shop          LocalShopMiniPublic            `json:"shop"`
	DeliveryAreas []LocalShopServiceAreaPublic   `json:"delivery_areas"`
}

type ProductRatingPublicItem struct {
	ID                uint   `json:"id"`
	OrderID           uint   `json:"order_id"`
	OrderItemID       uint   `json:"order_item_id"`
	Score             int    `json:"score"`
	CommentTemplateID *uint  `json:"comment_template_id,omitempty"`
	CommentTemplate   string `json:"comment_template,omitempty"`
	Note              string `json:"note,omitempty"`
	CreatedAt         string `json:"created_at"`
}

type ProductRatingsPublicOutput struct {
	ProductID      uint                      `json:"product_id"`
	AverageScore   float64                   `json:"average_score"`
	TotalRatings   int64                     `json:"total_ratings"`
	ScoreBreakdown map[string]int64          `json:"score_breakdown"`
	Items          []ProductRatingPublicItem `json:"items"`
	Page           int                       `json:"page"`
	Limit          int                       `json:"limit"`
	TotalPages     int                       `json:"total_pages"`
}

type CommentTemplatePublicItem struct {
	ID        uint   `json:"id"`
	Comment   string `json:"comment"`
	SortOrder int    `json:"sort_order"`
}

func (s *NoAuthService) LocalShopProducts(page, limit int, q string, districtID, mfyID, localShopID *uint) ([]LocalShopProductPublicItem, int64, error) {
	base := s.db.Model(&lsdomain.Product{}).
		Joins("JOIN neighborhood_shops ns ON ns.id = local_shop_products.local_shop_id").
		Joins("JOIN local_shop_product_templates t ON t.id = local_shop_products.template_id").
		Where("ns.status = ? AND t.status = ?", admdomain.StatusActive, admdomain.StatusActive)

	q = strings.TrimSpace(q)
	if q != "" {
		p := "%" + q + "%"
		base = base.Where("t.name ILIKE ? OR ns.name ILIKE ?", p, p)
	}
	if districtID != nil {
		base = base.Where("ns.district_id = ?", *districtID)
	}
	if mfyID != nil {
		base = base.Where("ns.mfy_id = ?", *mfyID)
	}
	if localShopID != nil {
		base = base.Where("local_shop_products.local_shop_id = ?", *localShopID)
	}

	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	type rowOut struct {
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
	var rows []rowOut
	offset := (page - 1) * limit
	if err := base.
		Select(`
			local_shop_products.id,
			local_shop_products.local_shop_id,
			local_shop_products.template_id,
			local_shop_products.quantity,
			local_shop_products.price,
			local_shop_products.original_price,
			ns.name AS shop_name,
			ns.region_id,
			ns.district_id,
			ns.mfy_id,
			ns.phone,
			t.name AS template_name,
			t.description,
			t.category_id,
			t.subcategory_id,
			t.unit,
			t.unit_size
		`).
		Order("local_shop_products.id desc").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, 0, err
	}

	shopIDs := make([]uint, 0, len(rows))
	templateIDs := make([]uint, 0, len(rows))
	shopSeen := map[uint]struct{}{}
	templateSeen := map[uint]struct{}{}
	for _, row := range rows {
		if _, ok := shopSeen[row.LocalShopID]; !ok {
			shopSeen[row.LocalShopID] = struct{}{}
			shopIDs = append(shopIDs, row.LocalShopID)
		}
		if _, ok := templateSeen[row.TemplateID]; !ok {
			templateSeen[row.TemplateID] = struct{}{}
			templateIDs = append(templateIDs, row.TemplateID)
		}
	}

	imageMap := make(map[uint][]string)
	if len(templateIDs) > 0 {
		var images []admdomain.LocalShopProductTemplateImage
		if err := s.db.Where("template_id IN ?", templateIDs).Order("template_id asc, sort_order asc, id asc").Find(&images).Error; err != nil {
			return nil, 0, err
		}
		for _, img := range images {
			imageMap[img.TemplateID] = append(imageMap[img.TemplateID], img.Image)
		}
	}

	areaMap := make(map[uint][]LocalShopServiceAreaPublic)
	if len(shopIDs) > 0 {
		type areaRow struct {
			LocalShopID uint
			MFYID       uint
			MFYName     string
		}
		var areas []areaRow
		if err := s.db.Table("local_shop_service_areas lssa").
			Select("lssa.local_shop_id, lssa.mfy_id, m.name as mfy_name").
			Joins("JOIN mfies m ON m.id = lssa.mfy_id").
			Where("lssa.local_shop_id IN ?", shopIDs).
			Order("lssa.local_shop_id asc, lssa.mfy_id asc").
			Scan(&areas).Error; err != nil {
			return nil, 0, err
		}
		for _, a := range areas {
			areaMap[a.LocalShopID] = append(areaMap[a.LocalShopID], LocalShopServiceAreaPublic{
				MFYID:   a.MFYID,
				MFYName: a.MFYName,
			})
		}
	}

	out := make([]LocalShopProductPublicItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, LocalShopProductPublicItem{
			ID:            row.ID,
			LocalShopID:   row.LocalShopID,
			TemplateID:    row.TemplateID,
			Quantity:      row.Quantity,
			Price:         row.Price,
			OriginalPrice: row.OriginalPrice,
			Template: LocalShopProductTemplatePublic{
				ID:            row.TemplateID,
				Name:          row.TemplateName,
				Description:   row.Description,
				CategoryID:    row.CategoryID,
				SubcategoryID: row.SubcategoryID,
				Unit:          row.Unit,
				UnitSize:      row.UnitSize,
				Images:        imageMap[row.TemplateID],
			},
			Shop: LocalShopMiniPublic{
				ID:         row.LocalShopID,
				Name:       row.ShopName,
				RegionID:   row.RegionID,
				DistrictID: row.DistrictID,
				MFYID:      row.MFYID,
				Phone:      row.Phone,
			},
			DeliveryAreas: areaMap[row.LocalShopID],
		})
	}
	return out, total, nil
}

func (s *NoAuthService) ActiveContragentBanners() ([]ContragentBannerPublicItem, error) {
	type row struct {
		ID             uint
		ContragentID   uint
		ContragentName string
		ContragentLogo string
		StartAt        time.Time
		EndAt          time.Time
	}
	var rows []row
	err := s.db.Table("integration_contragent_banners b").
		Select("b.id, b.contragent_id, c.name as contragent_name, c.logo as contragent_logo, b.start_at, b.end_at").
		Joins("JOIN contragents c ON c.id = b.contragent_id").
		Where("b.status = ? AND NOW() BETWEEN b.start_at AND b.end_at", admdomain.StatusActive).
		Order("b.start_at desc").
		Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	out := make([]ContragentBannerPublicItem, 0, len(rows))
	for _, r := range rows {
		out = append(out, ContragentBannerPublicItem{
			ID:             r.ID,
			ContragentID:   r.ContragentID,
			ContragentName: r.ContragentName,
			ContragentLogo: r.ContragentLogo,
			StartAt:        r.StartAt.Format(time.RFC3339),
			EndAt:          r.EndAt.Format(time.RFC3339),
		})
	}
	return out, nil
}

func (s *NoAuthService) ProductRatings(productID uint, page, limit int) (*ProductRatingsPublicOutput, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	var total int64
	base := s.db.Table("marketplace_product_ratings").Where("product_id = ?", productID)
	if err := base.Count(&total).Error; err != nil {
		return nil, err
	}
	type agg struct {
		Avg float64
		C1  int64
		C2  int64
		C3  int64
		C4  int64
		C5  int64
	}
	var a agg
	if err := base.Select(`
		COALESCE(AVG(score), 0) as avg,
		COALESCE(SUM(CASE WHEN score=1 THEN 1 ELSE 0 END), 0) as c1,
		COALESCE(SUM(CASE WHEN score=2 THEN 1 ELSE 0 END), 0) as c2,
		COALESCE(SUM(CASE WHEN score=3 THEN 1 ELSE 0 END), 0) as c3,
		COALESCE(SUM(CASE WHEN score=4 THEN 1 ELSE 0 END), 0) as c4,
		COALESCE(SUM(CASE WHEN score=5 THEN 1 ELSE 0 END), 0) as c5
	`).Scan(&a).Error; err != nil {
		return nil, err
	}
	type row struct {
		ID                uint
		OrderID           uint
		OrderItemID       uint
		Score             int
		CommentTemplateID *uint
		Note              string
		CreatedAt         time.Time
		CommentTemplate   string
	}
	var rows []row
	offset := (page - 1) * limit
	if err := s.db.Table("marketplace_product_ratings r").
		Select("r.id, r.order_id, r.order_item_id, r.score, r.comment_template_id, r.note, r.created_at, ct.comment as comment_template").
		Joins("LEFT JOIN admin_comment_templates ct ON ct.id = r.comment_template_id").
		Where("r.product_id = ?", productID).
		Order("r.id desc").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error; err != nil {
		return nil, err
	}
	items := make([]ProductRatingPublicItem, 0, len(rows))
	for _, r := range rows {
		items = append(items, ProductRatingPublicItem{
			ID:                r.ID,
			OrderID:           r.OrderID,
			OrderItemID:       r.OrderItemID,
			Score:             r.Score,
			CommentTemplateID: r.CommentTemplateID,
			CommentTemplate:   r.CommentTemplate,
			Note:              r.Note,
			CreatedAt:         r.CreatedAt.UTC().Format(time.RFC3339),
		})
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &ProductRatingsPublicOutput{
		ProductID:    productID,
		AverageScore: a.Avg,
		TotalRatings: total,
		ScoreBreakdown: map[string]int64{
			"1": a.C1, "2": a.C2, "3": a.C3, "4": a.C4, "5": a.C5,
		},
		Items:      items,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *NoAuthService) CommentTemplates() ([]CommentTemplatePublicItem, error) {
	var rows []admdomain.CommentTemplate
	if err := s.db.Where("status = ?", admdomain.StatusActive).Order("sort_order asc, id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]CommentTemplatePublicItem, 0, len(rows))
	for _, row := range rows {
		out = append(out, CommentTemplatePublicItem{
			ID:        row.ID,
			Comment:   row.Comment,
			SortOrder: row.SortOrder,
		})
	}
	return out, nil
}
