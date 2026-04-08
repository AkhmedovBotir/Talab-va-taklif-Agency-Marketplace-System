package repository

import (
	"time"

	"backend/modules/core/domain"
	"gorm.io/gorm"
)

type IntegrationKPIPayoutRepository struct {
	db *gorm.DB
}

func NewIntegrationKPIPayoutRepository(db *gorm.DB) *IntegrationKPIPayoutRepository {
	return &IntegrationKPIPayoutRepository{db: db}
}

func (r *IntegrationKPIPayoutRepository) Create(row *domain.IntegrationKPIPayout) error {
	return r.db.Create(row).Error
}

func (r *IntegrationKPIPayoutRepository) CreateWithTargets(row *domain.IntegrationKPIPayout, targetIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(row).Error; err != nil {
			return err
		}
		if len(targetIDs) == 0 {
			return nil
		}
		targets := make([]domain.IntegrationKPIPayoutTarget, 0, len(targetIDs))
		for _, id := range targetIDs {
			targets = append(targets, domain.IntegrationKPIPayoutTarget{
				IntegrationKPIPayoutID: row.ID,
				Category:               row.Category,
				TargetID:               id,
			})
		}
		return tx.Create(&targets).Error
	})
}

// SumByCategoryForReport — to‘lovlar: paid_at [start,end) YOKI period_from/period_to aynan shu hisobot sanalari.
func (r *IntegrationKPIPayoutRepository) SumByCategoryForReport(integrationKeyID uint, category string, start, end time.Time, periodFrom, periodTo string, targetID *uint) (float64, error) {
	var out struct {
		Total float64 `gorm:"column:total"`
	}
	if targetID == nil {
	err := r.db.Raw(`
		SELECT COALESCE(SUM(amount), 0) AS total
		FROM integration_kpi_payouts
		WHERE integration_api_key_id = ?
		  AND category = ?
		  AND (
		    (period_from IS NOT NULL AND period_to IS NOT NULL AND period_from = ? AND period_to = ?)
		    OR (
		      (period_from IS NULL OR period_to IS NULL)
		      AND paid_at >= ? AND paid_at < ?
		    )
		  )
	`, integrationKeyID, category, periodFrom, periodTo, start, end).Scan(&out).Error
	return out.Total, err
	}
	err := r.db.Raw(`
		SELECT COALESCE(SUM(p.amount), 0) AS total
		FROM integration_kpi_payouts p
		WHERE p.integration_api_key_id = ?
		  AND p.category = ?
		  AND (
		    (p.period_from IS NOT NULL AND p.period_to IS NOT NULL AND p.period_from = ? AND p.period_to = ?)
		    OR (
		      (p.period_from IS NULL OR p.period_to IS NULL)
		      AND p.paid_at >= ? AND p.paid_at < ?
		    )
		  )
		  AND EXISTS (
		    SELECT 1
		    FROM integration_kpi_payout_targets t
		    WHERE t.integration_k_p_i_payout_id = p.id
		      AND t.category = p.category
		      AND t.target_id = ?
		  )
	`, integrationKeyID, category, periodFrom, periodTo, start, end, *targetID).Scan(&out).Error
	return out.Total, err
}

func (r *IntegrationKPIPayoutRepository) ListForReport(integrationKeyID uint, start, end time.Time, periodFrom, periodTo string) ([]domain.IntegrationKPIPayout, error) {
	var rows []domain.IntegrationKPIPayout
	err := r.db.Where(`
		integration_api_key_id = ? AND (
			(period_from IS NOT NULL AND period_to IS NOT NULL AND period_from = ? AND period_to = ?)
			OR ((period_from IS NULL OR period_to IS NULL) AND paid_at >= ? AND paid_at < ?)
		)`, integrationKeyID, periodFrom, periodTo, start, end).
		Order("paid_at desc, id desc").
		Find(&rows).Error
	if err != nil || len(rows) == 0 {
		return rows, err
	}
	ids := make([]uint, 0, len(rows))
	for _, p := range rows {
		ids = append(ids, p.ID)
	}
	var targets []domain.IntegrationKPIPayoutTarget
	if err := r.db.Where("integration_k_p_i_payout_id IN ?", ids).Find(&targets).Error; err != nil {
		return nil, err
	}
	byID := make(map[uint][]uint)
	for _, t := range targets {
		byID[t.IntegrationKPIPayoutID] = append(byID[t.IntegrationKPIPayoutID], t.TargetID)
	}
	for i := range rows {
		rows[i].TargetIDs = byID[rows[i].ID]
	}
	return rows, nil
}

func (r *IntegrationKPIPayoutRepository) SumByTargetAndDay(integrationKeyID uint, category string, start, end time.Time, periodFrom, periodTo string, targetIDs []uint) (map[uint]map[string]float64, error) {
	out := make(map[uint]map[string]float64)
	if len(targetIDs) == 0 {
		return out, nil
	}
	var rows []struct {
		TargetID uint    `gorm:"column:target_id"`
		Day      string  `gorm:"column:day"`
		Amount   float64 `gorm:"column:amount"`
	}
	err := r.db.Raw(`
		SELECT t.target_id AS target_id,
		       TO_CHAR(p.paid_at::date, 'YYYY-MM-DD') AS day,
		       COALESCE(SUM(p.amount),0) AS amount
		FROM integration_kpi_payouts p
		JOIN integration_kpi_payout_targets t ON t.integration_k_p_i_payout_id = p.id
		WHERE p.integration_api_key_id = ?
		  AND p.category = ?
		  AND t.category = p.category
		  AND t.target_id IN ?
		  AND (
		    (p.period_from IS NOT NULL AND p.period_to IS NOT NULL AND p.period_from = ? AND p.period_to = ?)
		    OR (
		      (p.period_from IS NULL OR p.period_to IS NULL)
		      AND p.paid_at >= ? AND p.paid_at < ?
		    )
		  )
		GROUP BY t.target_id, p.paid_at::date
	`, integrationKeyID, category, targetIDs, periodFrom, periodTo, start, end).Scan(&rows).Error
	if err != nil {
		return nil, err
	}
	for _, rr := range rows {
		if out[rr.TargetID] == nil {
			out[rr.TargetID] = map[string]float64{}
		}
		out[rr.TargetID][rr.Day] = rr.Amount
	}
	return out, nil
}
