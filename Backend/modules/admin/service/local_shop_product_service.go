package service

import (
	"errors"
	"strings"
	"time"

	"backend/modules/admin/repository"
)

var ErrLocalShopProductNotFound = errors.New("maxalla do'koni mahsuloti topilmadi")

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

type LocalShopProductTemplateOut struct {
	ID            uint     `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	CategoryID    uint     `json:"category_id"`
	SubcategoryID uint     `json:"subcategory_id"`
	Unit          string   `json:"unit"`
	UnitSize      string   `json:"unit_size"`
	Status        string   `json:"status"`
	Images        []string `json:"images"`
}

type LocalShopProductShopOut struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Status     string `json:"status"`
	RegionID   uint   `json:"region_id"`
	DistrictID uint   `json:"district_id"`
	MFYID      uint   `json:"mfy_id"`
	Phone      string `json:"phone"`
}

type LocalShopProductDeliveryAreaOut struct {
	MFYID   uint   `json:"mfy_id"`
	MFYName string `json:"mfy_name"`
}

type LocalShopProductOut struct {
	ID            uint                              `json:"id"`
	LocalShopID   uint                              `json:"local_shop_id"`
	TemplateID    uint                              `json:"template_id"`
	Quantity      float64                           `json:"quantity"`
	Price         float64                           `json:"price"`
	OriginalPrice float64                           `json:"original_price"`
	CreatedAt     time.Time                         `json:"created_at"`
	UpdatedAt     time.Time                         `json:"updated_at"`
	Template      LocalShopProductTemplateOut       `json:"template"`
	Shop          LocalShopProductShopOut           `json:"shop"`
	DeliveryAreas []LocalShopProductDeliveryAreaOut `json:"delivery_areas"`
}

type PaginatedLocalShopProducts struct {
	Items      []LocalShopProductOut `json:"items"`
	Total      int64                 `json:"total"`
	Page       int                   `json:"page"`
	Limit      int                   `json:"limit"`
	TotalPages int                   `json:"total_pages"`
}

type LocalShopProductService interface {
	GetPaginated(filter LocalShopProductListFilter) (*PaginatedLocalShopProducts, error)
	GetByID(id uint) (*LocalShopProductOut, error)
}

type localShopProductService struct {
	repo repository.LocalShopProductRepository
}

func NewLocalShopProductService(repo repository.LocalShopProductRepository) LocalShopProductService {
	return &localShopProductService{repo: repo}
}

func (s *localShopProductService) GetPaginated(filter LocalShopProductListFilter) (*PaginatedLocalShopProducts, error) {
	filter.normalize()
	rows, total, err := s.repo.GetPaginated(repository.LocalShopProductListFilter{
		Page:           filter.Page,
		Limit:          filter.Limit,
		Q:              filter.Q,
		LocalShopID:    filter.LocalShopID,
		TemplateID:     filter.TemplateID,
		RegionID:       filter.RegionID,
		DistrictID:     filter.DistrictID,
		MFYID:          filter.MFYID,
		ShopStatus:     filter.ShopStatus,
		TemplateStatus: filter.TemplateStatus,
	})
	if err != nil {
		return nil, err
	}
	items, err := s.mapRows(rows)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(filter.Limit) - 1) / int64(filter.Limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedLocalShopProducts{
		Items:      items,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

func (s *localShopProductService) GetByID(id uint) (*LocalShopProductOut, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopProductNotFound
	}
	items, err := s.mapRows([]repository.LocalShopProductRow{*row})
	if err != nil {
		return nil, err
	}
	return &items[0], nil
}

func (s *localShopProductService) mapRows(rows []repository.LocalShopProductRow) ([]LocalShopProductOut, error) {
	if len(rows) == 0 {
		return []LocalShopProductOut{}, nil
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

	imageMap, err := s.repo.GetTemplateImages(templateIDs)
	if err != nil {
		return nil, err
	}
	areaMap, err := s.repo.GetDeliveryAreas(shopIDs)
	if err != nil {
		return nil, err
	}

	out := make([]LocalShopProductOut, 0, len(rows))
	for _, row := range rows {
		images := imageMap[row.TemplateID]
		if images == nil {
			images = []string{}
		}
		areas := areaMap[row.LocalShopID]
		deliveryAreas := make([]LocalShopProductDeliveryAreaOut, 0, len(areas))
		for _, a := range areas {
			deliveryAreas = append(deliveryAreas, LocalShopProductDeliveryAreaOut{
				MFYID:   a.MFYID,
				MFYName: a.MFYName,
			})
		}
		if deliveryAreas == nil {
			deliveryAreas = []LocalShopProductDeliveryAreaOut{}
		}

		out = append(out, LocalShopProductOut{
			ID:            row.ID,
			LocalShopID:   row.LocalShopID,
			TemplateID:    row.TemplateID,
			Quantity:      row.Quantity,
			Price:         row.Price,
			OriginalPrice: row.OriginalPrice,
			CreatedAt:     row.CreatedAt,
			UpdatedAt:     row.UpdatedAt,
			Template: LocalShopProductTemplateOut{
				ID:            row.TemplateID,
				Name:          row.TemplateName,
				Description:   row.Description,
				CategoryID:    row.CategoryID,
				SubcategoryID: row.SubcategoryID,
				Unit:          row.Unit,
				UnitSize:      row.UnitSize,
				Status:        row.TemplateStatus,
				Images:        images,
			},
			Shop: LocalShopProductShopOut{
				ID:         row.LocalShopID,
				Name:       row.ShopName,
				Status:     row.ShopStatus,
				RegionID:   row.RegionID,
				DistrictID: row.DistrictID,
				MFYID:      row.MFYID,
				Phone:      row.Phone,
			},
			DeliveryAreas: deliveryAreas,
		})
	}
	return out, nil
}

func (f *LocalShopProductListFilter) normalize() {
	if f.Page < 1 {
		f.Page = 1
	}
	if f.Limit < 1 {
		f.Limit = 10
	}
	if f.Limit > 100 {
		f.Limit = 100
	}
	f.Q = strings.TrimSpace(f.Q)
	f.ShopStatus = strings.TrimSpace(f.ShopStatus)
	f.TemplateStatus = strings.TrimSpace(f.TemplateStatus)
}
