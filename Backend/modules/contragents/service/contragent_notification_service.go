package service

import (
	"errors"
	"time"

	"backend/modules/contragents/repository"
)

var ErrContragentNotificationNotFound = errors.New("notification topilmadi")

type ContragentNotificationItem struct {
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

type ContragentNotificationListResponse struct {
	Items       []ContragentNotificationItem `json:"items"`
	Total       int64                        `json:"total"`
	UnreadCount int64                        `json:"unread_count"`
	Page        int                          `json:"page"`
	Limit       int                          `json:"limit"`
	TotalPages  int                          `json:"total_pages"`
}

type ContragentNotificationService interface {
	List(page, limit int, contragentID uint) (*ContragentNotificationListResponse, error)
	UnreadCount(contragentID uint) (int64, error)
	MarkRead(contragentID, notificationID uint) error
	MarkAllRead(contragentID uint) error
}

type contragentNotificationService struct {
	repo repository.ContragentNotificationRepository
}

func NewContragentNotificationService(repo repository.ContragentNotificationRepository) ContragentNotificationService {
	return &contragentNotificationService{repo: repo}
}

func (s *contragentNotificationService) List(page, limit int, contragentID uint) (*ContragentNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, contragentID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(contragentID)
	if err != nil {
		return nil, err
	}
	items := make([]ContragentNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, ContragentNotificationItem{
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
	return &ContragentNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *contragentNotificationService) UnreadCount(contragentID uint) (int64, error) {
	return s.repo.CountUnread(contragentID)
}

func (s *contragentNotificationService) MarkRead(contragentID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrContragentNotificationNotFound
	}
	return s.repo.MarkRead(contragentID, notificationID)
}

func (s *contragentNotificationService) MarkAllRead(contragentID uint) error {
	return s.repo.MarkAllRead(contragentID)
}
