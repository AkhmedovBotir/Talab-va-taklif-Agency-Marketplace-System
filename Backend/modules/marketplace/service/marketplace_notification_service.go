package service

import (
	"errors"
	"time"

	"backend/modules/marketplace/repository"
)

var ErrMarketplaceNotificationNotFound = errors.New("notification topilmadi")

type MarketplaceNotificationItem struct {
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

type MarketplaceNotificationListResponse struct {
	Items       []MarketplaceNotificationItem `json:"items"`
	Total       int64                           `json:"total"`
	UnreadCount int64                           `json:"unread_count"`
	Page        int                             `json:"page"`
	Limit       int                             `json:"limit"`
	TotalPages  int                             `json:"total_pages"`
}

type MarketplaceNotificationService interface {
	List(page, limit int, userID uint) (*MarketplaceNotificationListResponse, error)
	UnreadCount(userID uint) (int64, error)
	MarkRead(userID, notificationID uint) error
	MarkAllRead(userID uint) error
}

type marketplaceNotificationService struct {
	repo repository.MarketplaceNotificationRepository
}

func NewMarketplaceNotificationService(repo repository.MarketplaceNotificationRepository) MarketplaceNotificationService {
	return &marketplaceNotificationService{repo: repo}
}

func (s *marketplaceNotificationService) List(page, limit int, userID uint) (*MarketplaceNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, userID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(userID)
	if err != nil {
		return nil, err
	}
	items := make([]MarketplaceNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, MarketplaceNotificationItem{
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
	return &MarketplaceNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *marketplaceNotificationService) UnreadCount(userID uint) (int64, error) {
	return s.repo.CountUnread(userID)
}

func (s *marketplaceNotificationService) MarkRead(userID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrMarketplaceNotificationNotFound
	}
	return s.repo.MarkRead(userID, notificationID)
}

func (s *marketplaceNotificationService) MarkAllRead(userID uint) error {
	return s.repo.MarkAllRead(userID)
}
