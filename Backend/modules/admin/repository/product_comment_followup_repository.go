package repository

import (
	"errors"
	"time"

	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

type ProductCommentListFilter struct {
	Page       int
	Limit      int
	Status     *string
	Escalated  *bool
	RegionID   *uint
	ProductID  *uint
	Contragent *uint
}

type ProductCommentRow struct {
	RatingID         uint       `json:"rating_id"`
	Score            int        `json:"score"`
	RatingNote       string     `json:"rating_note,omitempty"`
	CommentTemplate  string     `json:"comment_template,omitempty"`
	UserID           uint       `json:"user_id"`
	UserPhone        string     `json:"user_phone"`
	UserFirstName    string     `json:"user_first_name"`
	UserLastName     string     `json:"user_last_name"`
	UserRegionID     uint       `json:"user_region_id"`
	ProductID        uint       `json:"product_id"`
	ProductName      string     `json:"product_name"`
	ContragentID     uint       `json:"contragent_id"`
	ContragentName   string     `json:"contragent_name"`
	CaseStatus       string     `json:"case_status"`
	EscalatedToAdmin bool       `json:"escalated_to_admin"`
	LastContactAt    *time.Time `json:"last_contact_at,omitempty"`
	ResolvedAt       *time.Time `json:"resolved_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
}

type ProductCommentFollowupRepository interface {
	List(filter ProductCommentListFilter) ([]ProductCommentRow, int64, error)
	GetByRatingID(ratingID uint, regionID *uint) (*ProductCommentRow, error)
	GetCaseByRatingID(ratingID uint) (*domain.ProductCommentCase, error)
	CreateCase(row *domain.ProductCommentCase) error
	UpdateCase(row *domain.ProductCommentCase) error
	CreateActivity(row *domain.ProductCommentActivity) error
	ListActivities(caseID uint) ([]domain.ProductCommentActivity, error)
}

type productCommentFollowupPostgresRepository struct {
	db *gorm.DB
}

func NewProductCommentFollowupRepository(db *gorm.DB) ProductCommentFollowupRepository {
	return &productCommentFollowupPostgresRepository{db: db}
}

func (r *productCommentFollowupPostgresRepository) baseRowsQuery() *gorm.DB {
	return r.db.Table("marketplace_product_ratings r").
		Select(`
			r.id as rating_id,
			r.score,
			r.note as rating_note,
			COALESCE(ct.comment, '') as comment_template,
			u.id as user_id,
			u.phone as user_phone,
			u.first_name as user_first_name,
			u.last_name as user_last_name,
			u.region_id as user_region_id,
			p.id as product_id,
			p.name as product_name,
			c.id as contragent_id,
			c.name as contragent_name,
			COALESCE(pc.status, 'open') as case_status,
			COALESCE(pc.escalated_to_admin, false) as escalated_to_admin,
			pc.last_contact_at as last_contact_at,
			pc.resolved_at as resolved_at,
			r.created_at as created_at
		`).
		Joins("JOIN marketplace_users u ON u.id = r.user_id").
		Joins("JOIN products p ON p.id = r.product_id").
		Joins("JOIN contragents c ON c.id = p.contragent_id").
		Joins("LEFT JOIN admin_comment_templates ct ON ct.id = r.comment_template_id").
		Joins("LEFT JOIN admin_product_comment_cases pc ON pc.rating_id = r.id")
}

func (r *productCommentFollowupPostgresRepository) List(filter ProductCommentListFilter) ([]ProductCommentRow, int64, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}
	if filter.Limit > 100 {
		filter.Limit = 100
	}

	base := r.baseRowsQuery()
	if filter.RegionID != nil {
		base = base.Where("u.region_id = ?", *filter.RegionID)
	}
	if filter.Status != nil {
		base = base.Where("COALESCE(pc.status, ?) = ?", domain.ProductCommentCaseStatusOpen, *filter.Status)
	}
	if filter.Escalated != nil {
		base = base.Where("COALESCE(pc.escalated_to_admin, false) = ?", *filter.Escalated)
	}
	if filter.ProductID != nil {
		base = base.Where("p.id = ?", *filter.ProductID)
	}
	if filter.Contragent != nil {
		base = base.Where("c.id = ?", *filter.Contragent)
	}

	var total int64
	if err := r.db.Table("(?) as q", base).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	rows := make([]ProductCommentRow, 0)
	offset := (filter.Page - 1) * filter.Limit
	if err := base.Order("r.id desc").Offset(offset).Limit(filter.Limit).Scan(&rows).Error; err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *productCommentFollowupPostgresRepository) GetByRatingID(ratingID uint, regionID *uint) (*ProductCommentRow, error) {
	q := r.baseRowsQuery().Where("r.id = ?", ratingID)
	if regionID != nil {
		q = q.Where("u.region_id = ?", *regionID)
	}
	var row ProductCommentRow
	if err := q.Scan(&row).Error; err != nil {
		return nil, err
	}
	if row.RatingID == 0 {
		return nil, nil
	}
	return &row, nil
}

func (r *productCommentFollowupPostgresRepository) GetCaseByRatingID(ratingID uint) (*domain.ProductCommentCase, error) {
	var row domain.ProductCommentCase
	err := r.db.Where("rating_id = ?", ratingID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *productCommentFollowupPostgresRepository) CreateCase(row *domain.ProductCommentCase) error {
	return r.db.Create(row).Error
}

func (r *productCommentFollowupPostgresRepository) UpdateCase(row *domain.ProductCommentCase) error {
	return r.db.Save(row).Error
}

func (r *productCommentFollowupPostgresRepository) CreateActivity(row *domain.ProductCommentActivity) error {
	return r.db.Create(row).Error
}

func (r *productCommentFollowupPostgresRepository) ListActivities(caseID uint) ([]domain.ProductCommentActivity, error) {
	var rows []domain.ProductCommentActivity
	if err := r.db.Where("case_id = ?", caseID).Order("id asc").Find(&rows).Error; err != nil {
		return nil, err
	}
	return rows, nil
}

