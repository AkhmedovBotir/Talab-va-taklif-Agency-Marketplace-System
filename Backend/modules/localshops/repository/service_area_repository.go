package repository

import (
	adminDomain "backend/modules/admin/domain"
	"backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type ServiceAreaRepository interface {
	GetLocalShopByID(id uint) (*adminDomain.NeighborhoodShop, error)
	ListAvailableMFYsByDistrict(districtID uint) ([]adminDomain.MFY, error)
	ListSelectedMFYIDs(localShopID uint) ([]uint, error)
	ReplaceSelected(localShopID uint, mfyIDs []uint) error
}

type serviceAreaPostgresRepository struct {
	db *gorm.DB
}

func NewServiceAreaRepository(db *gorm.DB) ServiceAreaRepository {
	return &serviceAreaPostgresRepository{db: db}
}

func (r *serviceAreaPostgresRepository) GetLocalShopByID(id uint) (*adminDomain.NeighborhoodShop, error) {
	var row adminDomain.NeighborhoodShop
	if err := r.db.First(&row, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *serviceAreaPostgresRepository) ListAvailableMFYsByDistrict(districtID uint) ([]adminDomain.MFY, error) {
	var rows []adminDomain.MFY
	err := r.db.Where("district_id = ? AND status = ?", districtID, adminDomain.StatusActive).Order("id asc").Find(&rows).Error
	return rows, err
}

func (r *serviceAreaPostgresRepository) ListSelectedMFYIDs(localShopID uint) ([]uint, error) {
	var rows []domain.ServiceArea
	if err := r.db.Where("local_shop_id = ?", localShopID).Order("mfy_id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make([]uint, 0, len(rows))
	for _, row := range rows {
		out = append(out, row.MFYID)
	}
	return out, nil
}

func (r *serviceAreaPostgresRepository) ReplaceSelected(localShopID uint, mfyIDs []uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("local_shop_id = ?", localShopID).Delete(&domain.ServiceArea{}).Error; err != nil {
			return err
		}
		for _, id := range mfyIDs {
			row := domain.ServiceArea{LocalShopID: localShopID, MFYID: id}
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
