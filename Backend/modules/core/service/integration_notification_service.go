package service

import (
	"errors"
	"strings"

	"backend/modules/core/domain"
	"backend/modules/core/repository"
)

var (
	ErrIntegrationNotificationNotFound    = errors.New("notification topilmadi")
	ErrIntegrationNotificationTitle       = errors.New("title majburiy")
	ErrIntegrationNotificationMessage     = errors.New("message majburiy")
	ErrIntegrationNotificationTypeInvalid = errors.New("type noto'g'ri")
	ErrIntegrationNotificationTargetType  = errors.New("target_type noto'g'ri")
)

type IntegrationNotificationInput struct {
	Title      string `json:"title"`
	Message    string `json:"message"`
	Type       string `json:"type"`
	TargetType string `json:"target_type"`
}

type PaginatedIntegrationNotifications struct {
	Items      []domain.IntegrationNotification `json:"items"`
	Total      int64                            `json:"total"`
	Page       int                              `json:"page"`
	Limit      int                              `json:"limit"`
	TotalPages int                              `json:"total_pages"`
}

type IntegrationNotificationService interface {
	Create(input IntegrationNotificationInput) (*domain.IntegrationNotification, error)
	List(page, limit int) (*PaginatedIntegrationNotifications, error)
	GetByID(id uint) (*domain.IntegrationNotification, error)
	Update(id uint, input IntegrationNotificationInput) (*domain.IntegrationNotification, error)
	Delete(id uint) error
}

type integrationNotificationService struct {
	repo repository.IntegrationNotificationRepository
}

func NewIntegrationNotificationService(repo repository.IntegrationNotificationRepository) IntegrationNotificationService {
	return &integrationNotificationService{repo: repo}
}

func (s *integrationNotificationService) Create(input IntegrationNotificationInput) (*domain.IntegrationNotification, error) {
	input.normalize()
	if err := validateNotificationInput(input); err != nil {
		return nil, err
	}
	row := &domain.IntegrationNotification{
		Title:      input.Title,
		Message:    input.Message,
		Type:       input.Type,
		TargetType: input.TargetType,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *integrationNotificationService) List(page, limit int) (*PaginatedIntegrationNotifications, error) {
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
	return &PaginatedIntegrationNotifications{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *integrationNotificationService) GetByID(id uint) (*domain.IntegrationNotification, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrIntegrationNotificationNotFound
	}
	return row, nil
}

func (s *integrationNotificationService) Update(id uint, input IntegrationNotificationInput) (*domain.IntegrationNotification, error) {
	input.normalize()
	if err := validateNotificationInput(input); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrIntegrationNotificationNotFound
	}
	row.Title = input.Title
	row.Message = input.Message
	row.Type = input.Type
	row.TargetType = input.TargetType
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *integrationNotificationService) Delete(id uint) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrIntegrationNotificationNotFound
	}
	return s.repo.Delete(id)
}

func validateNotificationInput(input IntegrationNotificationInput) error {
	if input.Title == "" {
		return ErrIntegrationNotificationTitle
	}
	if input.Message == "" {
		return ErrIntegrationNotificationMessage
	}
	if !isAllowedNotificationType(input.Type) {
		return ErrIntegrationNotificationTypeInvalid
	}
	if !isAllowedNotificationTargetType(input.TargetType) {
		return ErrIntegrationNotificationTargetType
	}
	return nil
}

func isAllowedNotificationType(v string) bool {
	switch v {
	case domain.NotificationTypeInfo,
		domain.NotificationTypeWarning,
		domain.NotificationTypeSuccess,
		domain.NotificationTypeError,
		domain.NotificationTypeUpdate,
		domain.NotificationTypeAnnouncement:
		return true
	default:
		return false
	}
}

func isAllowedNotificationTargetType(v string) bool {
	switch v {
	case domain.NotificationTargetAll,
		domain.NotificationTargetAdmins,
		domain.NotificationTargetAgents,
		domain.NotificationTargetContragents,
		domain.NotificationTargetMarketplace,
		domain.NotificationTargetManagers,
		domain.NotificationTargetPunkts,
		domain.NotificationTargetLocalShops,
		domain.NotificationTargetDeliveryProviders:
		return true
	default:
		return false
	}
}

func (i *IntegrationNotificationInput) normalize() {
	i.Title = strings.TrimSpace(i.Title)
	i.Message = strings.TrimSpace(i.Message)
	i.Type = strings.TrimSpace(strings.ToLower(i.Type))
	i.TargetType = strings.TrimSpace(strings.ToLower(i.TargetType))
}

