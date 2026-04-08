package repository

import (
	"backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type PartnerRequestRepository interface {
	Create(row *domain.PartnerRequest) error
	PhoneExistsInSystem(phone string) (bool, error)
	ListByMarketplaceUser(userID uint, page, limit int) ([]domain.PartnerRequest, int64, error)
}

type partnerRequestPostgresRepository struct{ db *gorm.DB }

func NewPartnerRequestRepository(db *gorm.DB) PartnerRequestRepository {
	return &partnerRequestPostgresRepository{db: db}
}

func (r *partnerRequestPostgresRepository) Create(row *domain.PartnerRequest) error {
	return r.db.Create(row).Error
}

func (r *partnerRequestPostgresRepository) PhoneExistsInSystem(phone string) (bool, error) {
	var cnt int64
	err := r.db.Raw(`
		SELECT
			COALESCE((SELECT COUNT(1) FROM contragents WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM neighborhood_shops WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM agents WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM punkts WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM managers WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM admins WHERE phone = ?), 0) +
			COALESCE((SELECT COUNT(1) FROM marketplace_users WHERE phone = ?), 0) AS total
	`, phone, phone, phone, phone, phone, phone, phone).Scan(&cnt).Error
	if err != nil {
		return false, err
	}
	return cnt > 0, nil
}

func (r *partnerRequestPostgresRepository) ListByMarketplaceUser(userID uint, page, limit int) ([]domain.PartnerRequest, int64, error) {
	var rows []domain.PartnerRequest
	var total int64
	q := r.db.Model(&domain.PartnerRequest{}).Where("marketplace_user_id = ?", userID)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := q.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}
