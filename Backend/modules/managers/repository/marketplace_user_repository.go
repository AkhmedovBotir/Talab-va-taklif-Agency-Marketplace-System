package repository

import (
	"errors"
	"strings"

	mpDomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type ManagerMarketplaceUserFilter struct {
	Status     *string
	DistrictID *uint
	MFYID      *uint
	Phone      *string
	Query      *string
}

type ManagerMarketplaceUserRepository interface {
	GetPaginatedByRegion(regionID uint, page, limit int, filter ManagerMarketplaceUserFilter) ([]mpDomain.User, int64, error)
	GetByIDInRegion(id, regionID uint) (*mpDomain.User, error)
}

type managerMarketplaceUserPostgresRepository struct {
	db *gorm.DB
}

func NewManagerMarketplaceUserRepository(db *gorm.DB) ManagerMarketplaceUserRepository {
	return &managerMarketplaceUserPostgresRepository{db: db}
}

func (r *managerMarketplaceUserPostgresRepository) GetPaginatedByRegion(regionID uint, page, limit int, filter ManagerMarketplaceUserFilter) ([]mpDomain.User, int64, error) {
	var rows []mpDomain.User
	var total int64

	q := r.db.Model(&mpDomain.User{}).
		Where("status <> ?", "deleted").
		Where("region_id = ?", regionID)

	if filter.Status != nil {
		q = q.Where("status = ?", *filter.Status)
	}
	if filter.DistrictID != nil {
		q = q.Where("district_id = ?", *filter.DistrictID)
	}
	if filter.MFYID != nil {
		q = q.Where("mfy_id = ?", *filter.MFYID)
	}
	if filter.Phone != nil && strings.TrimSpace(*filter.Phone) != "" {
		q = q.Where("phone = ?", strings.TrimSpace(*filter.Phone))
	}
	if filter.Query != nil && strings.TrimSpace(*filter.Query) != "" {
		raw := "%" + strings.TrimSpace(*filter.Query) + "%"
		q = q.Where("first_name ILIKE ? OR last_name ILIKE ?", raw, raw)
	}

	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	offset := (page - 1) * limit
	if err := q.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *managerMarketplaceUserPostgresRepository) GetByIDInRegion(id, regionID uint) (*mpDomain.User, error) {
	var row mpDomain.User
	err := r.db.Where("id = ? AND region_id = ? AND status <> ?", id, regionID, "deleted").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

