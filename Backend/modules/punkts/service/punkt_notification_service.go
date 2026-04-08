package service

import (
	"errors"
	"time"

	"backend/modules/punkts/repository"
)

var ErrPunktNotificationNotFound = errors.New("notification topilmadi")

type PunktNotificationItem struct {
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

type PunktNotificationListResponse struct {
	Items       []PunktNotificationItem `json:"items"`
	Total       int64                   `json:"total"`
	UnreadCount int64                   `json:"unread_count"`
	Page        int                     `json:"page"`
	Limit       int                     `json:"limit"`
	TotalPages  int                     `json:"total_pages"`
}

type PunktNotificationService interface {
	List(page, limit int, punktID uint) (*PunktNotificationListResponse, error)
	UnreadCount(punktID uint) (int64, error)
	MarkRead(punktID, notificationID uint) error
	MarkAllRead(punktID uint) error
}

type punktNotificationService struct {
	repo repository.PunktNotificationRepository
}

func NewPunktNotificationService(repo repository.PunktNotificationRepository) PunktNotificationService {
	return &punktNotificationService{repo: repo}
}

func (s *punktNotificationService) List(page, limit int, punktID uint) (*PunktNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, punktID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(punktID)
	if err != nil {
		return nil, err
	}
	items := make([]PunktNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, PunktNotificationItem{
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
	return &PunktNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *punktNotificationService) UnreadCount(punktID uint) (int64, error) {
	return s.repo.CountUnread(punktID)
}

func (s *punktNotificationService) MarkRead(punktID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrPunktNotificationNotFound
	}
	return s.repo.MarkRead(punktID, notificationID)
}

func (s *punktNotificationService) MarkAllRead(punktID uint) error {
	return s.repo.MarkAllRead(punktID)
}
