package service

import (
	"errors"
	"math"
	"regexp"
	"strings"

	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
)

var localShopOrderExtraPhoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrLocalShopOrderNoDefaultAddress   = errors.New("asosiy yetkazib berish manzili o'rnatilmagan")
	ErrLocalShopOrderInvalidAddress     = errors.New("manzil tanlovi noto'g'ri")
	ErrLocalShopOrderShopRequired       = errors.New("maxalla do'koni tanlanishi shart")
	ErrLocalShopOrderEmptyItems         = errors.New("tanlangan do'kon bo'yicha savatchada mahsulot yo'q")
	ErrLocalShopOrderProductUnavailable = errors.New("mahsulot topilmadi yoki sotuvda emas")
	ErrLocalShopOrderInvalidQuantity    = errors.New("mahsulot miqdori noto'g'ri")
	ErrLocalShopOrderExtraPhoneInvalid  = errors.New("qo'shimcha telefon formati noto'g'ri")
	ErrLocalShopOrderNotFound           = errors.New("buyurtma topilmadi")
	ErrLocalShopOrderCannotCancel       = errors.New("faqat kutilmoqdagi buyurtma bekor qilinadi")
	ErrLocalShopOrderInsufficientStock  = repository.ErrLocalShopOrderInsufficientStock
)

type LocalShopOrderAddressInput struct {
	Type           string `json:"type" binding:"required"`
	DeliveryAreaID uint   `json:"delivery_area_id"`
	Text           string `json:"text"`
}

type CreateLocalShopOrderInput struct {
	LocalShopID uint                       `json:"local_shop_id" binding:"required"`
	ExtraPhone  string                     `json:"extra_phone"`
	AddressNote string                     `json:"address_note"`
	Address     LocalShopOrderAddressInput `json:"address"`
}

type LocalShopOrderAddressOutput struct {
	Type           string `json:"type"`
	DeliveryAreaID *uint  `json:"delivery_area_id,omitempty"`
	AreaName       string `json:"area_name,omitempty"`
	RegionID       uint   `json:"region_id,omitempty"`
	DistrictID     uint   `json:"district_id,omitempty"`
	MFYID          uint   `json:"mfy_id,omitempty"`
	CustomText     string `json:"custom_text,omitempty"`
}

type LocalShopOrderItemOutput struct {
	ID                 uint    `json:"id"`
	LocalShopProductID uint    `json:"local_shop_product_id"`
	LocalShopID        uint    `json:"local_shop_id"`
	TemplateID         uint    `json:"template_id"`
	ProductName        string  `json:"product_name"`
	UnitPrice          float64 `json:"unit_price"`
	Quantity           float64 `json:"quantity"`
	Unit               string  `json:"unit"`
	LineTotal          float64 `json:"line_total"`
}

type LocalShopOrderOutput struct {
	ID          uint                        `json:"id"`
	LocalShopID uint                        `json:"local_shop_id"`
	Status      string                      `json:"status"`
	CanCancel   bool                        `json:"can_cancel"`
	TotalAmount float64                     `json:"total_amount"`
	ExtraPhone  string                      `json:"extra_phone,omitempty"`
	AddressNote string                      `json:"address_note,omitempty"`
	Address     LocalShopOrderAddressOutput `json:"address"`
	Items       []LocalShopOrderItemOutput  `json:"items"`
	CreatedAt   string                      `json:"created_at"`
	UpdatedAt   string                      `json:"updated_at"`
}

type PaginatedLocalShopOrders struct {
	Items      []LocalShopOrderOutput `json:"items"`
	Total      int64                  `json:"total"`
	Page       int                    `json:"page"`
	Limit      int                    `json:"limit"`
	TotalPages int                    `json:"total_pages"`
}

type LocalShopOrderService interface {
	Create(userID uint, input CreateLocalShopOrderInput) (*LocalShopOrderOutput, error)
	List(userID uint, page, limit int) (*PaginatedLocalShopOrders, error)
	GetByID(userID, orderID uint) (*LocalShopOrderOutput, error)
	Cancel(userID, orderID uint) (*LocalShopOrderOutput, error)
}

type localShopOrderService struct {
	orderRepo    repository.LocalShopOrderRepository
	cartRepo     repository.LocalShopCartRepository
	deliveryRepo repository.DeliveryAreaRepository
}

