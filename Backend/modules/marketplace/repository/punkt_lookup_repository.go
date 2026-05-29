package repository

import (
	"errors"
	"strings"

	adminDomain "backend/modules/admin/domain"

	"gorm.io/gorm"
)

type PunktLookupRepository interface {
	FindActivePunktIDByDistrictID(districtID uint) (*uint, error)
}

type punktLookupPostgresRepository struct {
	db *gorm.DB
}

func NewPunktLookupRepository(db *gorm.DB) PunktLookupRepository {
	return &punktLookupPostgresRepository{db: db}
}

func (r *punktLookupPostgresRepository) FindActivePunktIDByDistrictID(districtID uint) (*uint, error) {
	if districtID == 0 {
		return nil, nil
	}
	var p adminDomain.Punkt
	err := r.db.Where("district_id = ?", districtID).Order("id ASC").First(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	if strings.ToLower(strings.TrimSpace(p.Status)) != "active" {
		return nil, nil
	}
	id := p.ID
	return &id, nil
}
