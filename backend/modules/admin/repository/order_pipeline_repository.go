package repository

import (
	mpdomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type OrderPipelineRepository interface {
	ListByStage(stage string, page, limit int) ([]mpdomain.Order, int64, error)
	CountByStage(stage string) (int64, error)
}

type orderPipelinePostgresRepository struct {
	db *gorm.DB
}

func NewOrderPipelineRepository(db *gorm.DB) OrderPipelineRepository {
	return &orderPipelinePostgresRepository{db: db}
}

func applyStage(q *gorm.DB, stage string) *gorm.DB {
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

func (r *orderPipelinePostgresRepository) ListByStage(stage string, page, limit int) ([]mpdomain.Order, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	base := applyStage(r.db.Model(&mpdomain.Order{}), stage)
	var total int64
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []mpdomain.Order
	err := applyStage(r.db, stage).Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	return rows, total, err
}

func (r *orderPipelinePostgresRepository) CountByStage(stage string) (int64, error) {
	var n int64
	err := applyStage(r.db.Model(&mpdomain.Order{}), stage).Count(&n).Error
	return n, err
}
