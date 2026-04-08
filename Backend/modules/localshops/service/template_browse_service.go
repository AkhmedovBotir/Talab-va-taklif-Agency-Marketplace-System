package service

import (
	"errors"
	"time"

	"backend/modules/localshops/repository"
)

var ErrTemplateNotFound = errors.New("shablon topilmadi")

type TemplateOut struct {
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

type PaginatedTemplates struct {
	Items      []TemplateOut `json:"items"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

type TemplateBrowseService interface {
	List(page, limit int) (*PaginatedTemplates, error)
	GetByID(id uint) (*TemplateOut, error)
}

type templateBrowseService struct {
	repo repository.TemplateBrowseRepository
}

func NewTemplateBrowseService(repo repository.TemplateBrowseRepository) TemplateBrowseService {
	return &templateBrowseService{repo: repo}
}

func (s *templateBrowseService) List(page, limit int) (*PaginatedTemplates, error) {
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
	items := make([]TemplateOut, 0, len(rows))
	for _, row := range rows {
		images, err := s.repo.GetImages(row.ID)
		if err != nil {
			return nil, err
		}
		items = append(items, mapTemplateOut(row.ID, row.Name, row.Description, images, row.CategoryID, row.SubcategoryID, row.Unit, row.UnitSize, row.Status, row.CreatedAt, row.UpdatedAt))
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedTemplates{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *templateBrowseService) GetByID(id uint) (*TemplateOut, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrTemplateNotFound
	}
	images, err := s.repo.GetImages(id)
	if err != nil {
		return nil, err
	}
	out := mapTemplateOut(row.ID, row.Name, row.Description, images, row.CategoryID, row.SubcategoryID, row.Unit, row.UnitSize, row.Status, row.CreatedAt, row.UpdatedAt)
	return &out, nil
}

func mapTemplateOut(id uint, name, description string, images []string, categoryID, subcategoryID uint, unit, unitSize, status string, createdAt, updatedAt time.Time) TemplateOut {
	return TemplateOut{
		ID:            id,
		Name:          name,
		Description:   description,
		Images:        images,
		CategoryID:    categoryID,
		SubcategoryID: subcategoryID,
		Unit:          unit,
		UnitSize:      unitSize,
		Status:        status,
		CreatedAt:     createdAt,
		UpdatedAt:     updatedAt,
	}
}
