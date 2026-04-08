package repository

import (
	mpdomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type PartnerRequestRepository interface {
	List(page, limit int) ([]mpdomain.PartnerRequest, int64, error)
	GetByID(id uint) (*mpdomain.PartnerRequest, error)
	Update(row *mpdomain.PartnerRequest) error
}

type partnerRequestPostgresRepository struct{ db *gorm.DB }

func NewPartnerRequestRepository(db *gorm.DB) PartnerRequestRepository {
	return &partnerRequestPostgresRepository{db: db}
}

func (r *partnerRequestPostgresRepository) List(page, limit int) ([]mpdomain.PartnerRequest, int64, error) {
	var rows []mpdomain.PartnerRequest
	var total int64
	q := r.db.Model(&mpdomain.PartnerRequest{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := q.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *partnerRequestPostgresRepository) GetByID(id uint) (*mpdomain.PartnerRequest, error) {
	var row mpdomain.PartnerRequest
	if err := r.db.First(&row, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *partnerRequestPostgresRepository) Update(row *mpdomain.PartnerRequest) error {
	return r.db.Save(row).Error
}
