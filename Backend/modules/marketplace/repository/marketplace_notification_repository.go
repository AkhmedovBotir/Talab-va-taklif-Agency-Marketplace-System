package repository

import (
	"time"

	mpDomain "backend/modules/marketplace/domain"
	coreDomain "backend/modules/core/domain"
	"gorm.io/gorm"
)

type MarketplaceNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type MarketplaceNotificationRepository interface {
	List(page, limit int, userID uint) ([]MarketplaceNotificationListRow, int64, error)
	CountUnread(userID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(userID, notificationID uint) error
	MarkAllRead(userID uint) error
}

type marketplaceNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewMarketplaceNotificationRepository(db *gorm.DB) MarketplaceNotificationRepository {
	return &marketplaceNotificationPostgresRepository{db: db}
}

func (r *marketplaceNotificationPostgresRepository) List(page, limit int, userID uint) ([]MarketplaceNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []MarketplaceNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN marketplace_notification_reads r ON r.notification_id = n.id AND r.user_id = ?", userID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *marketplaceNotificationPostgresRepository) CountUnread(userID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN marketplace_notification_reads r ON r.notification_id = n.id AND r.user_id = ?", userID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *marketplaceNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *marketplaceNotificationPostgresRepository) MarkRead(userID, notificationID uint) error {
	now := time.Now().UTC()
	rd := mpDomain.MarketplaceNotificationRead{
		UserID:         userID,
		NotificationID: notificationID,
		ReadAt:         &now,
	}
	return r.db.
		Where("user_id = ? AND notification_id = ?", userID, notificationID).
		Assign(mpDomain.MarketplaceNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *marketplaceNotificationPostgresRepository) MarkAllRead(userID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO marketplace_notification_reads (user_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (user_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, userID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetMarketplace).Error
}

func (r *marketplaceNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetMarketplace,
	})
}
