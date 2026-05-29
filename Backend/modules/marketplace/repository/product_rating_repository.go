package repository

import (
	"backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type DeliveredOrderItemRow struct {
	OrderID     uint
	OrderItemID uint
	ProductID   uint
	ProductName string
}

type ProductRatingRepository interface {
	ListDeliveredOrderItemsForUser(orderID, userID uint) ([]DeliveredOrderItemRow, error)
	CommentTemplateExists(id uint) (bool, error)
	Upsert(row *domain.ProductRating) error
}

type productRatingPostgresRepository struct{ db *gorm.DB }

func NewProductRatingRepository(db *gorm.DB) ProductRatingRepository {
	return &productRatingPostgresRepository{db: db}
}

func (r *productRatingPostgresRepository) ListDeliveredOrderItemsForUser(orderID, userID uint) ([]DeliveredOrderItemRow, error) {
	var rows []DeliveredOrderItemRow
	err := r.db.Table("marketplace_order_items oi").
		Select("oi.order_id, oi.id as order_item_id, oi.product_id, oi.product_name").
		Joins("JOIN marketplace_orders o ON o.id = oi.order_id").
		Where("oi.order_id = ? AND o.user_id = ? AND o.status = ?", orderID, userID, domain.OrderStatusDelivered).
		Order("oi.id asc").
		Scan(&rows).Error
	return rows, err
}

func (r *productRatingPostgresRepository) CommentTemplateExists(id uint) (bool, error) {
	var cnt int64
	err := r.db.Table("admin_comment_templates").Where("id = ? AND status = ?", id, "active").Count(&cnt).Error
	return cnt > 0, err
}

func (r *productRatingPostgresRepository) Upsert(row *domain.ProductRating) error {
	var existing domain.ProductRating
	err := r.db.Where("user_id = ? AND order_item_id = ?", row.UserID, row.OrderItemID).First(&existing).Error
	if err == nil {
		existing.Score = row.Score
		existing.CommentTemplateID = row.CommentTemplateID
		existing.Note = row.Note
		return r.db.Save(&existing).Error
	}
	if err != nil && err != gorm.ErrRecordNotFound {
		return err
	}
	return r.db.Create(row).Error
}
