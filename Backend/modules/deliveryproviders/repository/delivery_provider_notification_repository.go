package repository

import (
	"time"

	coreDomain "backend/modules/core/domain"
	dpDomain "backend/modules/deliveryproviders/domain"
	"gorm.io/gorm"
)

type DeliveryProviderNotificationListRow struct {
	coreDomain.IntegrationNotification
	ReadAt *time.Time `json:"read_at"`
}

type DeliveryProviderNotificationRepository interface {
	List(page, limit int, deliveryProviderID uint) ([]DeliveryProviderNotificationListRow, int64, error)
	CountUnread(deliveryProviderID uint) (int64, error)
	GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error)
	MarkRead(deliveryProviderID, notificationID uint) error
	MarkAllRead(deliveryProviderID uint) error
}

type deliveryProviderNotificationPostgresRepository struct {
	db *gorm.DB
}

func NewDeliveryProviderNotificationRepository(db *gorm.DB) DeliveryProviderNotificationRepository {
	return &deliveryProviderNotificationPostgresRepository{db: db}
}

func (r *deliveryProviderNotificationPostgresRepository) List(page, limit int, deliveryProviderID uint) ([]DeliveryProviderNotificationListRow, int64, error) {
	offset := (page - 1) * limit
	var total int64
	if err := r.visibleBaseQuery(r.db.Model(&coreDomain.IntegrationNotification{})).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var rows []DeliveryProviderNotificationListRow
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Select("n.id, n.title, n.message, n.type, n.target_type, n.created_at, n.updated_at, r.read_at").
		Joins("LEFT JOIN delivery_provider_notification_reads r ON r.notification_id = n.id AND r.delivery_provider_id = ?", deliveryProviderID).
		Order("n.id DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	return rows, total, nil
}

func (r *deliveryProviderNotificationPostgresRepository) CountUnread(deliveryProviderID uint) (int64, error) {
	var n int64
	err := r.visibleBaseQuery(r.db.Table("integration_notifications AS n")).
		Joins("LEFT JOIN delivery_provider_notification_reads r ON r.notification_id = n.id AND r.delivery_provider_id = ?", deliveryProviderID).
		Where("r.id IS NULL").
		Count(&n).Error
	return n, err
}

func (r *deliveryProviderNotificationPostgresRepository) GetVisibleByID(id uint) (*coreDomain.IntegrationNotification, error) {
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

func (r *deliveryProviderNotificationPostgresRepository) MarkRead(deliveryProviderID, notificationID uint) error {
	now := time.Now().UTC()
	rd := dpDomain.DeliveryProviderNotificationRead{
		DeliveryProviderID: deliveryProviderID,
		NotificationID:     notificationID,
		ReadAt:             &now,
	}
	return r.db.
		Where("delivery_provider_id = ? AND notification_id = ?", deliveryProviderID, notificationID).
		Assign(dpDomain.DeliveryProviderNotificationRead{ReadAt: rd.ReadAt}).
		FirstOrCreate(&rd).Error
}

func (r *deliveryProviderNotificationPostgresRepository) MarkAllRead(deliveryProviderID uint) error {
	now := time.Now().UTC()
	return r.db.Exec(`
		INSERT INTO delivery_provider_notification_reads (delivery_provider_id, notification_id, read_at, created_at, updated_at)
		SELECT ?, n.id, ?, NOW(), NOW()
		FROM integration_notifications n
		WHERE n.target_type IN (?, ?)
		ON CONFLICT (delivery_provider_id, notification_id)
		DO UPDATE SET read_at = EXCLUDED.read_at, updated_at = NOW()
	`, deliveryProviderID, now, coreDomain.NotificationTargetAll, coreDomain.NotificationTargetDeliveryProviders).Error
}

func (r *deliveryProviderNotificationPostgresRepository) visibleBaseQuery(q *gorm.DB) *gorm.DB {
	return q.Where("target_type IN ?", []string{
		coreDomain.NotificationTargetAll,
		coreDomain.NotificationTargetDeliveryProviders,
	})
}
