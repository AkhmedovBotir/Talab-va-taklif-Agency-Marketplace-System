package service

import (
	"errors"
	"time"

	"backend/modules/managers/repository"
)

var ErrManagerNotificationNotFound = errors.New("notification topilmadi")

type ManagerNotificationItem struct {
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

type ManagerNotificationListResponse struct {
	Items       []ManagerNotificationItem `json:"items"`
	Total       int64                     `json:"total"`
	UnreadCount int64                     `json:"unread_count"`
	Page        int                       `json:"page"`
	Limit       int                       `json:"limit"`
	TotalPages  int                       `json:"total_pages"`
}

type ManagerNotificationService interface {
	List(page, limit int, managerID uint) (*ManagerNotificationListResponse, error)
	UnreadCount(managerID uint) (int64, error)
	MarkRead(managerID, notificationID uint) error
	MarkAllRead(managerID uint) error
}

type managerNotificationService struct {
	repo repository.ManagerNotificationRepository
}

func NewManagerNotificationService(repo repository.ManagerNotificationRepository) ManagerNotificationService {
	return &managerNotificationService{repo: repo}
}

func (s *managerNotificationService) List(page, limit int, managerID uint) (*ManagerNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, managerID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(managerID)
	if err != nil {
		return nil, err
	}
	items := make([]ManagerNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, ManagerNotificationItem{
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
	return &ManagerNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *managerNotificationService) UnreadCount(managerID uint) (int64, error) {
	return s.repo.CountUnread(managerID)
}

func (s *managerNotificationService) MarkRead(managerID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrManagerNotificationNotFound
	}
	return s.repo.MarkRead(managerID, notificationID)
}

func (s *managerNotificationService) MarkAllRead(managerID uint) error {
	return s.repo.MarkAllRead(managerID)
}
