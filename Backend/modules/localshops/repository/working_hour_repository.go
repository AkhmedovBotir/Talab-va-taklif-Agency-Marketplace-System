package repository

import (
	"backend/modules/localshops/domain"
	"gorm.io/gorm"
)

type WorkingHourRepository interface {
	List(localShopID uint) ([]domain.WorkingHour, error)
	UpsertMany(localShopID uint, rows []domain.WorkingHour) error
}

type workingHourPostgresRepository struct {
	db *gorm.DB
}

func NewWorkingHourRepository(db *gorm.DB) WorkingHourRepository {
	return &workingHourPostgresRepository{db: db}
}

func (r *workingHourPostgresRepository) List(localShopID uint) ([]domain.WorkingHour, error) {
	var rows []domain.WorkingHour
	err := r.db.Where("local_shop_id = ?", localShopID).Order("weekday asc").Find(&rows).Error
	return rows, err
}

func (r *workingHourPostgresRepository) UpsertMany(localShopID uint, rows []domain.WorkingHour) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		for _, row := range rows {
			var cur domain.WorkingHour
			err := tx.Where("local_shop_id = ? AND weekday = ?", localShopID, row.Weekday).First(&cur).Error
			if err == nil {
				cur.IsOff = row.IsOff
				cur.OpenTime = row.OpenTime
				cur.CloseTime = row.CloseTime
				if err := tx.Save(&cur).Error; err != nil {
					return err
				}
				continue
			}
			if err != gorm.ErrRecordNotFound {
				return err
			}
			row.LocalShopID = localShopID
			if err := tx.Create(&row).Error; err != nil {
				return err
			}
		}
		return nil
	})
}
