package repository

import (
	"errors"

	"backend/modules/marketplace/domain"
	"gorm.io/gorm"
)

type MarketplaceCartRepository interface {
	ListItemsByUserID(userID uint) ([]domain.CartItem, error)
	GetItemByIDForUser(id, userID uint) (*domain.CartItem, error)
	GetItemByUserAndProduct(userID, productID uint) (*domain.CartItem, error)
	CreateItem(item *domain.CartItem) error
	SaveItem(item *domain.CartItem) error
	UpdateItemQuantity(id, userID uint, quantity float64) error
	DeleteItem(id, userID uint) error
	DeleteAllByUser(userID uint) error
}

type marketplaceCartPostgresRepository struct {
	db *gorm.DB
}

func NewMarketplaceCartRepository(db *gorm.DB) MarketplaceCartRepository {
	return &marketplaceCartPostgresRepository{db: db}
}

func (r *marketplaceCartPostgresRepository) ListItemsByUserID(userID uint) ([]domain.CartItem, error) {
	var rows []domain.CartItem
	err := r.db.Where("user_id = ?", userID).Order("id asc").Find(&rows).Error
	return rows, err
}

func (r *marketplaceCartPostgresRepository) GetItemByIDForUser(id, userID uint) (*domain.CartItem, error) {
	var row domain.CartItem
	err := r.db.Where("id = ? AND user_id = ?", id, userID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *marketplaceCartPostgresRepository) GetItemByUserAndProduct(userID, productID uint) (*domain.CartItem, error) {
	var row domain.CartItem
	err := r.db.Where("user_id = ? AND product_id = ?", userID, productID).First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *marketplaceCartPostgresRepository) CreateItem(item *domain.CartItem) error {
	return r.db.Create(item).Error
}

func (r *marketplaceCartPostgresRepository) SaveItem(item *domain.CartItem) error {
	return r.db.Save(item).Error
}

func (r *marketplaceCartPostgresRepository) UpdateItemQuantity(id, userID uint, quantity float64) error {
	res := r.db.Model(&domain.CartItem{}).
		Where("id = ? AND user_id = ?", id, userID).
		Update("quantity", quantity)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *marketplaceCartPostgresRepository) DeleteItem(id, userID uint) error {
	res := r.db.Where("id = ? AND user_id = ?", id, userID).Delete(&domain.CartItem{})
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *marketplaceCartPostgresRepository) DeleteAllByUser(userID uint) error {
	return r.db.Where("user_id = ?", userID).Delete(&domain.CartItem{}).Error
}
