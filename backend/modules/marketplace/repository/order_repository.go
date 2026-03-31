package repository

import (
	"errors"

	adminDomain "backend/modules/admin/domain"
	contrDomain "backend/modules/contragents/domain"
	"backend/modules/marketplace/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

// ErrOrderInsufficientStock — tranzaksiya ichida zaxira yetarli emas.
var ErrOrderInsufficientStock = errors.New("mahsulot zaxirasi yetarli emas")

// Bekor qilish uchun xatoliklar (service qatlamida xarita qilinadi).
var (
	ErrCancelOrderNotFound       = errors.New("buyurtma topilmadi")
	ErrCancelOrderNotPending     = errors.New("buyurtma kutilmoqda holatida emas")
	ErrCancelRestoreProductMissing = errors.New("mahsulot qatori topilmadi, zaxirani qaytarib bo'lmadi")
)

type StockDeduction struct {
	ProductID uint
	Quantity  float64
}

type MarketplaceOrderRepository interface {
	CreateOrderWithDeductions(order *domain.Order, items []domain.OrderItem, deductions []StockDeduction) error
	CancelPendingOrderRestoreStock(userID, orderID uint) error
	GetPaginatedByUserID(userID uint, page, limit int) ([]domain.Order, int64, error)
	GetByIDAndUserIDWithItems(id, userID uint) (*domain.Order, error)
}

type marketplaceOrderPostgresRepository struct {
	db *gorm.DB
}

func NewMarketplaceOrderRepository(db *gorm.DB) MarketplaceOrderRepository {
	return &marketplaceOrderPostgresRepository{db: db}
}

func (r *marketplaceOrderPostgresRepository) CreateOrderWithDeductions(order *domain.Order, items []domain.OrderItem, deductions []StockDeduction) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(order).Error; err != nil {
			return err
		}
		for i := range items {
			items[i].OrderID = order.ID
			if err := tx.Create(&items[i]).Error; err != nil {
				return err
			}
		}
		for _, d := range deductions {
			res := tx.Model(&contrDomain.Product{}).
				Where(
					"id = ? AND quantity >= ? AND moderation_status = ? AND status = ?",
					d.ProductID,
					d.Quantity,
					contrDomain.ProductModerationApproved,
					adminDomain.StatusActive,
				).
				Update("quantity", gorm.Expr("quantity - ?", d.Quantity))
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return ErrOrderInsufficientStock
			}
		}
		return nil
	})
}

// CancelPendingOrderRestoreStock — faqat pending; boshqa statusda ErrCancelOrderNotPending.
func (r *marketplaceOrderPostgresRepository) CancelPendingOrderRestoreStock(userID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var order domain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND user_id = ?", orderID, userID).
			First(&order).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCancelOrderNotFound
		}
		if err != nil {
			return err
		}
		if order.Status != domain.OrderStatusPending {
			return ErrCancelOrderNotPending
		}

		var items []domain.OrderItem
		if err := tx.Where("order_id = ?", order.ID).Find(&items).Error; err != nil {
			return err
		}

		for i := range items {
			it := &items[i]
			res := tx.Model(&contrDomain.Product{}).Where("id = ?", it.ProductID).
				Update("quantity", gorm.Expr("quantity + ?", it.Quantity))
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return ErrCancelRestoreProductMissing
			}
		}

		order.Status = domain.OrderStatusCancelled
		return tx.Save(&order).Error
	})
}

func (r *marketplaceOrderPostgresRepository) GetPaginatedByUserID(userID uint, page, limit int) ([]domain.Order, int64, error) {
	var total int64
	if err := r.db.Model(&domain.Order{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit
	var rows []domain.Order
	err := r.db.Where("user_id = ?", userID).
		Preload("Items").
		Order("id desc").
		Offset(offset).
		Limit(limit).
		Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *marketplaceOrderPostgresRepository) GetByIDAndUserIDWithItems(id, userID uint) (*domain.Order, error) {
	var row domain.Order
	err := r.db.Where("id = ? AND user_id = ?", id, userID).Preload("Items").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}
