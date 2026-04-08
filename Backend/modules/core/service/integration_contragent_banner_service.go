package service

import (
	"errors"
	"strings"
	"time"

	adminDomain "backend/modules/admin/domain"
	coreDomain "backend/modules/core/domain"
	"backend/modules/core/repository"
	"gorm.io/gorm"
)

var (
	ErrBannerContragentRequired = errors.New("contragent_id majburiy")
	ErrBannerTimeInvalid        = errors.New("start_at va end_at noto'g'ri")
	ErrBannerStatusInvalid      = errors.New("status faqat active yoki inactive bo'lishi kerak")
	ErrBannerNotFound           = errors.New("banner topilmadi")
)

type CreateIntegrationContragentBannerInput struct {
	ContragentID uint   `json:"contragent_id"`
	StartAt      string `json:"start_at"`
	EndAt        string `json:"end_at"`
	Status       string `json:"status"`
}

type UpdateIntegrationContragentBannerInput = CreateIntegrationContragentBannerInput

type IntegrationContragentBannerService interface {
	Create(input CreateIntegrationContragentBannerInput) (*coreDomain.IntegrationContragentBanner, error)
	List() ([]coreDomain.IntegrationContragentBanner, error)
	Update(id uint, input UpdateIntegrationContragentBannerInput) error
	Delete(id uint) error
}

type integrationContragentBannerService struct {
	repo repository.IntegrationContragentBannerRepository
	db   *gorm.DB
}

func NewIntegrationContragentBannerService(repo repository.IntegrationContragentBannerRepository, db *gorm.DB) IntegrationContragentBannerService {
	return &integrationContragentBannerService{repo: repo, db: db}
}

func parseDT(raw string) (time.Time, error) {
	t, err := time.Parse(time.RFC3339, strings.TrimSpace(raw))
	if err != nil {
		return time.Time{}, err
	}
	return t.UTC(), nil
}

func (s *integrationContragentBannerService) validate(input CreateIntegrationContragentBannerInput) (time.Time, time.Time, string, error) {
	if input.ContragentID == 0 {
		return time.Time{}, time.Time{}, "", ErrBannerContragentRequired
	}
	var cnt int64
	if err := s.db.Model(&adminDomain.Contragent{}).Where("id = ?", input.ContragentID).Count(&cnt).Error; err != nil {
		return time.Time{}, time.Time{}, "", err
	}
	if cnt == 0 {
		return time.Time{}, time.Time{}, "", ErrBannerContragentRequired
	}
	startAt, err := parseDT(input.StartAt)
	if err != nil {
		return time.Time{}, time.Time{}, "", ErrBannerTimeInvalid
	}
	endAt, err := parseDT(input.EndAt)
	if err != nil || !endAt.After(startAt) {
		return time.Time{}, time.Time{}, "", ErrBannerTimeInvalid
	}
	status := strings.ToLower(strings.TrimSpace(input.Status))
	if status == "" {
		status = adminDomain.StatusActive
	}
	if status != adminDomain.StatusActive && status != adminDomain.StatusInactive {
		return time.Time{}, time.Time{}, "", ErrBannerStatusInvalid
	}
	return startAt, endAt, status, nil
}

func (s *integrationContragentBannerService) Create(input CreateIntegrationContragentBannerInput) (*coreDomain.IntegrationContragentBanner, error) {
	startAt, endAt, status, err := s.validate(input)
	if err != nil {
		return nil, err
	}
	row := &coreDomain.IntegrationContragentBanner{ContragentID: input.ContragentID, StartAt: startAt, EndAt: endAt, Status: status}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *integrationContragentBannerService) List() ([]coreDomain.IntegrationContragentBanner, error) {
	return s.repo.List()
}

func (s *integrationContragentBannerService) Update(id uint, input UpdateIntegrationContragentBannerInput) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrBannerNotFound
	}
	startAt, endAt, status, err := s.validate(CreateIntegrationContragentBannerInput(input))
	if err != nil {
		return err
	}
	row.ContragentID = input.ContragentID
	row.StartAt = startAt
	row.EndAt = endAt
	row.Status = status
	return s.repo.Update(row)
}

func (s *integrationContragentBannerService) Delete(id uint) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrBannerNotFound
	}
	return s.repo.Delete(id)
}
