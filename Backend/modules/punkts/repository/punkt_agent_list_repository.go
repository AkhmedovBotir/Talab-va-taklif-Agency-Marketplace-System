package repository

import (
	adminDomain "backend/modules/admin/domain"

	"gorm.io/gorm"
)

// PunktAgentListRepository — punkt tumanidagi agentlar (tayinlash uchun ro'yxat).
type PunktAgentListRepository interface {
	ListActiveAgentsForPunkt(punktID uint, filterMFYID uint) ([]adminDomain.Agent, error)
}

type punktAgentListPostgresRepository struct {
	db *gorm.DB
}

func NewPunktAgentListRepository(db *gorm.DB) PunktAgentListRepository {
	return &punktAgentListPostgresRepository{db: db}
}

func (r *punktAgentListPostgresRepository) ListActiveAgentsForPunkt(punktID uint, filterMFYID uint) ([]adminDomain.Agent, error) {
	var punkt adminDomain.Punkt
	if err := r.db.First(&punkt, punktID).Error; err != nil {
		return nil, err
	}
	q := r.db.Where("district_id = ? AND status = ?", punkt.DistrictID, adminDomain.StatusActive)
	if filterMFYID > 0 {
		q = q.Where("mfy_id = ?", filterMFYID)
	}
	var rows []adminDomain.Agent
	if err := q.Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}
