package repository

import (
	"time"

	admDomain "backend/modules/admin/domain"
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type AdminNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type AdminNotificationRepository interface {
	List(page, limit int, adminID uint) ([]AdminNotificationListRow, int64, error)
	CountUnread(adminID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(adminID, notificationID uint) error
	MarkAllRead(adminID uint) error
}

type adminNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewAdminNotificationRepository(db *gorm.DB) AdminNotificationRepository {
	return &adminNotificationPostgresRepository{db: db}
}

func (r *adminNotificationPostgresRepository) List(page, limit int, adminID uint) ([]AdminNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []AdminNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN admin_notification_reads r ON r.notification_id = n.id AND r.admin_id = ?", adminID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *adminNotificationPostgresRepository) CountUnread(adminID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN admin_notification_reads r ON r.notification_id = n.id AND r.admin_id = ?", adminID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *adminNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *adminNotificationPostgresRepository) MarkRead(adminID, notificationID uint) error {
	now := time.Now().UTC()
	rd := admDomain.AdminNotificationRead{
		AdminID:        adminID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("admin_id = ? AND notification_id = ?", adminID, notificationID).
		Assign(admDomain.AdminNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *adminNotificationPostgresRepository) MarkAllRead(adminID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO admin_notification_reads (admin_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (admin_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, adminID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetAdmins).Error
}

func (r *adminNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetAdmins,
	})
}
