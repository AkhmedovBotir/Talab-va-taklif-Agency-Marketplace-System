package repository

import (
	"time"

	"backend/modules/punkts/domain"
	"gorm.io/gorm"
)

type PunktKPIPayoutRepository struct {
	db *gorm.DB
}

func NewPunktKPIPayoutRepository(db *gorm.DB) *PunktKPIPayoutRepository {
	return &PunktKPIPayoutRepository{db: db}
}

// SumBetween — [start, end) oralig‘idagi to‘lovlar yig‘indisi va yozuvlar soni.
func (r *PunktKPIPayoutRepository) SumBetween(punktID uint, start, end time.Time) (sum float64, count int64, err error) {
	err = r.db.Model(&domain.PunktKPIPayout{}).
		Where("punkt_id = ? AND paid_at >= ? AND paid_at < ?", punktID, start, end).
		Select("COALESCE(SUM(amount),0)").Scan(&sum).Error
	if err != nil {
		return 0, 0, err
	}
	err = r.db.Model(&domain.PunktKPIPayout{}).
		Where("punkt_id = ? AND paid_at >= ? AND paid_at < ?", punktID, start, end).
		Count(&count).Error
	return sum, count, err
}

// ListBetween — tarix guruhlash uchun.
func (r *PunktKPIPayoutRepository) ListBetween(punktID uint, start, end time.Time) ([]domain.PunktKPIPayout, error) {
	var rows []domain.PunktKPIPayout
	err := r.db.Where("punkt_id = ? AND paid_at >= ? AND paid_at < ?", punktID, start, end).
		Order("paid_at asc").
		Find(&rows).Error
	return rows, err
}

func (r *PunktKPIPayoutRepository) Create(punktID uint, amount float64, paidAt time.Time, note string) error {
	row := &domain.PunktKPIPayout{
		PunktID: punktID,
		Amount:  amount,
		PaidAt:  paidAt,
		Note:    note,
	}
	return r.db.Create(row).Error
}
