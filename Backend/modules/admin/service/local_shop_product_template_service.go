package service

import (
	"encoding/base64"
	"errors"
	"strings"
	"time"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/admin/repository"
	contrDomain "backend/modules/contragents/domain"
)

var (
	ErrLocalShopTemplateNotFound            = errors.New("mahsulot shabloni topilmadi")
	ErrLocalShopTemplateNameRequired        = errors.New("name majburiy")
	ErrLocalShopTemplateDescriptionRequired = errors.New("description majburiy")
	ErrLocalShopTemplateCategoryInvalid     = errors.New("category_id noto'g'ri")
	ErrLocalShopTemplateSubcategoryInvalid  = errors.New("subcategory_id noto'g'ri")
	ErrLocalShopTemplateCategoryRelation    = errors.New("subcategory tanlangan categoryga tegishli emas")
	ErrLocalShopTemplateUnitInvalid         = errors.New("unit noto'g'ri")
	ErrLocalShopTemplateUnitSizeRequired    = errors.New("unit_size majburiy")
	ErrLocalShopTemplateImagesInvalid       = errors.New("images 1 tadan 5 tagacha bo'lishi kerak")
	ErrLocalShopTemplateImageBase64Invalid  = errors.New("image base64 formati noto'g'ri")
	ErrLocalShopTemplateStatusInvalid       = errors.New("status noto'g'ri")
)

type LocalShopProductTemplateInput struct {
	Name          string   `json:"name"`
	Description   string   `json:"description"` // delta JSON string
	Images        []string `json:"images"`
	CategoryID    uint     `json:"category_id"`
	SubcategoryID uint     `json:"subcategory_id"`
	Unit          string   `json:"unit"`
	UnitSize      string   `json:"unit_size"`
	Status        string   `json:"status"`
}

type LocalShopProductTemplateOutput struct {
	ID            uint      `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Images        []string  `json:"images"`
	CategoryID    uint      `json:"category_id"`
	SubcategoryID uint      `json:"subcategory_id"`
	Unit          string    `json:"unit"`
	UnitSize      string    `json:"unit_size"`
	Status        string    `json:"status"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

type PaginatedLocalShopProductTemplates struct {
	Items      []LocalShopProductTemplateOutput `json:"items"`
	Total      int64                            `json:"total"`
	Page       int                              `json:"page"`
	Limit      int                              `json:"limit"`
	TotalPages int                              `json:"total_pages"`
}

type LocalShopProductTemplateService interface {
	Create(input LocalShopProductTemplateInput) (*LocalShopProductTemplateOutput, error)
	GetPaginated(page, limit int) (*PaginatedLocalShopProductTemplates, error)
	GetByID(id uint) (*LocalShopProductTemplateOutput, error)
	Update(id uint, input LocalShopProductTemplateInput) (*LocalShopProductTemplateOutput, error)
	UpdateStatus(id uint, status string) (*LocalShopProductTemplateOutput, error)
	Delete(id uint) error
}

type localShopProductTemplateService struct {
	repo repository.LocalShopProductTemplateRepository
}

func NewLocalShopProductTemplateService(repo repository.LocalShopProductTemplateRepository) LocalShopProductTemplateService {
	return &localShopProductTemplateService{repo: repo}
}

func (s *localShopProductTemplateService) Create(input LocalShopProductTemplateInput) (*LocalShopProductTemplateOutput, error) {
	input.normalize()
	if err := s.validateInput(input); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row := &adminDomain.LocalShopProductTemplate{
		Name:          input.Name,
		Description:   input.Description,
		CategoryID:    input.CategoryID,
		SubcategoryID: input.SubcategoryID,
		Unit:          input.Unit,
		UnitSize:      input.UnitSize,
		Status:        input.Status,
	}
	if err := s.repo.Create(row, input.Images); err != nil {
		return nil, err
	}
	return s.GetByID(row.ID)
}

func (s *localShopProductTemplateService) GetPaginated(page, limit int) (*PaginatedLocalShopProductTemplates, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.GetPaginated(page, limit)
	if err != nil {
		return nil, err
	}
	items := make([]LocalShopProductTemplateOutput, 0, len(rows))
	for _, row := range rows {
		images, err := s.repo.GetImages(row.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, mapLocalShopTemplateOutput(&row, images))
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedLocalShopProductTemplates{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *localShopProductTemplateService) GetByID(id uint) (*LocalShopProductTemplateOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	images, err := s.repo.GetImages(id)
	if err != nil {
		return nil, err
	}
	out := mapLocalShopTemplateOutput(row, images)
	return &out, nil
}

func (s *localShopProductTemplateService) Update(id uint, input LocalShopProductTemplateInput) (*LocalShopProductTemplateOutput, error) {
	input.normalize()
	if err := s.validateInput(input); err != nil {
		return nil, err
	}
	if err := s.validateCategoryRelation(input.CategoryID, input.SubcategoryID); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	row.Name = input.Name
	row.Description = input.Description
	row.CategoryID = input.CategoryID
	row.SubcategoryID = input.SubcategoryID
	row.Unit = input.Unit
	row.UnitSize = input.UnitSize
	row.Status = input.Status
	if err := s.repo.Update(row, input.Images); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) UpdateStatus(id uint, status string) (*LocalShopProductTemplateOutput, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopTemplateNotFound
	}
	st, err := normalizeLocalShopTemplateStatus(status)
	if err != nil {
		return nil, err
	}
	row.Status = st
	if err := s.repo.Update(row, nil); err != nil {
		return nil, err
	}
	return s.GetByID(id)
}

func (s *localShopProductTemplateService) Delete(id uint) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrLocalShopTemplateNotFound
	}
	return s.repo.Delete(id)
}

