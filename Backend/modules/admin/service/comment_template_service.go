package service

import (
	"errors"
	"strings"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
)

var (
	ErrCommentTemplateNotFound        = errors.New("kommentariya shabloni topilmadi")
	ErrCommentTemplateCommentRequired = errors.New("comment majburiy")
	ErrCommentTemplateReorderInvalid  = errors.New("from_id va to_id noto'g'ri")
)

type CommentTemplateInput struct {
	Comment string `json:"comment"`
	Status  string `json:"status"`
}

type ReorderCommentTemplateInput struct {
	FromID uint `json:"from_id"`
	ToID   uint `json:"to_id"`
}

type PaginatedCommentTemplates struct {
	Items      []domain.CommentTemplate `json:"items"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

type CommentTemplateService interface {
	Create(input CommentTemplateInput) (*domain.CommentTemplate, error)
	List(page, limit int) (*PaginatedCommentTemplates, error)
	GetByID(id uint) (*domain.CommentTemplate, error)
	Update(id uint, input CommentTemplateInput) (*domain.CommentTemplate, error)
	Delete(id uint) error
	Reorder(input ReorderCommentTemplateInput) error
}

type commentTemplateService struct {
	repo repository.CommentTemplateRepository
}

func NewCommentTemplateService(repo repository.CommentTemplateRepository) CommentTemplateService {
	return &commentTemplateService{repo: repo}
}

func (s *commentTemplateService) Create(input CommentTemplateInput) (*domain.CommentTemplate, error) {
	input.Comment = strings.TrimSpace(input.Comment)
	if input.Comment == "" {
		return nil, ErrCommentTemplateCommentRequired
	}
	status, err := normalizeStatus(strings.TrimSpace(input.Status))
	if err != nil {
		return nil, err
	}
	maxOrder, err := s.repo.GetMaxSortOrder()
	if err != nil {
		return nil, err
	}
	row := &domain.CommentTemplate{
		Comment:   input.Comment,
		Status:    status,
		SortOrder: maxOrder + 1,
	}
	return row, s.repo.Create(row)
}

func (s *commentTemplateService) List(page, limit int) (*PaginatedCommentTemplates, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	items, total, err := s.repo.List(page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedCommentTemplates{Items: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *commentTemplateService) GetByID(id uint) (*domain.CommentTemplate, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCommentTemplateNotFound
	}
	return row, nil
}

func (s *commentTemplateService) Update(id uint, input CommentTemplateInput) (*domain.CommentTemplate, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCommentTemplateNotFound
	}
	input.Comment = strings.TrimSpace(input.Comment)
	if input.Comment == "" {
		return nil, ErrCommentTemplateCommentRequired
	}
	status, err := normalizeStatus(strings.TrimSpace(input.Status))
	if err != nil {
		return nil, err
	}
	row.Comment = input.Comment
	row.Status = status
	return row, s.repo.Update(row)
}

func (s *commentTemplateService) Delete(id uint) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrCommentTemplateNotFound
	}
	return s.repo.Delete(id)
}

func (s *commentTemplateService) Reorder(input ReorderCommentTemplateInput) error {
	if input.FromID == 0 || input.ToID == 0 || input.FromID == input.ToID {
		return ErrCommentTemplateReorderInvalid
	}
	from, err := s.repo.GetByID(input.FromID)
	if err != nil {
		return err
	}
	if from == nil {
		return ErrCommentTemplateNotFound
	}
	to, err := s.repo.GetByID(input.ToID)
	if err != nil {
		return err
	}
	if to == nil {
		return ErrCommentTemplateNotFound
	}
	// Simple swap
	from.SortOrder, to.SortOrder = to.SortOrder, from.SortOrder
	if err := s.repo.Update(from); err != nil {
		return err
	}
	return s.repo.Update(to)
}
