package repository

import (
	"errors"
	"time"

	mpdomain "backend/modules/marketplace/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrAgentOrderNotFound             = errors.New("buyurtma topilmadi")
	ErrAgentOrderNotDeliverable       = errors.New("buyurtma yetkazish uchun mos emas")
	ErrAgentOrderSettlementWrongState = errors.New("punktga to'lov e'lon qilish uchun holat mos emas")
	ErrAgentOrderSettlementIncomplete = errors.New("punkt to'lovdan keyingi yetkazish bosqichini yakunlamagan")
)

type AgentOrderRepository interface {
	ListForAgent(agentID uint, listKind string, page, limit int) ([]mpdomain.Order, int64, error)
	GetByIDForAgent(orderID, agentID uint) (*mpdomain.Order, error)
	DeclarePaymentToPunkt(orderID, agentID uint) error
	MarkDeliveredByAgent(orderID, agentID uint) error
	GetAnalytics(agentID uint, from, to *time.Time) (*AgentOrderAnalyticsRow, error)
}

type agentOrderPostgresRepository struct {
	db *gorm.DB
}

type AgentOrderAnalyticsRow struct {
	TotalOrders               int64
	TotalAmount               float64
	DeliveredOrders           int64
	DeliveredAmount           float64
	PendingOrders             int64
	PendingAmount             float64
	DeclaredToPunktAmount     float64
	ConfirmedByPunktAmount    float64
	UnconfirmedDeclaredAmount float64
}

func NewAgentOrderRepository(db *gorm.DB) AgentOrderRepository {
	return &agentOrderPostgresRepository{db: db}
}

func (r *agentOrderPostgresRepository) ListForAgent(agentID uint, listKind string, page, limit int) ([]mpdomain.Order, int64, error) {
	q := r.db.Model(&mpdomain.Order{}).Where("assigned_agent_id = ?", agentID)
	switch listKind {
	case "active":
		q = q.Where("status = ?", mpdomain.OrderStatusPending)
	case "history":
		q = q.Where("status IN ?", []string{mpdomain.OrderStatusDelivered, mpdomain.OrderStatusCancelled})
	default:
		return nil, 0, errors.New("noto'g'ri ro'yxat turi")
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit
	q2 := r.db.Where("assigned_agent_id = ?", agentID)
	switch listKind {
	case "active":
		q2 = q2.Where("status = ?", mpdomain.OrderStatusPending)
	case "history":
		q2 = q2.Where("status IN ?", []string{mpdomain.OrderStatusDelivered, mpdomain.OrderStatusCancelled})
	}
	var rows []mpdomain.Order
	err := q2.Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *agentOrderPostgresRepository) GetByIDForAgent(orderID, agentID uint) (*mpdomain.Order, error) {
	var row mpdomain.Order
	err := r.db.Where("id = ? AND assigned_agent_id = ?", orderID, agentID).
		Preload("Items").
		First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *agentOrderPostgresRepository) DeclarePaymentToPunkt(orderID, agentID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var ord mpdomain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND assigned_agent_id = ?", orderID, agentID).
			First(&ord).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAgentOrderNotFound
		}
		if err != nil {
			return err
		}
		if ord.Status != mpdomain.OrderStatusPending {
			return ErrAgentOrderSettlementWrongState
		}
		if ord.AgentDeclaredPaymentToPunktAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("agent_declared_payment_to_punkt_at", now).Error
	})
}

func (r *agentOrderPostgresRepository) MarkDeliveredByAgent(orderID, agentID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var ord mpdomain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND assigned_agent_id = ?", orderID, agentID).
			First(&ord).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrAgentOrderNotFound
		}
		if err != nil {
			return err
		}
		if ord.Status == mpdomain.OrderStatusDelivered {
			return nil
		}
		if ord.Status != mpdomain.OrderStatusPending {
			return ErrAgentOrderNotDeliverable
		}
		if ord.PunktPostPaymentDeliveredAt == nil {
			return ErrAgentOrderSettlementIncomplete
		}
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("status", mpdomain.OrderStatusDelivered).Error
	})
}

func (r *agentOrderPostgresRepository) GetAnalytics(agentID uint, from, to *time.Time) (*AgentOrderAnalyticsRow, error) {
	q := r.db.Table("marketplace_orders").Where("assigned_agent_id = ?", agentID)
	if from != nil {
		q = q.Where("created_at >= ?", *from)
	}
	if to != nil {
		q = q.Where("created_at <= ?", *to)
	}
	var out AgentOrderAnalyticsRow
	err := q.Select(`
		COUNT(*) as total_orders,
		COALESCE(SUM(total_amount), 0) as total_amount,
		COALESCE(SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END), 0) as delivered_orders,
		COALESCE(SUM(CASE WHEN status = 'delivered' THEN total_amount ELSE 0 END), 0) as delivered_amount,
		COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) as pending_orders,
		COALESCE(SUM(CASE WHEN status = 'pending' THEN total_amount ELSE 0 END), 0) as pending_amount,
		COALESCE(SUM(CASE WHEN agent_declared_payment_to_punkt_at IS NOT NULL THEN total_amount ELSE 0 END), 0) as declared_to_punkt_amount,
		COALESCE(SUM(CASE WHEN punkt_confirmed_agent_payment_at IS NOT NULL THEN total_amount ELSE 0 END), 0) as confirmed_by_punkt_amount,
		COALESCE(SUM(CASE WHEN agent_declared_payment_to_punkt_at IS NOT NULL AND punkt_confirmed_agent_payment_at IS NULL THEN total_amount ELSE 0 END), 0) as unconfirmed_declared_amount
	`).Scan(&out).Error
	if err != nil {
		return nil, err
	}
	return &out, nil
}