func (s *localShopProductTemplateService) validateInput(input LocalShopProductTemplateInput) error {
	if input.Name == "" {
		return ErrLocalShopTemplateNameRequired
	}
	if input.Description == "" {
		return ErrLocalShopTemplateDescriptionRequired
	}
	if input.CategoryID == 0 {
		return ErrLocalShopTemplateCategoryInvalid
	}
	if input.SubcategoryID == 0 {
		return ErrLocalShopTemplateSubcategoryInvalid
	}
	if input.Unit != contrDomain.ProductUnitDona && input.Unit != contrDomain.ProductUnitLitr && input.Unit != contrDomain.ProductUnitKg {
		return ErrLocalShopTemplateUnitInvalid
	}
	if input.UnitSize == "" {
		return ErrLocalShopTemplateUnitSizeRequired
	}
	if _, err := normalizeLocalShopTemplateStatus(input.Status); err != nil {
		return err
	}
	if len(input.Images) < 1 || len(input.Images) > 5 {
		return ErrLocalShopTemplateImagesInvalid
	}
	for _, img := range input.Images {
		if !isValidLocalShopTemplateImage(img) {
			return ErrLocalShopTemplateImageBase64Invalid
		}
	}
	return nil
}

func (s *localShopProductTemplateService) validateCategoryRelation(categoryID, subcategoryID uint) error {
	cat, err := s.repo.GetCategoryByID(categoryID)
	if err != nil {
		return err
	}
	if cat == nil || cat.ParentID != nil {
		return ErrLocalShopTemplateCategoryInvalid
	}
	sub, err := s.repo.GetSubcategoryByID(subcategoryID)
	if err != nil {
		return err
	}
	if sub == nil || sub.ParentID == nil {
		return ErrLocalShopTemplateSubcategoryInvalid
	}
	if *sub.ParentID != categoryID {
		return ErrLocalShopTemplateCategoryRelation
	}
	return nil
}

func mapLocalShopTemplateOutput(row *adminDomain.LocalShopProductTemplate, images []string) LocalShopProductTemplateOutput {
	return LocalShopProductTemplateOutput{
		ID:            row.ID,
		Name:          row.Name,
		Description:   row.Description,
		Images:        images,
		CategoryID:    row.CategoryID,
		SubcategoryID: row.SubcategoryID,
		Unit:          row.Unit,
		UnitSize:      row.UnitSize,
		Status:        row.Status,
		CreatedAt:     row.CreatedAt,
		UpdatedAt:     row.UpdatedAt,
	}
}

func normalizeLocalShopTemplateStatus(status string) (string, error) {
	status = strings.TrimSpace(status)
	if status != adminDomain.StatusActive && status != adminDomain.StatusInactive {
		return "", ErrLocalShopTemplateStatusInvalid
	}
	return status, nil
}

func isValidLocalShopTemplateImage(raw string) bool {
	payload := strings.TrimSpace(raw)
	if strings.HasPrefix(payload, "data:") {
		parts := strings.SplitN(payload, ",", 2)
		if len(parts) != 2 {
			return false
		}
		payload = parts[1]
	}
	if payload == "" {
		return false
	}
	_, err := base64.StdEncoding.DecodeString(payload)
	return err == nil
}

func (i *LocalShopProductTemplateInput) normalize() {
	i.Name = strings.TrimSpace(i.Name)
	i.Description = strings.TrimSpace(i.Description)
	i.Unit = strings.TrimSpace(i.Unit)
	i.UnitSize = strings.TrimSpace(i.UnitSize)
	i.Status = strings.TrimSpace(i.Status)
	for idx := range i.Images {
		i.Images[idx] = strings.TrimSpace(i.Images[idx])
	}
}
