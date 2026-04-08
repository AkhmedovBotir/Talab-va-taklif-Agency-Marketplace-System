package repository

import (
	mpdomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type ManagerOrderPipelineRepository interface {
	ListByStage(regionID uint, stage string, page, limit int) ([]mpdomain.Order, int64, error)
	CountByStage(regionID uint, stage string) (int64, error)
}

type managerOrderPipelinePostgresRepository struct {
	db *gorm.DB
}

func NewManagerOrderPipelineRepository(db *gorm.DB) ManagerOrderPipelineRepository {
	return &managerOrderPipelinePostgresRepository{db: db}
}

func applyManagerOrderStage(q *gorm.DB, stage string) *gorm.DB {
	switch stage {
	case "marketplace_created":
		return q.Where("status = ?", mpdomain.OrderStatusPending)
	case "punkt_inbox":
		return q.Where("status = ? AND punkt_acceptance_status = ?", mpdomain.OrderStatusPending, mpdomain.OrderPunktStatusInbox)
	case "contragent_requests_created":
		return q.Where("status = ? AND punkt_acceptance_status = ?", mpdomain.OrderStatusPending, mpdomain.OrderPunktStatusContragentRequestsCreated)
	case "punkt_collected_pending":
		return q.Where("status = ? AND punkt_acceptance_status = ? AND punkt_collected_at IS NULL", mpdomain.OrderStatusPending, mpdomain.OrderPunktStatusContragentRequestsCreated)
	case "punkt_ready_pending":
		return q.Where("status = ? AND punkt_collected_at IS NOT NULL AND punkt_ready_at IS NULL", mpdomain.OrderStatusPending)
	case "agent_assign_pending":
		return q.Where("status = ? AND punkt_ready_at IS NOT NULL AND assigned_agent_id IS NULL", mpdomain.OrderStatusPending)
	case "agent_payment_pending":
		return q.Where("status = ? AND assigned_agent_id IS NOT NULL AND agent_declared_payment_to_punkt_at IS NULL", mpdomain.OrderStatusPending)
	case "payment_confirm_pending":
		return q.Where("status = ? AND agent_declared_payment_to_punkt_at IS NOT NULL AND punkt_confirmed_agent_payment_at IS NULL", mpdomain.OrderStatusPending)
	case "post_payment_delivery_pending":
		return q.Where("status = ? AND punkt_confirmed_agent_payment_at IS NOT NULL AND punkt_post_payment_delivered_at IS NULL", mpdomain.OrderStatusPending)
	case "remainder_handover_pending":
		return q.Where("status = ? AND punkt_post_payment_delivered_at IS NOT NULL AND punkt_contragent_remainder_handed_over_at IS NULL", mpdomain.OrderStatusPending)
	case "ready_for_agent_deliver":
		return q.Where("status = ? AND punkt_post_payment_delivered_at IS NOT NULL", mpdomain.OrderStatusPending)
	case "delivered":
		return q.Where("status = ?", mpdomain.OrderStatusDelivered)
	default:
		return q
	}
}

func managerRegionOrders(q *gorm.DB, regionID uint) *gorm.DB {
	return q.Where(
		"user_id IN (SELECT id FROM marketplace_users WHERE region_id = ? AND status <> ?)",
		regionID,
		"deleted",
	)
}

func (r *managerOrderPipelinePostgresRepository) ListByStage(regionID uint, stage string, page, limit int) ([]mpdomain.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	base := applyManagerOrderStage(managerRegionOrders(r.db.Model(&mpdomain.Order{}), regionID), stage)
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	var rows []mpdomain.Order
	err := applyManagerOrderStage(managerRegionOrders(r.db, regionID), stage).
		Preload("Items").
		Order("id desc").
		Offset(offset).
		Limit(limit).
		Find(&rows).Error
	return rows, total, err
}

func (r *managerOrderPipelinePostgresRepository) CountByStage(regionID uint, stage string) (int64, error) {
	var n int64
	err := applyManagerOrderStage(managerRegionOrders(r.db.Model(&mpdomain.Order{}), regionID), stage).Count(&n).Error
	return n, err
}

