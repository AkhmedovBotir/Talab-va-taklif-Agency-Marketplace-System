package repository

import (
	"errors"

	"backend/modules/localshops/domain"
	mpDomain "backend/modules/marketplace/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrLocalShopOrderInsufficientStock   = errors.New("mahsulot zaxirasi yetarli emas")
	ErrCancelLocalShopOrderNotFound      = errors.New("buyurtma topilmadi")
	ErrCancelLocalShopOrderNotPending    = errors.New("buyurtma kutilmoqda holatida emas")
	ErrCancelLocalShopOrderProductMissing = errors.New("mahsulot qatori topilmadi, zaxirani qaytarib bo'lmadi")
)

type LocalShopStockDeduction struct {
	LocalShopProductID uint
	Quantity           float64
}

type LocalShopOrderRepository interface {
	CreateOrderWithDeductions(order *mpDomain.LocalShopOrder, items []mpDomain.LocalShopOrderItem, deductions []LocalShopStockDeduction) error
	CancelPendingOrderRestoreStock(userID, orderID uint) error
	GetPaginatedByUserID(userID uint, page, limit int) ([]mpDomain.LocalShopOrder, int64, error)
	GetByIDAndUserIDWithItems(id, userID uint) (*mpDomain.LocalShopOrder, error)
}

type localShopOrderPostgresRepository struct {
	db *gorm.DB
}

func NewLocalShopOrderRepository(db *gorm.DB) LocalShopOrderRepository {
	return &localShopOrderPostgresRepository{db: db}
}

func (r *localShopOrderPostgresRepository) CreateOrderWithDeductions(order *mpDomain.LocalShopOrder, items []mpDomain.LocalShopOrderItem, deductions []LocalShopStockDeduction) error {
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
			res := tx.Model(&domain.Product{}).
				Where("id = ? AND quantity >= ?", d.LocalShopProductID, d.Quantity).
				Update("quantity", gorm.Expr("quantity - ?", d.Quantity))
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return ErrLocalShopOrderInsufficientStock
			}
		}
		return nil
	})
}

func (r *localShopOrderPostgresRepository) CancelPendingOrderRestoreStock(userID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var order mpDomain.LocalShopOrder
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND user_id = ?", orderID, userID).
			First(&order).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrCancelLocalShopOrderNotFound
		}
		if err != nil {
			return err
		}
		if order.Status != mpDomain.LocalShopOrderStatusPending {
			return ErrCancelLocalShopOrderNotPending
		}

		var items []mpDomain.LocalShopOrderItem
		if err := tx.Where("order_id = ?", order.ID).Find(&items).Error; err != nil {
			return err
		}
		for i := range items {
			it := &items[i]
			res := tx.Model(&domain.Product{}).Where("id = ?", it.LocalShopProductID).
				Update("quantity", gorm.Expr("quantity + ?", it.Quantity))
			if res.Error != nil {
				return res.Error
			}
			if res.RowsAffected == 0 {
				return ErrCancelLocalShopOrderProductMissing
			}
		}
		order.Status = mpDomain.LocalShopOrderStatusCancelled
		return tx.Save(&order).Error
	})
}

func (r *localShopOrderPostgresRepository) GetPaginatedByUserID(userID uint, page, limit int) ([]mpDomain.LocalShopOrder, int64, error) {
	var total int64
	if err := r.db.Model(&mpDomain.LocalShopOrder{}).Where("user_id = ?", userID).Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []mpDomain.LocalShopOrder
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

func (r *localShopOrderPostgresRepository) GetByIDAndUserIDWithItems(id, userID uint) (*mpDomain.LocalShopOrder, error) {
	var row mpDomain.LocalShopOrder
	err := r.db.Where("id = ? AND user_id = ?", id, userID).Preload("Items").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}
