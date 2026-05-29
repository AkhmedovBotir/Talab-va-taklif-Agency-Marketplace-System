package repository

import (
	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type CommentTemplateRepository interface {
	Create(row *domain.CommentTemplate) error
	List(page, limit int) ([]domain.CommentTemplate, int64, error)
	GetByID(id uint) (*domain.CommentTemplate, error)
	Update(row *domain.CommentTemplate) error
	Delete(id uint) error
	GetMaxSortOrder() (int, error)
}

type commentTemplatePostgresRepository struct{ db *gorm.DB }

func NewCommentTemplateRepository(db *gorm.DB) CommentTemplateRepository {
	return &commentTemplatePostgresRepository{db: db}
}

func (r *commentTemplatePostgresRepository) Create(row *domain.CommentTemplate) error {
	return r.db.Create(row).Error
}

func (r *commentTemplatePostgresRepository) List(page, limit int) ([]domain.CommentTemplate, int64, error) {
	var rows []domain.CommentTemplate
	var total int64
	q := r.db.Model(&domain.CommentTemplate{})
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	if err := q.Order("sort_order asc, id asc").Offset(offset).Limit(limit).Find(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *commentTemplatePostgresRepository) GetByID(id uint) (*domain.CommentTemplate, error) {
	var row domain.CommentTemplate
	if err := r.db.First(&row, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &row, nil
}

func (r *commentTemplatePostgresRepository) Update(row *domain.CommentTemplate) error {
	return r.db.Save(row).Error
}

func (r *commentTemplatePostgresRepository) Delete(id uint) error {
	return r.db.Delete(&domain.CommentTemplate{}, id).Error
}

func (r *commentTemplatePostgresRepository) GetMaxSortOrder() (int, error) {
	var max int
	if err := r.db.Model(&domain.CommentTemplate{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&max).Error; err != nil {
		return 0, err
	}
	return max, nil
}