func NewLocalShopOrderService(orderRepo repository.LocalShopOrderRepository, cartRepo repository.LocalShopCartRepository, deliveryRepo repository.DeliveryAreaRepository) LocalShopOrderService {
	return &localShopOrderService{orderRepo: orderRepo, cartRepo: cartRepo, deliveryRepo: deliveryRepo}
}

func (s *localShopOrderService) Create(userID uint, input CreateLocalShopOrderInput) (*LocalShopOrderOutput, error) {
	if input.LocalShopID == 0 {
		return nil, ErrLocalShopOrderShopRequired
	}
	input.ExtraPhone = strings.TrimSpace(input.ExtraPhone)
	input.AddressNote = strings.TrimSpace(input.AddressNote)
	input.Address.Type = strings.TrimSpace(strings.ToLower(input.Address.Type))
	input.Address.Text = strings.TrimSpace(input.Address.Text)
	if input.ExtraPhone != "" && !localShopOrderExtraPhoneRegex.MatchString(input.ExtraPhone) {
		return nil, ErrLocalShopOrderExtraPhoneInvalid
	}

	defaultArea, err := s.deliveryRepo.GetDefaultByUserID(userID)
	if err != nil {
		return nil, err
	}
	if defaultArea == nil {
		return nil, ErrLocalShopOrderNoDefaultAddress
	}

	cartItems, err := s.cartRepo.ListItemsByUserID(userID)
	if err != nil {
		return nil, err
	}
	if len(cartItems) == 0 {
		return nil, ErrLocalShopOrderEmptyItems
	}
	pids := make([]uint, 0, len(cartItems))
	for _, ci := range cartItems {
		pids = append(pids, ci.LocalShopProductID)
	}
	products, err := s.cartRepo.GetActiveProductsByIDs(pids)
	if err != nil {
		return nil, err
	}
	pmap := map[uint]repository.LocalShopProductInfo{}
	for _, p := range products {
		pmap[p.ID] = p
	}

	selected := make([]struct {
		Line domain.LocalShopCartItem
		Prod repository.LocalShopProductInfo
	}, 0)
	for _, line := range cartItems {
		p, ok := pmap[line.LocalShopProductID]
		if !ok {
			continue
		}
		if p.LocalShopID != input.LocalShopID {
			continue
		}
		if line.Quantity <= 0 || math.IsNaN(line.Quantity) || math.IsInf(line.Quantity, 0) {
			return nil, ErrLocalShopOrderInvalidQuantity
		}
		if p.Quantity <= 0 {
			return nil, ErrLocalShopOrderProductUnavailable
		}
		if line.Quantity > p.Quantity {
			return nil, ErrLocalShopOrderInsufficientStock
		}
		selected = append(selected, struct {
			Line domain.LocalShopCartItem
			Prod repository.LocalShopProductInfo
		}{Line: line, Prod: p})
	}
	if len(selected) == 0 {
		return nil, ErrLocalShopOrderEmptyItems
	}

	orderRow := &domain.LocalShopOrder{
		UserID:      userID,
		LocalShopID: input.LocalShopID,
		Status:      domain.LocalShopOrderStatusPending,
		ExtraPhone:  input.ExtraPhone,
		AddressNote: input.AddressNote,
	}
	switch input.Address.Type {
	case domain.OrderAddressModeDefault:
		orderRow.AddressMode = domain.OrderAddressModeDefault
		id := defaultArea.ID
		orderRow.DeliveryAreaID = &id
		orderRow.SnapAreaName = defaultArea.Name
		orderRow.SnapRegionID = defaultArea.RegionID
		orderRow.SnapDistrictID = defaultArea.DistrictID
		orderRow.SnapMFYID = defaultArea.MFYID
	case domain.OrderAddressModeDeliveryArea:
		if input.Address.DeliveryAreaID == 0 {
			return nil, ErrLocalShopOrderInvalidAddress
		}
		area, err := s.deliveryRepo.GetByIDAndUserID(input.Address.DeliveryAreaID, userID)
		if err != nil {
			return nil, err
		}
		if area == nil {
			return nil, ErrLocalShopOrderInvalidAddress
		}
		orderRow.AddressMode = domain.OrderAddressModeDeliveryArea
		id := area.ID
		orderRow.DeliveryAreaID = &id
		orderRow.SnapAreaName = area.Name
		orderRow.SnapRegionID = area.RegionID
		orderRow.SnapDistrictID = area.DistrictID
		orderRow.SnapMFYID = area.MFYID
	case domain.OrderAddressModeExtra:
		if input.Address.Text == "" {
			return nil, ErrLocalShopOrderInvalidAddress
		}
		orderRow.AddressMode = domain.OrderAddressModeExtra
		orderRow.PrimaryCustomAddress = input.Address.Text
	default:
		return nil, ErrLocalShopOrderInvalidAddress
	}

	items := make([]domain.LocalShopOrderItem, 0, len(selected))
	deductions := make([]repository.LocalShopStockDeduction, 0, len(selected))
	var total float64
	for _, sline := range selected {
		p := sline.Prod
		qty := sline.Line.Quantity
		total += p.Price * qty
		items = append(items, domain.LocalShopOrderItem{
			LocalShopProductID: p.ID,
			LocalShopID:        p.LocalShopID,
			TemplateID:         p.TemplateID,
			ProductName:        p.TemplateName,
			UnitPrice:          p.Price,
			Quantity:           qty,
			Unit:               p.Unit,
			UnitOriginalPrice:  p.OriginalPrice,
		})
		deductions = append(deductions, repository.LocalShopStockDeduction{LocalShopProductID: p.ID, Quantity: qty})
	}
	orderRow.TotalAmount = total

	if err := s.orderRepo.CreateOrderWithDeductions(orderRow, items, deductions); err != nil {
		return nil, err
	}
	for _, sline := range selected {
		_ = s.cartRepo.DeleteItem(sline.Line.ID, userID)
	}

	full, err := s.orderRepo.GetByIDAndUserIDWithItems(orderRow.ID, userID)
	if err != nil {
		return nil, err
	}
	if full == nil {
		return nil, ErrLocalShopOrderNotFound
	}
	return localShopOrderToOutput(full), nil
}

