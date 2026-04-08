package service

import (
	"errors"
	"time"

	"backend/modules/localshops/domain"
	"backend/modules/localshops/repository"
)

var (
	ErrProductNotFound        = errors.New("mahsulot topilmadi")
	ErrTemplateInvalid        = errors.New("template_id noto'g'ri yoki aktiv emas")
	ErrQuantityInvalid        = errors.New("quantity noto'g'ri")
	ErrPriceInvalid           = errors.New("price noto'g'ri")
	ErrOriginalPriceInvalid   = errors.New("original_price noto'g'ri")
)

type ProductInput struct {
	TemplateID    uint    `json:"template_id"`
	Quantity      float64 `json:"quantity"`
	Price         float64 `json:"price"`
	OriginalPrice float64 `json:"original_price"`
}

type ProductTemplateOut struct {
	ID            uint     `json:"id"`
	Name          string   `json:"name"`
	Description   string   `json:"description"`
	Images        []string `json:"images"`
	CategoryID    uint     `json:"category_id"`
	SubcategoryID uint     `json:"subcategory_id"`
	Unit          string   `json:"unit"`
	UnitSize      string   `json:"unit_size"`
}

type ProductOut struct {
	ID            uint              `json:"id"`
	LocalShopID   uint              `json:"local_shop_id"`
	TemplateID    uint              `json:"template_id"`
	Quantity      float64           `json:"quantity"`
	Price         float64           `json:"price"`
	OriginalPrice float64           `json:"original_price"`
	Template      *ProductTemplateOut `json:"template,omitempty"`
	CreatedAt     time.Time         `json:"created_at"`
	UpdatedAt     time.Time         `json:"updated_at"`
}

type PaginatedProducts struct {
	Items      []ProductOut `json:"items"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	TotalPages int          `json:"total_pages"`
}

type ProductService interface {
	Create(localShopID uint, input ProductInput) (*ProductOut, error)
	GetPaginated(localShopID uint, page, limit int) (*PaginatedProducts, error)
	GetByID(localShopID, id uint) (*ProductOut, error)
	Update(localShopID, id uint, input ProductInput) (*ProductOut, error)
	Delete(localShopID, id uint) error
}

type productService struct {
	repo repository.ProductRepository
}

func NewProductService(repo repository.ProductRepository) ProductService {
	return &productService{repo: repo}
}

func (s *productService) Create(localShopID uint, input ProductInput) (*ProductOut, error) {
	if err := s.validateInput(input); err != nil {
		return nil, err
	}
	row := &domain.Product{
		LocalShopID:   localShopID,
		TemplateID:    input.TemplateID,
		Quantity:      input.Quantity,
		Price:         input.Price,
		OriginalPrice: input.OriginalPrice,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return s.GetByID(localShopID, row.ID)
}

func (s *productService) GetPaginated(localShopID uint, page, limit int) (*PaginatedProducts, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.GetPaginated(localShopID, page, limit)
	if err != nil {
		return nil, err
	}
	items := make([]ProductOut, 0, len(rows))
	for _, row := range rows {
		out, err := s.mapOut(&row)
		if err != nil {
			return nil, err
		}
		items = append(items, out)
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedProducts{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *productService) GetByID(localShopID, id uint) (*ProductOut, error) {
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	out, err := s.mapOut(row)
	if err != nil {
		return nil, err
	}
	return &out, nil
}

func (s *productService) Update(localShopID, id uint, input ProductInput) (*ProductOut, error) {
	if err := s.validateInput(input); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductNotFound
	}
	row.TemplateID = input.TemplateID
	row.Quantity = input.Quantity
	row.Price = input.Price
	row.OriginalPrice = input.OriginalPrice
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return s.GetByID(localShopID, id)
}

func (s *productService) Delete(localShopID, id uint) error {
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrProductNotFound
	}
	return s.repo.Delete(localShopID, id)
}

func (s *productService) validateInput(input ProductInput) error {
	if input.TemplateID == 0 {
		return ErrTemplateInvalid
	}
	tpl, err := s.repo.GetTemplateByID(input.TemplateID)
	if err != nil {
		return err
	}
	if tpl == nil {
		return ErrTemplateInvalid
	}
	if input.Quantity <= 0 {
		return ErrQuantityInvalid
	}
	if input.Price <= 0 {
		return ErrPriceInvalid
	}
	if input.OriginalPrice <= 0 {
		return ErrOriginalPriceInvalid
	}
	return nil
}

func (s *productService) mapOut(row *domain.Product) (ProductOut, error) {
	tpl, err := s.repo.GetTemplateByID(row.TemplateID)
	if err != nil {
		return ProductOut{}, err
	}
	var tplOut *ProductTemplateOut
	if tpl != nil {
		images, err := s.repo.GetTemplateImages(tpl.ID)
		if err != nil {
			return ProductOut{}, err
		}
		tplOut = &ProductTemplateOut{
			ID:            tpl.ID,
			Name:          tpl.Name,
			Description:   tpl.Description,
			Images:        images,
			CategoryID:    tpl.CategoryID,
			SubcategoryID: tpl.SubcategoryID,
			Unit:          tpl.Unit,
			UnitSize:      tpl.UnitSize,
		}
	}
	return ProductOut{
		ID:            row.ID,
		LocalShopID:   row.LocalShopID,
		TemplateID:    row.TemplateID,
		Quantity:      row.Quantity,
		Price:         row.Price,
		OriginalPrice: row.OriginalPrice,
		Template:      tplOut,
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}, nil
}
