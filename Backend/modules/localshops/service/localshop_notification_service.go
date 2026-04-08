package service

import (
	"errors"
	"time"

	"backend/modules/localshops/repository"
)

var ErrLocalShopNotificationNotFound = errors.New("notification topilmadi")

type LocalShopNotificationItem struct {
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

type LocalShopNotificationListResponse struct {
	Items       []LocalShopNotificationItem `json:"items"`
	Total       int64                       `json:"total"`
	UnreadCount int64                       `json:"unread_count"`
	Page        int                         `json:"page"`
	Limit       int                         `json:"limit"`
	TotalPages  int                         `json:"total_pages"`
}

type LocalShopNotificationService interface {
	List(page, limit int, localShopID uint) (*LocalShopNotificationListResponse, error)
	UnreadCount(localShopID uint) (int64, error)
	MarkRead(localShopID, notificationID uint) error
	MarkAllRead(localShopID uint) error
}

type localShopNotificationService struct {
	repo repository.LocalShopNotificationRepository
}

func NewLocalShopNotificationService(repo repository.LocalShopNotificationRepository) LocalShopNotificationService {
	return &localShopNotificationService{repo: repo}
}

func (s *localShopNotificationService) List(page, limit int, localShopID uint) (*LocalShopNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, localShopID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(localShopID)
	if err != nil {
		return nil, err
	}
	items := make([]LocalShopNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, LocalShopNotificationItem{
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
	return &LocalShopNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *localShopNotificationService) UnreadCount(localShopID uint) (int64, error) {
	return s.repo.CountUnread(localShopID)
}

func (s *localShopNotificationService) MarkRead(localShopID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrLocalShopNotificationNotFound
	}
	return s.repo.MarkRead(localShopID, notificationID)
}

func (s *localShopNotificationService) MarkAllRead(localShopID uint) error {
	return s.repo.MarkAllRead(localShopID)
}
