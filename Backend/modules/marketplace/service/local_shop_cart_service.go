package service

import (
	"errors"

	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
	"gorm.io/gorm"
)

var (
	ErrLocalShopCartProductUnavailable = errors.New("maxalla mahsuloti topilmadi yoki sotuvda emas")
	ErrLocalShopCartInvalidQuantity    = errors.New("miqdor noto'g'ri")
	ErrLocalShopCartLineNotFound       = errors.New("savatcha qatori topilmadi")
)

type LocalShopCartService interface {
	GetCart(userID uint) (*domain.LocalShopCartOutput, error)
	AddItem(userID, localShopProductID uint, quantity float64) (*domain.LocalShopCartOutput, error)
	UpdateItemQuantity(userID, lineID uint, quantity float64) (*domain.LocalShopCartOutput, error)
	RemoveItem(userID, lineID uint) (*domain.LocalShopCartOutput, error)
	Clear(userID uint) error
}

type localShopCartService struct {
	repo repository.LocalShopCartRepository
}

func NewLocalShopCartService(repo repository.LocalShopCartRepository) LocalShopCartService {
	return &localShopCartService{repo: repo}
}

func (s *localShopCartService) GetCart(userID uint) (*domain.LocalShopCartOutput, error) {
	return s.buildCart(userID)
}

func (s *localShopCartService) AddItem(userID, localShopProductID uint, quantity float64) (*domain.LocalShopCartOutput, error) {
	if quantity <= 0 {
		return nil, ErrLocalShopCartInvalidQuantity
	}
	p, err := s.repo.GetActiveProductByID(localShopProductID)
	if err != nil {
		return nil, err
	}
	if p == nil || p.Quantity <= 0 {
		return nil, ErrLocalShopCartProductUnavailable
	}
	existing, err := s.repo.GetItemByUserAndProduct(userID, localShopProductID)
	if err != nil {
		return nil, err
	}
	newQty := quantity
	if existing != nil {
		newQty = existing.Quantity + quantity
	}
	if newQty > p.Quantity {
		newQty = p.Quantity
	}
	if existing != nil {
		existing.Quantity = newQty
		if err := s.repo.SaveItem(existing); err != nil {
			return nil, err
		}
	} else {
		if err := s.repo.CreateItem(&domain.LocalShopCartItem{
			UserID:             userID,
			LocalShopProductID: localShopProductID,
			Quantity:           newQty,
		}); err != nil {
			return nil, err
		}
	}
	return s.buildCart(userID)
}

func (s *localShopCartService) UpdateItemQuantity(userID, lineID uint, quantity float64) (*domain.LocalShopCartOutput, error) {
	if quantity <= 0 {
		return nil, ErrLocalShopCartInvalidQuantity
	}
	line, err := s.repo.GetItemByIDForUser(lineID, userID)
	if err != nil {
		return nil, err
	}
	if line == nil {
		return nil, ErrLocalShopCartLineNotFound
	}
	p, err := s.repo.GetActiveProductByID(line.LocalShopProductID)
	if err != nil {
		return nil, err
	}
	if p == nil || p.Quantity <= 0 {
		_ = s.repo.DeleteItem(lineID, userID)
		return s.buildCart(userID)
	}
	if quantity > p.Quantity {
		return nil, ErrLocalShopCartInvalidQuantity
	}
	if err := s.repo.UpdateItemQuantity(lineID, userID, quantity); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLocalShopCartLineNotFound
		}
		return nil, err
	}
	return s.buildCart(userID)
}

func (s *localShopCartService) RemoveItem(userID, lineID uint) (*domain.LocalShopCartOutput, error) {
	if err := s.repo.DeleteItem(lineID, userID); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrLocalShopCartLineNotFound
		}
		return nil, err
	}
	return s.buildCart(userID)
}

func (s *localShopCartService) Clear(userID uint) error {
	return s.repo.DeleteAllByUser(userID)
}

func (s *localShopCartService) buildCart(userID uint) (*domain.LocalShopCartOutput, error) {
	items, err := s.repo.ListItemsByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(items) == 0 {
		return &domain.LocalShopCartOutput{Items: []domain.LocalShopCartLineOutput{}, TotalLines: 0}, nil
	}

	productIDs := make([]uint, 0, len(items))
	for _, it := range items {
		productIDs = append(productIDs, it.LocalShopProductID)
	}
	prows, err := s.repo.GetActiveProductsByIDs(productIDs)
	if err != nil {
		return nil, err
	}
	pmap := make(map[uint]repository.LocalShopProductInfo, len(prows))
	shopSeen := map[uint]struct{}{}
	shops := make([]uint, 0)
	templateSeen := map[uint]struct{}{}
	templates := make([]uint, 0)
	for _, row := range prows {
		pmap[row.ID] = row
		if _, ok := shopSeen[row.LocalShopID]; !ok {
			shopSeen[row.LocalShopID] = struct{}{}
			shops = append(shops, row.LocalShopID)
		}
		if _, ok := templateSeen[row.TemplateID]; !ok {
			templateSeen[row.TemplateID] = struct{}{}
			templates = append(templates, row.TemplateID)
		}
	}

	imageMap, err := s.repo.GetTemplateImages(templates)
	if err != nil {
		return nil, err
	}
	areas, err := s.repo.GetDeliveryAreas(shops)
	if err != nil {
		return nil, err
	}
	areaMap := map[uint][]domain.LocalShopDeliveryAreaOutput{}
	for _, a := range areas {
		areaMap[a.LocalShopID] = append(areaMap[a.LocalShopID], domain.LocalShopDeliveryAreaOutput{
			MFYID:   a.MFYID,
			MFYName: a.MFYName,
		})
	}

	lines := make([]domain.LocalShopCartLineOutput, 0, len(items))
	for _, it := range items {
		p, ok := pmap[it.LocalShopProductID]
		if !ok || p.Quantity <= 0 {
			_ = s.repo.DeleteItem(it.ID, userID)
			continue
		}
		qty := it.Quantity
		if qty > p.Quantity {
			qty = p.Quantity
			if err := s.repo.UpdateItemQuantity(it.ID, userID, qty); err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, err
			}
		}
		lines = append(lines, domain.LocalShopCartLineOutput{
			ID:       it.ID,
			Quantity: qty,
			Product: domain.LocalShopProductCartOutput{
				ID:            p.ID,
				LocalShopID:   p.LocalShopID,
				TemplateID:    p.TemplateID,
				Quantity:      p.Quantity,
				Price:         p.Price,
				OriginalPrice: p.OriginalPrice,
				Template: domain.LocalShopTemplateOutput{
					ID:            p.TemplateID,
					Name:          p.TemplateName,
					Description:   p.Description,
					CategoryID:    p.CategoryID,
					SubcategoryID: p.SubcategoryID,
					Unit:          p.Unit,
					UnitSize:      p.UnitSize,
					Images:        imageMap[p.TemplateID],
				},
				Shop: domain.LocalShopMiniOutput{
					ID:         p.LocalShopID,
					Name:       p.ShopName,
					RegionID:   p.RegionID,
					DistrictID: p.DistrictID,
					MFYID:      p.MFYID,
					Phone:      p.Phone,
				},
				DeliveryAreas: areaMap[p.LocalShopID],
			},
		})
	}

	return &domain.LocalShopCartOutput{Items: lines, TotalLines: len(lines)}, nil
}
