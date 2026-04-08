package service

import (
	"strings"
	"time"

	adminDomain "backend/modules/admin/domain"
	adminRepo "backend/modules/admin/repository"
	adminSvc "backend/modules/admin/service"
)

type ManagerProductCommentFollowupService interface {
	List(regionID uint, page, limit int, status *string, escalated *bool) (*adminSvc.ProductCommentPaginatedOutput, error)
	Get(regionID, ratingID uint) (*adminSvc.ProductCommentDetailOutput, error)
	AddNote(managerID, regionID, ratingID uint, note string) error
	AddCall(managerID, regionID, ratingID uint, note string) error
	Escalate(managerID, regionID, ratingID uint, note string) error
	Resolve(managerID, regionID, ratingID uint, note string) error
}

type managerProductCommentFollowupService struct {
	repo adminRepo.ProductCommentFollowupRepository
}

func NewManagerProductCommentFollowupService(repo adminRepo.ProductCommentFollowupRepository) ManagerProductCommentFollowupService {
	return &managerProductCommentFollowupService{repo: repo}
}

func (s *managerProductCommentFollowupService) List(regionID uint, page, limit int, status *string, escalated *bool) (*adminSvc.ProductCommentPaginatedOutput, error) {
	rows, total, err := s.repo.List(adminRepo.ProductCommentListFilter{
		Page:      page,
		Limit:     limit,
		Status:    status,
		Escalated: escalated,
		RegionID:  &regionID,
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
	return &adminSvc.ProductCommentPaginatedOutput{
		Items:      rows,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *managerProductCommentFollowupService) Get(regionID, ratingID uint) (*adminSvc.ProductCommentDetailOutput, error) {
	row, err := s.repo.GetByRatingID(ratingID, &regionID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, adminSvc.ErrProductCommentNotFound
	}
	c, err := s.ensureCase(ratingID)
	if err != nil {
		return nil, err
	}
	acts, err := s.repo.ListActivities(c.ID)
	if err != nil {
		return nil, err
	}
	return &adminSvc.ProductCommentDetailOutput{Comment: row, Activities: acts}, nil
}

func (s *managerProductCommentFollowupService) AddNote(managerID, regionID, ratingID uint, note string) error {
	note = strings.TrimSpace(note)
	if note == "" {
		return adminSvc.ErrFollowupNoteRequired
	}
	c, err := s.ensureRegionCase(regionID, ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&adminDomain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "manager",
		ActorID:   managerID,
		Action:    adminDomain.ProductCommentActionNote,
		Note:      note,
	})
}

func (s *managerProductCommentFollowupService) AddCall(managerID, regionID, ratingID uint, note string) error {
	note = strings.TrimSpace(note)
	if note == "" {
		return adminSvc.ErrFollowupNoteRequired
	}
	c, err := s.ensureRegionCase(regionID, ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&adminDomain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "manager",
		ActorID:   managerID,
		Action:    adminDomain.ProductCommentActionCall,
		Note:      note,
	})
}

func (s *managerProductCommentFollowupService) Escalate(managerID, regionID, ratingID uint, note string) error {
	c, err := s.ensureRegionCase(regionID, ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.Status = adminDomain.ProductCommentCaseStatusEscalated
	c.EscalatedToAdmin = true
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&adminDomain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "manager",
		ActorID:   managerID,
		Action:    adminDomain.ProductCommentActionEscalate,
		Note:      strings.TrimSpace(note),
	})
}

func (s *managerProductCommentFollowupService) Resolve(managerID, regionID, ratingID uint, note string) error {
	c, err := s.ensureRegionCase(regionID, ratingID)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	c.Status = adminDomain.ProductCommentCaseStatusResolved
	c.ResolvedAt = &now
	c.LastContactAt = &now
	if err = s.repo.UpdateCase(c); err != nil {
		return err
	}
	return s.repo.CreateActivity(&adminDomain.ProductCommentActivity{
		CaseID:    c.ID,
		ActorRole: "manager",
		ActorID:   managerID,
		Action:    adminDomain.ProductCommentActionResolve,
		Note:      strings.TrimSpace(note),
	})
}

func (s *managerProductCommentFollowupService) ensureCase(ratingID uint) (*adminDomain.ProductCommentCase, error) {
	c, err := s.repo.GetCaseByRatingID(ratingID)
	if err != nil {
		return nil, err
	}
	if c != nil {
		return c, nil
	}
	row := &adminDomain.ProductCommentCase{
		RatingID: ratingID,
		Status:   adminDomain.ProductCommentCaseStatusOpen,
	}
	if err = s.repo.CreateCase(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *managerProductCommentFollowupService) ensureRegionCase(regionID, ratingID uint) (*adminDomain.ProductCommentCase, error) {
	row, err := s.repo.GetByRatingID(ratingID, &regionID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, adminSvc.ErrProductCommentNotFound
	}
	return s.ensureCase(ratingID)
}

