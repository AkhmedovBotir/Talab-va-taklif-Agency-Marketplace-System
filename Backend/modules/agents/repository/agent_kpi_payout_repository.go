package repository

import (
	"time"

	"backend/modules/agents/domain"
	"gorm.io/gorm"
)

type AgentKPIPayoutRepository struct {
	db *gorm.DB
}

func NewAgentKPIPayoutRepository(db *gorm.DB) *AgentKPIPayoutRepository {
	return &AgentKPIPayoutRepository{db: db}
}

func (r *AgentKPIPayoutRepository) SumBetween(agentID uint, start, end time.Time) (sum float64, count int64, err error) {
	err = r.db.Model(&domain.AgentKPIPayout{}).
		Where("agent_id = ? AND paid_at >= ? AND paid_at < ?", agentID, start, end).
		Select("COALESCE(SUM(amount),0)").Scan(&sum).Error
	if err != nil {
		return 0, 0, err
	}
	err = r.db.Model(&domain.AgentKPIPayout{}).
		Where("agent_id = ? AND paid_at >= ? AND paid_at < ?", agentID, start, end).
		Count(&count).Error
	return sum, count, err
}

func (r *AgentKPIPayoutRepository) ListBetween(agentID uint, start, end time.Time) ([]domain.AgentKPIPayout, error) {
	var rows []domain.AgentKPIPayout
	err := r.db.Where("agent_id = ? AND paid_at >= ? AND paid_at < ?", agentID, start, end).
		Order("paid_at asc").
		Find(&rows).Error
	return rows, err
}

func (r *AgentKPIPayoutRepository) Create(agentID uint, amount float64, paidAt time.Time, note string) error {
	row := &domain.AgentKPIPayout{
		AgentID: agentID,
		Amount:  amount,
		PaidAt:  paidAt,
		Note:    note,
	}
	return r.db.Create(row).Error
}
