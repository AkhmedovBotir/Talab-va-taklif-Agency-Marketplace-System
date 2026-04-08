package service

import (
	"errors"
	"time"

	"backend/modules/deliveryproviders/repository"
)

var ErrDeliveryProviderNotificationNotFound = errors.New("notification topilmadi")

type DeliveryProviderNotificationItem struct {
	ID         uint       `json:"id"`
	Title      string     `json:"title"`
	Message    string     `json:"message"`
	Type       string     `json:"type"`
	TargetType string     `json:"target_type"`
	IsRead     bool       `json:"is_read"`
	ReadAt     *time.Time `json:"read_at,omitempty"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}

type DeliveryProviderNotificationListResponse struct {
	Items       []DeliveryProviderNotificationItem `json:"items"`
	Total       int64                              `json:"total"`
	UnreadCount int64                              `json:"unread_count"`
	Page        int                                `json:"page"`
	Limit       int                                `json:"limit"`
	TotalPages  int                                `json:"total_pages"`
}

type DeliveryProviderNotificationService interface {
	List(page, limit int, deliveryProviderID uint) (*DeliveryProviderNotificationListResponse, error)
	UnreadCount(deliveryProviderID uint) (int64, error)
	MarkRead(deliveryProviderID, notificationID uint) error
	MarkAllRead(deliveryProviderID uint) error
}

type deliveryProviderNotificationService struct {
	repo repository.DeliveryProviderNotificationRepository
}

func NewDeliveryProviderNotificationService(repo repository.DeliveryProviderNotificationRepository) DeliveryProviderNotificationService {
	return &deliveryProviderNotificationService{repo: repo}
}

func (s *deliveryProviderNotificationService) List(page, limit int, deliveryProviderID uint) (*DeliveryProviderNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, deliveryProviderID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(deliveryProviderID)
	if err != nil {
		return nil, err
	}
	items := make([]DeliveryProviderNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, DeliveryProviderNotificationItem{
			ID:         row.ID,
			Title:      row.Title,
			Message:    row.Message,
			Type:       row.Type,
			TargetType: row.TargetType,
			IsRead:     row.ReadAt != nil,
			ReadAt:     row.ReadAt,
			CreatedAt:  row.CreatedAt,
			UpdatedAt:  row.UpdatedAt,
		})
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &DeliveryProviderNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *deliveryProviderNotificationService) UnreadCount(deliveryProviderID uint) (int64, error) {
	return s.repo.CountUnread(deliveryProviderID)
}

func (s *deliveryProviderNotificationService) MarkRead(deliveryProviderID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrDeliveryProviderNotificationNotFound
	}
	return s.repo.MarkRead(deliveryProviderID, notificationID)
}

func (s *deliveryProviderNotificationService) MarkAllRead(deliveryProviderID uint) error {
	return s.repo.MarkAllRead(deliveryProviderID)
}