func (s *localShopOrderService) List(userID uint, page, limit int) (*PaginatedLocalShopOrders, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.orderRepo.GetPaginatedByUserID(userID, page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	out := make([]LocalShopOrderOutput, 0, len(rows))
	for i := range rows {
		out = append(out, *localShopOrderToOutput(&rows[i]))
	}
	return &PaginatedLocalShopOrders{Items: out, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *localShopOrderService) GetByID(userID, orderID uint) (*LocalShopOrderOutput, error) {
	row, err := s.orderRepo.GetByIDAndUserIDWithItems(orderID, userID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopOrderNotFound
	}
	return localShopOrderToOutput(row), nil
}

func (s *localShopOrderService) Cancel(userID, orderID uint) (*LocalShopOrderOutput, error) {
	err := s.orderRepo.CancelPendingOrderRestoreStock(userID, orderID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrCancelLocalShopOrderNotFound):
			return nil, ErrLocalShopOrderNotFound
		case errors.Is(err, repository.ErrCancelLocalShopOrderNotPending):
			return nil, ErrLocalShopOrderCannotCancel
		default:
			return nil, err
		}
	}
	return s.GetByID(userID, orderID)
}

func localShopOrderToOutput(row *domain.LocalShopOrder) *LocalShopOrderOutput {
	addr := LocalShopOrderAddressOutput{Type: row.AddressMode}
	if row.DeliveryAreaID != nil {
		id := *row.DeliveryAreaID
		addr.DeliveryAreaID = &id
	}
	if row.AddressMode == domain.OrderAddressModeExtra {
		addr.CustomText = row.PrimaryCustomAddress
	} else {
		addr.AreaName = row.SnapAreaName
		addr.RegionID = row.SnapRegionID
		addr.DistrictID = row.SnapDistrictID
		addr.MFYID = row.SnapMFYID
	}
	items := make([]LocalShopOrderItemOutput, 0, len(row.Items))
	for _, it := range row.Items {
		items = append(items, LocalShopOrderItemOutput{
			ID:                 it.ID,
			LocalShopProductID: it.LocalShopProductID,
			LocalShopID:        it.LocalShopID,
			TemplateID:         it.TemplateID,
			ProductName:        it.ProductName,
			UnitPrice:          it.UnitPrice,
			Quantity:           it.Quantity,
			Unit:               it.Unit,
			LineTotal:          it.UnitPrice * it.Quantity,
		})
	}
	return &LocalShopOrderOutput{
		ID:          row.ID,
		LocalShopID: row.LocalShopID,
		Status:      row.Status,
		CanCancel:   row.Status == domain.LocalShopOrderStatusPending,
		TotalAmount: row.TotalAmount,
		ExtraPhone:  row.ExtraPhone,
		AddressNote: row.AddressNote,
		Address:     addr,
		Items:       items,
		CreatedAt:   row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:   row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
