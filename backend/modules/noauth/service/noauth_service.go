package service

import (
	"strings"

	admdomain "backend/modules/admin/domain"
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
