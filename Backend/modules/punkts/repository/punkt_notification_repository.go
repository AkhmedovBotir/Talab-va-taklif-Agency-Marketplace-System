package repository

import (
	"time"

	coreDomain "backend/modules/core/domain"
	punktDomain "backend/modules/punkts/domain"
	"gorm.io/gorm"
)

type PunktNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type PunktNotificationRepository interface {
	List(page, limit int, punktID uint) ([]PunktNotificationListRow, int64, error)
	CountUnread(punktID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(punktID, notificationID uint) error
	MarkAllRead(punktID uint) error
}

type punktNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewPunktNotificationRepository(db *gorm.DB) PunktNotificationRepository {
	return &punktNotificationPostgresRepository{db: db}
}

func (r *punktNotificationPostgresRepository) List(page, limit int, punktID uint) ([]PunktNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []PunktNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN punkt_notification_reads r ON r.notification_id = n.id AND r.punkt_id = ?", punktID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *punktNotificationPostgresRepository) CountUnread(punktID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN punkt_notification_reads r ON r.notification_id = n.id AND r.punkt_id = ?", punktID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *punktNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *punktNotificationPostgresRepository) MarkRead(punktID, notificationID uint) error {
	now := time.Now().UTC()
	rd := punktDomain.PunktNotificationRead{
		PunktID:        punktID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("punkt_id = ? AND notification_id = ?", punktID, notificationID).
		Assign(punktDomain.PunktNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *punktNotificationPostgresRepository) MarkAllRead(punktID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO punkt_notification_reads (punkt_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (punkt_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, punktID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetPunkts).Error
}

func (r *punktNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetPunkts,
	})
}
