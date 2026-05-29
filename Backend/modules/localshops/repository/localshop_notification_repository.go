package repository

import (
	"time"

	lsDomain "backend/modules/localshops/domain"
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type LocalShopNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type LocalShopNotificationRepository interface {
	List(page, limit int, localShopID uint) ([]LocalShopNotificationListRow, int64, error)
	CountUnread(localShopID uint) (int64, error)
	GetVisibleByID(id, localShopID uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(localShopID, notificationID uint) error
	MarkAllRead(localShopID uint) error
}

type localShopNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopNotificationRepository(db *gorm.DB) LocalShopNotificationRepository {
	return &localShopNotificationPostgresRepository{db: db}
}

func (r *localShopNotificationPostgresRepository) List(page, limit int, localShopID uint) ([]LocalShopNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{}), localShopID).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []LocalShopNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n"), localShopID).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.neighborhood_shop_id, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN local_shop_notification_reads r ON r.notification_id = n.id AND r.local_shop_id = ?", localShopID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *localShopNotificationPostgresRepository) CountUnread(localShopID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n"), localShopID).
		Joins("LEFT JOIN local_shop_notification_reads r ON r.notification_id = n.id AND r.local_shop_id = ?", localShopID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *localShopNotificationPostgresRepository) GetVisibleByID(id, localShopID uint) (*coreDomain.IntegrationNotification, error) {
	var row coreDomain.IntegrationNotification
	err := r.visibleBaseQuery(r.db, localShopID).Where("id = ?", id).First(&row).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *localShopNotificationPostgresRepository) MarkRead(localShopID, notificationID uint) error {
	now := time.Now().UTC()
	rd := lsDomain.LocalShopNotificationRead{
		LocalShopID:    localShopID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("local_shop_id = ? AND notification_id = ?", localShopID, notificationID).
		Assign(lsDomain.LocalShopNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *localShopNotificationPostgresRepository) MarkAllRead(localShopID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO local_shop_notification_reads (local_shop_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		  AND (n.neighborhood_shop_id IS NULL OR n.neighborhood_shop_id = ?)
		ON CONFLICT (local_shop_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, localShopID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetLocalShops, localShopID).Error
}

func (r *localShopNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB, localShopID uint) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetLocalShops,
	}).Where("(neighborhood_shop_id IS NULL OR neighborhood_shop_id = ?)", localShopID)
}
