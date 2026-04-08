package repository

import (
	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type ArchiveRepository interface {
	Create(row *domain.ArchiveLog) error
	ListByType(entityType string, page, limit int) ([]domain.ArchiveLog, int64, error)
	GetByIDAndType(id uint, entityType string) (*domain.ArchiveLog, error)
}

type archivePostgresRepository struct{ db *gorm.DB }

func NewArchiveRepository(db *gorm.DB) ArchiveRepository {
	return &archivePostgresRepository{db: db}
}

func (r *archivePostgresRepository) Create(row *domain.ArchiveLog) error {
	return r.db.Create(row).Error
}

func (r *archivePostgresRepository) ListByType(entityType string, page, limit int) ([]domain.ArchiveLog, int64, error) {
	var rows []domain.ArchiveLog
	var total int64
	q := r.db.Model(&domain.ArchiveLog{}).Where("entity_type = ?", entityType)
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := q.Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *archivePostgresRepository) GetByIDAndType(id uint, entityType string) (*domain.ArchiveLog, error) {
	var row domain.ArchiveLog
	if err := r.db.Where("id = ? AND entity_type = ?", id, entityType).First(&row).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}
