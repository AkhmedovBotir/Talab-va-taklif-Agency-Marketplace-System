package repository

import (
	"time"

	agDomain "backend/modules/agents/domain"
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type AgentNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type AgentNotificationRepository interface {
	List(page, limit int, agentID uint) ([]AgentNotificationListRow, int64, error)
	CountUnread(agentID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(agentID, notificationID uint) error
	MarkAllRead(agentID uint) error
}

type agentNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewAgentNotificationRepository(db *gorm.DB) AgentNotificationRepository {
	return &agentNotificationPostgresRepository{db: db}
}

func (r *agentNotificationPostgresRepository) List(page, limit int, agentID uint) ([]AgentNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []AgentNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN agent_notification_reads r ON r.notification_id = n.id AND r.agent_id = ?", agentID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *agentNotificationPostgresRepository) CountUnread(agentID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN agent_notification_reads r ON r.notification_id = n.id AND r.agent_id = ?", agentID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *agentNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
	var row coreDomain.IntegrationNotification
	err := r.visibleBaseQuery(r.db).Where("id = ?", id).First(&row).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *agentNotificationPostgresRepository) MarkRead(agentID, notificationID uint) error {
	now := time.Now().UTC()
	rd := agDomain.AgentNotificationRead{
		AgentID:        agentID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("agent_id = ? AND notification_id = ?", agentID, notificationID).
		Assign(agDomain.AgentNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *agentNotificationPostgresRepository) MarkAllRead(agentID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO agent_notification_reads (agent_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (agent_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, agentID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetAgents).Error
}

func (r *agentNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetAgents,
	})
}
