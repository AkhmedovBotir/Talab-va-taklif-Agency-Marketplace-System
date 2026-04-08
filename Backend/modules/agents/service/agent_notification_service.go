package service

import (
	"errors"
	"time"

	"backend/modules/agents/repository"
)

var ErrAgentNotificationNotFound = errors.New("notification topilmadi")

type AgentNotificationItem struct {
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

type AgentNotificationListResponse struct {
	Items       []AgentNotificationItem `json:"items"`
	Total       int64                   `json:"total"`
	UnreadCount int64                   `json:"unread_count"`
	Page        int                     `json:"page"`
	Limit       int                     `json:"limit"`
	TotalPages  int                     `json:"total_pages"`
}

type AgentNotificationService interface {
	List(page, limit int, agentID uint) (*AgentNotificationListResponse, error)
	UnreadCount(agentID uint) (int64, error)
	MarkRead(agentID, notificationID uint) error
	MarkAllRead(agentID uint) error
}

type agentNotificationService struct {
	repo repository.AgentNotificationRepository
}

func NewAgentNotificationService(repo repository.AgentNotificationRepository) AgentNotificationService {
	return &agentNotificationService{repo: repo}
}

func (s *agentNotificationService) List(page, limit int, agentID uint) (*AgentNotificationListResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	rows, total, err := s.repo.List(page, limit, agentID)
	if err != nil {
		return nil, err
	}
	unread, err := s.repo.CountUnread(agentID)
	if err != nil {
		return nil, err
	}
	items := make([]AgentNotificationItem, 0, len(rows))
	for _, row := range rows {
		items = append(items, AgentNotificationItem{
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
	return &AgentNotificationListResponse{
		Items:       items,
		Total:       total,
		UnreadCount: unread,
		Page:        page,
		Limit:       limit,
		TotalPages:  totalPages,
	}, nil
}

func (s *agentNotificationService) UnreadCount(agentID uint) (int64, error) {
	return s.repo.CountUnread(agentID)
}

func (s *agentNotificationService) MarkRead(agentID, notificationID uint) error {
	row, err := s.repo.GetVisibleByID(notificationID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrAgentNotificationNotFound
	}
	return s.repo.MarkRead(agentID, notificationID)
}

func (s *agentNotificationService) MarkAllRead(agentID uint) error {
	return s.repo.MarkAllRead(agentID)
}
