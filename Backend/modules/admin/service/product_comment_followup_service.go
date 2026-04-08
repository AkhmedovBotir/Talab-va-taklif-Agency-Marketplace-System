package service

import (
	"errors"
	"strings"
	"time"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
)

var (
	ErrProductCommentNotFound = errors.New("product comment topilmadi")
	ErrFollowupNoteRequired   = errors.New("note majburiy")
)

type ProductCommentActionInput struct {
	Note string `json:"note"`
}

type ProductCommentDetailOutput struct {
	Comment    *repository.ProductCommentRow    `json:"comment"`
	Activities []domain.ProductCommentActivity `json:"activities"`
}

type ProductCommentPaginatedOutput struct {
	Items      []repository.ProductCommentRow `json:"items"`
	Total      int64                          `json:"total"`
	Page       int                            `json:"page"`
	Limit      int                            `json:"limit"`
	TotalPages int                            `json:"total_pages"`
}

type AdminProductCommentFollowupService interface {
	List(page, limit int, status *string, escalated *bool) (*ProductCommentPaginatedOutput, error)
	Get(ratingID uint) (*ProductCommentDetailOutput, error)
	AddNote(adminID, ratingID uint, note string) error
	AddCall(adminID, ratingID uint, note string) error
	Resolve(adminID, ratingID uint, note string) error
}

type adminProductCommentFollowupService struct {
	repo repository.ProductCommentFollowupRepository
}

func NewAdminProductCommentFollowupService(repo repository.ProductCommentFollowupRepository) AdminProductCommentFollowupService {
	return &adminProductCommentFollowupService{repo: repo}
}

func (s *adminProductCommentFollowupService) List(page, limit int, status *string, escalated *bool) (*ProductCommentPaginatedOutput, error) {
	rows, total, err := s.repo.List(repository.ProductCommentListFilter{
		Page:      page,
		Limit:     limit,
		Status:    status,
		Escalated: escalated,
	})
	if err != nil {
		return nil, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &ProductCommentPaginatedOutput{
		Items:      rows,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *adminProductCommentFollowupService) Get(ratingID uint) (*ProductCommentDetailOutput, error) {
	row, err := s.repo.GetByRatingID(ratingID, nil)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductCommentNotFound
	}
	c, err := s.ensureCase(ratingID)
	if err != nil {
		return nil, err
	}
	acts, err := s.repo.ListActivities(c.ID)
	if err != nil {
		return nil, err
	}
	return &ProductCommentDetailOutput{Comment: row, Activities: acts}, nil
}

func (s *adminProductCommentFollowupService) AddNote(adminID, ratingID uint, note string) error {
	note = strings.TrimSpace(note)
	if note == "" {
		return ErrFollowupNoteRequired
	}
	c, err := s.ensureExistingCase(ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&domain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "admin",
		ActorID:   adminID,
		Action:    domain.ProductCommentActionNote,
		Note:      note,
	})
}

func (s *adminProductCommentFollowupService) AddCall(adminID, ratingID uint, note string) error {
	note = strings.TrimSpace(note)
	if note == "" {
		return ErrFollowupNoteRequired
	}
	c, err := s.ensureExistingCase(ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&domain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "admin",
		ActorID:   adminID,
		Action:    domain.ProductCommentActionCall,
		Note:      note,
	})
}

func (s *adminProductCommentFollowupService) Resolve(adminID, ratingID uint, note string) error {
	note = strings.TrimSpace(note)
	c, err := s.ensureExistingCase(ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.Status = domain.ProductCommentCaseStatusResolved
	c.ResolvedAt = &now
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&domain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "admin",
		ActorID:   adminID,
		Action:    domain.ProductCommentActionResolve,
		Note:      note,
	})
}

func (s *adminProductCommentFollowupService) ensureCase(ratingID uint) (*domain.ProductCommentCase, error) {
	c, err := s.repo.GetCaseByRatingID(ratingID)
	if err != nil {
		return nil, err
	}
	if c != nil {
		return c, nil
	}
	row := &domain.ProductCommentCase{
		RatingID:         ratingID,
		Status:           domain.ProductCommentCaseStatusOpen,
		EscalatedToAdmin: false,
	}
	if err = s.repo.CreateCase(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *adminProductCommentFollowupService) ensureExistingCase(ratingID uint) (*domain.ProductCommentCase, error) {
	row, err := s.repo.GetByRatingID(ratingID, nil)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrProductCommentNotFound
	}
	return s.ensureCase(ratingID)
}

