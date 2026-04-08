package repository

import (
	"time"

	coreDomain "backend/modules/core/domain"
	mgrDomain "backend/modules/managers/domain"
	"gorm.io/gorm"
)

type ManagerNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type ManagerNotificationRepository interface {
	List(page, limit int, managerID uint) ([]ManagerNotificationListRow, int64, error)
	CountUnread(managerID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(managerID, notificationID uint) error
	MarkAllRead(managerID uint) error
}

type managerNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewManagerNotificationRepository(db *gorm.DB) ManagerNotificationRepository {
	return &managerNotificationPostgresRepository{db: db}
}

func (r *managerNotificationPostgresRepository) List(page, limit int, managerID uint) ([]ManagerNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []ManagerNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN manager_notification_reads r ON r.notification_id = n.id AND r.manager_id = ?", managerID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *managerNotificationPostgresRepository) CountUnread(managerID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN manager_notification_reads r ON r.notification_id = n.id AND r.manager_id = ?", managerID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *managerNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *managerNotificationPostgresRepository) MarkRead(managerID, notificationID uint) error {
	now := time.Now().UTC()
	rd := mgrDomain.ManagerNotificationRead{
		ManagerID:      managerID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("manager_id = ? AND notification_id = ?", managerID, notificationID).
		Assign(mgrDomain.ManagerNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *managerNotificationPostgresRepository) MarkAllRead(managerID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO manager_notification_reads (manager_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (manager_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, managerID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetManagers).Error
}

func (r *managerNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetManagers,
	})
}
