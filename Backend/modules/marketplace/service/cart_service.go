package service

import (
	"errors"

	contrDomain "backend/modules/contragents/domain"
	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
	"gorm.io/gorm"
)

var (
	ErrCartProductUnavailable = errors.New("mahsulot topilmadi yoki sotuvda emas")
	ErrCartInvalidQuantity    = errors.New("miqdor noto'g'ri")
	ErrCartLineNotFound       = errors.New("korzinka qatori topilmadi")
)

type MarketplaceCartService interface {
	GetCart(userID uint) (*domain.CartOutput, error)
	AddItem(userID, productID uint, quantity float64) (*domain.CartOutput, error)
	UpdateItemQuantity(userID, lineID uint, quantity float64) (*domain.CartOutput, error)
	RemoveItem(userID, lineID uint) (*domain.CartOutput, error)
	Clear(userID uint) error
}

type marketplaceCartService struct {
	cartRepo    repository.MarketplaceCartRepository
	productRepo repository.MarketplaceProductRepository
}

func NewMarketplaceCartService(
	cartRepo repository.MarketplaceCartRepository,
	productRepo repository.MarketplaceProductRepository,
) MarketplaceCartService {
	return &marketplaceCartService{cartRepo: cartRepo, productRepo: productRepo}
}

func (s *marketplaceCartService) GetCart(userID uint) (*domain.CartOutput, error) {
	return s.buildCart(userID)
}

func (s *marketplaceCartService) buildCart(userID uint) (*domain.CartOutput, error) {
	items, err := s.cartRepo.ListItemsByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return &domain.CartOutput{Items: []domain.CartLineOutput{}, TotalLines: 0}, nil
	}

	ids := make([]uint, 0, len(items))
	for i := range items {
		ids = append(ids, items[i].ProductID)
	}
	prows, err := s.productRepo.GetApprovedProductsByIDs(ids)
	if err != nil {
		return nil, err
	}
	pmap := make(map[uint]contrDomain.Product, len(prows))
	for i := range prows {
		pmap[prows[i].ID] = prows[i]
	}

	keptItems := make([]domain.CartItem, 0, len(items))
	productOrder := make([]contrDomain.Product, 0, len(items))

	for i := range items {
		it := &items[i]
		p, ok := pmap[it.ProductID]
		if !ok || p.Quantity <= 0 {
			_ = s.cartRepo.DeleteItem(it.ID, userID)
			continue
		}
		qty := it.Quantity
		if qty > p.Quantity {
			qty = p.Quantity
			if err := s.cartRepo.UpdateItemQuantity(it.ID, userID, qty); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
			it.Quantity = qty
		}
		keptItems = append(keptItems, *it)
		productOrder = append(productOrder, p)
	}

	if len(keptItems) == 0 {
		return &domain.CartOutput{Items: []domain.CartLineOutput{}, TotalLines: 0}, nil
	}

	outs, err := ProductOutputsFromRows(s.productRepo, productOrder)
	if err != nil {
		return nil, err
	}
	lines := make([]domain.CartLineOutput, len(keptItems))
	for i := range keptItems {
		lines[i] = domain.CartLineOutput{
			ID:       keptItems[i].ID,
			Quantity: keptItems[i].Quantity,
			Product:  outs[i],
		}
	}
	return &domain.CartOutput{Items: lines, TotalLines: len(lines)}, nil
}

func (s *marketplaceCartService) AddItem(userID, productID uint, quantity float64) (*domain.CartOutput, error) {
	if quantity <= 0 {
		return nil, ErrCartInvalidQuantity
	}
	p, err := s.productRepo.GetApprovedProductByID(productID)
	if err != nil {
		return nil, err
	}
	if p == nil || p.Quantity <= 0 {
		return nil, ErrCartProductUnavailable
	}

	existing, err := s.cartRepo.GetItemByUserAndProduct(userID, productID)
	if err != nil {
		return nil, err
	}

	var newQty float64
	if existing != nil {
		newQty = existing.Quantity + quantity
	} else {
		newQty = quantity
	}
	if newQty > p.Quantity {
		newQty = p.Quantity
	}
	if newQty <= 0 {
		return nil, ErrCartInvalidQuantity
	}

	if existing != nil {
		existing.Quantity = newQty
		if err := s.cartRepo.SaveItem(existing); err != nil {
			return nil, err
		}
	} else {
		row := &domain.CartItem{UserID: userID, ProductID: productID, Quantity: newQty}
		if err := s.cartRepo.CreateItem(row); err != nil {
			return nil, err
		}
	}

	return s.buildCart(userID)
}

func (s *marketplaceCartService) UpdateItemQuantity(userID, lineID uint, quantity float64) (*domain.CartOutput, error) {
	if quantity <= 0 {
		return nil, ErrCartInvalidQuantity
	}
	line, err := s.cartRepo.GetItemByIDForUser(lineID, userID)
	if err != nil {
		return nil, err
	}
	if line == nil {
		return nil, ErrCartLineNotFound
	}
	p, err := s.productRepo.GetApprovedProductByID(line.ProductID)
	if err != nil {
		return nil, err
	}
	if p == nil || p.Quantity <= 0 {
		_ = s.cartRepo.DeleteItem(lineID, userID)
		return s.buildCart(userID)
	}
	if quantity > p.Quantity {
		return nil, ErrCartInvalidQuantity
	}
	if err := s.cartRepo.UpdateItemQuantity(lineID, userID, quantity); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartLineNotFound
		}
		return nil, err
	}
	return s.buildCart(userID)
}

func (s *marketplaceCartService) RemoveItem(userID, lineID uint) (*domain.CartOutput, error) {
	if err := s.cartRepo.DeleteItem(lineID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrCartLineNotFound
		}
		return nil, err
	}
	return s.buildCart(userID)
}

func (s *marketplaceCartService) Clear(userID uint) error {
	return s.cartRepo.DeleteAllByUser(userID)
}
