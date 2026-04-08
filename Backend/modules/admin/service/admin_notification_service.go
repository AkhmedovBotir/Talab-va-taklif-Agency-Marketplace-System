package service

import (
	"errors"
	"time"

	"backend/modules/admin/repository"
	coreDomain "backend/modules/core/domain"
)

var ErrAdminNotificationNotFound = errors.New("notification topilmadi")

type AdminNotificationItem struct {
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

type AdminNotificationListResponse struct {
	Items        []AdminNotificationItem `json:"items"`
	Total        int64                   `json:"total"`
	UnreadCount  int64                   `json:"unread_count"`
	Page         int                     `json:"page"`
	Limit        int                     `json:"limit"`
	TotalPages   int                     `json:"total_pages"`
}

type AdminNotificationService interface {
	List(page, limit int, adminID uint) (*AdminNotificationListResponse, error)
	UnreadCount(adminID uint) (int64, error)
	MarkRead(adminID, notificationID uint) error
	MarkAllRead(adminID uint) error
}

type adminNotificationService struct {
	repo repository.AdminNotificationRepository
}

func NewAdminNotificationService(repo repository.AdminNotificationRepository) AdminNotificationService {
	return &adminNotificationService{repo: repo}
}

func (s *adminNotificationService) List(page, limit int, adminID uint) (*AdminNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, adminID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(adminID)
	if err != nil {
		return nil, err
	}
	items := make([]AdminNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, AdminNotificationItem{
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
	return &AdminNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *adminNotificationService) UnreadCount(adminID uint) (int64, error) {
	return s.repo.CountUnread(adminID)
}

func (s *adminNotificationService) MarkRead(adminID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrAdminNotificationNotFound
	}
	return s.repo.MarkRead(adminID, notificationID)
}

func (s *adminNotificationService) MarkAllRead(adminID uint) error {
	return s.repo.MarkAllRead(adminID)
}

func IsAdminVisibleTarget(target string) bool {
	return target == coreDomain.NotificationTargetAll || target == coreDomain.NotificationTargetAdmins
}
