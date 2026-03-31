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
}

type agentOrderPostgresRepository struct {
	db *gorm.DB
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
