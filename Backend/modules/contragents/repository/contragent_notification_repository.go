package repository

import (
	"time"

	cgDomain "backend/modules/contragents/domain"
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type ContragentNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type ContragentNotificationRepository interface {
	List(page, limit int, contragentID uint) ([]ContragentNotificationListRow, int64, error)
	CountUnread(contragentID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(contragentID, notificationID uint) error
	MarkAllRead(contragentID uint) error
}

type contragentNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewContragentNotificationRepository(db *gorm.DB) ContragentNotificationRepository {
	return &contragentNotificationPostgresRepository{db: db}
}

func (r *contragentNotificationPostgresRepository) List(page, limit int, contragentID uint) ([]ContragentNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []ContragentNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN contragent_notification_reads r ON r.notification_id = n.id AND r.contragent_id = ?", contragentID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *contragentNotificationPostgresRepository) CountUnread(contragentID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN contragent_notification_reads r ON r.notification_id = n.id AND r.contragent_id = ?", contragentID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *contragentNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *contragentNotificationPostgresRepository) MarkRead(contragentID, notificationID uint) error {
	now := time.Now().UTC()
	rd := cgDomain.ContragentNotificationRead{
		ContragentID:   contragentID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("contragent_id = ? AND notification_id = ?", contragentID, notificationID).
		Assign(cgDomain.ContragentNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *contragentNotificationPostgresRepository) MarkAllRead(contragentID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO contragent_notification_reads (contragent_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (contragent_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, contragentID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetContragents).Error
}

func (r *contragentNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetContragents,
	})
}
