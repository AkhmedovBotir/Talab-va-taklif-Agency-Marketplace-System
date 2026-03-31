package service

import (
	"errors"
	"math"
	"regexp"
	"strings"
	"time"

	contrDomain "backend/modules/contragents/domain"
	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
)

var orderExtraPhoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrOrderNoDefaultAddress      = errors.New("asosiy yetkazib berish manzili o'rnatilmagan")
	ErrOrderInvalidAddress        = errors.New("manzil tanlovi noto'g'ri")
	ErrOrderEmptyItems            = errors.New("kamida bitta mahsulot kerak")
	ErrOrderProductUnavailable    = errors.New("mahsulot topilmadi yoki sotuvda emas")
	ErrOrderNotFound              = errors.New("buyurtma topilmadi")
	ErrOrderInvalidQuantity       = errors.New("mahsulot miqdori noto'g'ri")
	ErrOrderExtraPhoneInvalid     = errors.New("qo'shimcha telefon formati noto'g'ri")
	ErrOrderInsufficientStock     = repository.ErrOrderInsufficientStock
	ErrOrderCannotCancel          = errors.New("faqat kutilmoqdagi buyurtma bekor qilinadi")
	ErrOrderRestoreProductMissing = errors.New("zaxirani qaytarishda xatolik: mahsulot topilmadi")
)

type OrderAddressInput struct {
	Type           string `json:"type" binding:"required"`
	DeliveryAreaID uint   `json:"delivery_area_id"`
	Text           string `json:"text"`
}

type OrderLineInput struct {
	ProductID uint    `json:"product_id"`
	Quantity  float64 `json:"quantity"`
}

type CreateOrderInput struct {
	Items       []OrderLineInput  `json:"items"`
	ExtraPhone  string            `json:"extra_phone"`
	AddressNote string            `json:"address_note"`
	Address     OrderAddressInput `json:"address"`
}

type OrderAddressOutput struct {
	Type           string `json:"type"`
	DeliveryAreaID *uint  `json:"delivery_area_id,omitempty"`
	AreaName       string `json:"area_name,omitempty"`
	RegionID       uint   `json:"region_id,omitempty"`
	DistrictID     uint   `json:"district_id,omitempty"`
	MFYID          uint   `json:"mfy_id,omitempty"`
	CustomText     string `json:"custom_text,omitempty"`
}

type OrderItemOutput struct {
	ID           uint    `json:"id"`
	ProductID    uint    `json:"product_id"`
	ContragentID uint    `json:"contragent_id"`
	ProductName  string  `json:"product_name"`
	UnitPrice    float64 `json:"unit_price"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	LineTotal    float64 `json:"line_total"`
}

type OrderPunktRoutingOutput struct {
	RoutingDistrictID uint   `json:"routing_district_id"`
	Status            string `json:"status"`
	AssignedPunktID   *uint  `json:"assigned_punkt_id,omitempty"`
}

type OrderRoadmapStep struct {
	Done bool   `json:"done"`
	At   string `json:"at,omitempty"`
}

type OrderRoadmapOutput struct {
	Created                     OrderRoadmapStep `json:"created"`
	PunktAssigned               OrderRoadmapStep `json:"punkt_assigned"`
	PunktAccepted               OrderRoadmapStep `json:"punkt_accepted"`
	PunktRejected               OrderRoadmapStep `json:"punkt_rejected"`
	ContragentRequestsCreated   OrderRoadmapStep `json:"contragent_requests_created"`
	PunktCollected              OrderRoadmapStep `json:"punkt_collected"`
	PunktReady                  OrderRoadmapStep `json:"punkt_ready"`
	AgentAssigned               OrderRoadmapStep `json:"agent_assigned"`
	AgentDeclaredPaymentToPunkt OrderRoadmapStep `json:"agent_declared_payment_to_punkt"`
	PunktConfirmedAgentPayment  OrderRoadmapStep `json:"punkt_confirmed_agent_payment"`
	PunktPostPaymentDelivered   OrderRoadmapStep `json:"punkt_post_payment_delivered"`
	PunktRemainderHandedOver    OrderRoadmapStep `json:"punkt_remainder_handed_over"`
	Delivered                   OrderRoadmapStep `json:"delivered"`
	Cancelled                   OrderRoadmapStep `json:"cancelled"`
	CurrentStage                string           `json:"current_stage"`
}

type OrderOutput struct {
	ID           uint                    `json:"id"`
	Status       string                  `json:"status"`
	CanCancel    bool                    `json:"can_cancel"`
	TotalAmount  float64                 `json:"total_amount"`
	ExtraPhone   string                  `json:"extra_phone,omitempty"`
	AddressNote  string                  `json:"address_note,omitempty"`
	Address      OrderAddressOutput      `json:"address"`
	PunktRouting OrderPunktRoutingOutput `json:"punkt_routing"`
	Items        []OrderItemOutput       `json:"items"`
	Roadmap      OrderRoadmapOutput      `json:"roadmap"`
	CreatedAt    string                  `json:"created_at"`
	UpdatedAt    string                  `json:"updated_at"`
}

type PaginatedOrders struct {
	Items      []OrderOutput `json:"items"`
	Total      int64         `json:"total"`
	Page       int           `json:"page"`
	Limit      int           `json:"limit"`
	TotalPages int           `json:"total_pages"`
}

type MarketplaceOrderService interface {
	Create(userID uint, input CreateOrderInput) (*OrderOutput, error)
	List(userID uint, page, limit int) (*PaginatedOrders, error)
	GetByID(userID, orderID uint) (*OrderOutput, error)
	Cancel(userID, orderID uint) (*OrderOutput, error)
}

type marketplaceOrderService struct {
	orderRepo    repository.MarketplaceOrderRepository
	productRepo  repository.MarketplaceProductRepository
	deliveryRepo repository.DeliveryAreaRepository
	punktLookup  repository.PunktLookupRepository
}

func NewMarketplaceOrderService(
	orderRepo repository.MarketplaceOrderRepository,
	productRepo repository.MarketplaceProductRepository,
	deliveryRepo repository.DeliveryAreaRepository,
	punktLookup repository.PunktLookupRepository,
) MarketplaceOrderService {
	return &marketplaceOrderService{
		orderRepo:    orderRepo,
		productRepo:  productRepo,
		deliveryRepo: deliveryRepo,
		punktLookup:  punktLookup,
	}
}

func (s *marketplaceOrderService) Create(userID uint, input CreateOrderInput) (*OrderOutput, error) {
	input.ExtraPhone = strings.TrimSpace(input.ExtraPhone)
	input.AddressNote = strings.TrimSpace(input.AddressNote)
	input.Address.Type = strings.TrimSpace(strings.ToLower(input.Address.Type))
	input.Address.Text = strings.TrimSpace(input.Address.Text)

	if input.ExtraPhone != "" && !orderExtraPhoneRegex.MatchString(input.ExtraPhone) {
		return nil, ErrOrderExtraPhoneInvalid
	}

	defaultArea, err := s.deliveryRepo.GetDefaultByUserID(userID)
	if err != nil {
		return nil, err
	}
	if defaultArea == nil {
		return nil, ErrOrderNoDefaultAddress
	}

	if len(input.Items) == 0 {
		return nil, ErrOrderEmptyItems
	}

	qtyByProduct := make(map[uint]float64)
	for _, line := range input.Items {
		if line.ProductID == 0 || line.Quantity <= 0 || math.IsNaN(line.Quantity) || math.IsInf(line.Quantity, 0) {
			return nil, ErrOrderInvalidQuantity
		}
		qtyByProduct[line.ProductID] += line.Quantity
	}

	ids := make([]uint, 0, len(qtyByProduct))
	for id := range qtyByProduct {
		ids = append(ids, id)
	}
	prows, err := s.productRepo.GetApprovedProductsByIDs(ids)
	if err != nil {
		return nil, err
	}
	pmap := make(map[uint]contrDomain.Product, len(prows))
	for i := range prows {
		pmap[prows[i].ID] = prows[i]
	}

	for pid, qty := range qtyByProduct {
		p, ok := pmap[pid]
		if !ok || p.Quantity <= 0 {
			return nil, ErrOrderProductUnavailable
		}
		if qty > p.Quantity {
			return nil, ErrOrderInsufficientStock
		}
	}

	orderRow := &domain.Order{
		UserID:      userID,
		Status:      domain.OrderStatusPending,
		ExtraPhone:  input.ExtraPhone,
		AddressNote: input.AddressNote,
	}

	switch input.Address.Type {
	case domain.OrderAddressModeDefault:
		orderRow.AddressMode = domain.OrderAddressModeDefault
		daID := defaultArea.ID
		orderRow.DeliveryAreaID = &daID
		orderRow.SnapAreaName = defaultArea.Name
		orderRow.SnapRegionID = defaultArea.RegionID
		orderRow.SnapDistrictID = defaultArea.DistrictID
		orderRow.SnapMFYID = defaultArea.MFYID

	case domain.OrderAddressModeDeliveryArea:
		if input.Address.DeliveryAreaID == 0 {
			return nil, ErrOrderInvalidAddress
		}
		area, err := s.deliveryRepo.GetByIDAndUserID(input.Address.DeliveryAreaID, userID)
		if err != nil {
			return nil, err
		}
		if area == nil {
			return nil, ErrOrderInvalidAddress
		}
		orderRow.AddressMode = domain.OrderAddressModeDeliveryArea
		daID := area.ID
		orderRow.DeliveryAreaID = &daID
		orderRow.SnapAreaName = area.Name
		orderRow.SnapRegionID = area.RegionID
		orderRow.SnapDistrictID = area.DistrictID
		orderRow.SnapMFYID = area.MFYID

	case domain.OrderAddressModeExtra:
		if input.Address.Text == "" {
			return nil, ErrOrderInvalidAddress
		}
		orderRow.AddressMode = domain.OrderAddressModeExtra
		orderRow.PrimaryCustomAddress = input.Address.Text
		orderRow.DeliveryAreaID = nil
		orderRow.SnapAreaName = ""
		orderRow.SnapRegionID = 0
		orderRow.SnapDistrictID = 0
		orderRow.SnapMFYID = 0

	default:
		return nil, ErrOrderInvalidAddress
	}

	orderRow.RoutingDistrictID = orderRow.SnapDistrictID
	orderRow.PunktAcceptanceStatus = domain.OrderPunktStatusNone
	orderRow.AssignedPunktID = nil
	if orderRow.RoutingDistrictID > 0 {
		pid, err := s.punktLookup.FindActivePunktIDByDistrictID(orderRow.RoutingDistrictID)
		if err != nil {
			return nil, err
		}
		if pid != nil {
			orderRow.AssignedPunktID = pid
			orderRow.PunktAcceptanceStatus = domain.OrderPunktStatusInbox
		} else {
			orderRow.PunktAcceptanceStatus = domain.OrderPunktStatusNoPunkt
		}
	}

	items := make([]domain.OrderItem, 0, len(qtyByProduct))
	deductions := make([]repository.StockDeduction, 0, len(qtyByProduct))
	var total float64

	for pid, qty := range qtyByProduct {
		p := pmap[pid]
		lineTotal := p.Price * qty
		total += lineTotal
		items = append(items, domain.OrderItem{
			ProductID:    p.ID,
			ContragentID: p.ContragentID,
			ProductName:  p.Name,
			UnitPrice:    p.Price,
			Quantity:     qty,
			Unit:         p.Unit,
		})
		deductions = append(deductions, repository.StockDeduction{ProductID: pid, Quantity: qty})
	}

	orderRow.TotalAmount = total

	if err := s.orderRepo.CreateOrderWithDeductions(orderRow, items, deductions); err != nil {
		return nil, err
	}

	full, err := s.orderRepo.GetByIDAndUserIDWithItems(orderRow.ID, userID)
	if err != nil {
		return nil, err
	}
	if full == nil {
		return nil, ErrOrderNotFound
	}
	return orderToOutput(full), nil
}

func (s *marketplaceOrderService) List(userID uint, page, limit int) (*PaginatedOrders, error) {
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
	out := make([]OrderOutput, 0, len(rows))
	for i := range rows {
		out = append(out, *orderToOutput(&rows[i]))
	}
	return &PaginatedOrders{
		Items:      out,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *marketplaceOrderService) GetByID(userID, orderID uint) (*OrderOutput, error) {
	row, err := s.orderRepo.GetByIDAndUserIDWithItems(orderID, userID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	return orderToOutput(row), nil
}

func (s *marketplaceOrderService) Cancel(userID, orderID uint) (*OrderOutput, error) {
	err := s.orderRepo.CancelPendingOrderRestoreStock(userID, orderID)
	if err != nil {
		switch {
		case errors.Is(err, repository.ErrCancelOrderNotFound):
			return nil, ErrOrderNotFound
		case errors.Is(err, repository.ErrCancelOrderNotPending):
			return nil, ErrOrderCannotCancel
		case errors.Is(err, repository.ErrCancelRestoreProductMissing):
			return nil, ErrOrderRestoreProductMissing
		default:
			return nil, err
		}
	}
	return s.GetByID(userID, orderID)
}

func orderToOutput(row *domain.Order) *OrderOutput {
	addr := OrderAddressOutput{Type: row.AddressMode}
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

	itemOut := make([]OrderItemOutput, 0, len(row.Items))
	for i := range row.Items {
		it := &row.Items[i]
		itemOut = append(itemOut, OrderItemOutput{
			ID:           it.ID,
			ProductID:    it.ProductID,
			ContragentID: it.ContragentID,
			ProductName:  it.ProductName,
			UnitPrice:    it.UnitPrice,
			Quantity:     it.Quantity,
			Unit:         it.Unit,
			LineTotal:    it.UnitPrice * it.Quantity,
		})
	}

	pr := OrderPunktRoutingOutput{
		RoutingDistrictID: row.RoutingDistrictID,
		Status:            row.PunktAcceptanceStatus,
		AssignedPunktID:   row.AssignedPunktID,
	}
	roadmap := buildOrderRoadmap(row)

	return &OrderOutput{
		ID:           row.ID,
		Status:       row.Status,
		CanCancel:    row.Status == domain.OrderStatusPending,
		TotalAmount:  row.TotalAmount,
		ExtraPhone:   row.ExtraPhone,
		AddressNote:  row.AddressNote,
		Address:      addr,
		PunktRouting: pr,
		Items:        itemOut,
		Roadmap:      roadmap,
		CreatedAt:    row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:    row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func buildOrderRoadmap(row *domain.Order) OrderRoadmapOutput {
	toStep := func(v bool, at string) OrderRoadmapStep {
		if at == "" {
			return OrderRoadmapStep{Done: v}
		}
		return OrderRoadmapStep{Done: v, At: at}
	}
	createdAt := row.CreatedAt.Format("2006-01-02T15:04:05Z07:00")
	punktCollectedAt := formatOrderTimePtr(row.PunktCollectedAt)
	punktReadyAt := formatOrderTimePtr(row.PunktReadyAt)
	agentPayAt := formatOrderTimePtr(row.AgentDeclaredPaymentToPunktAt)
	punktConfirmAt := formatOrderTimePtr(row.PunktConfirmedAgentPaymentAt)
	postPayDeliveredAt := formatOrderTimePtr(row.PunktPostPaymentDeliveredAt)
	remainderAt := formatOrderTimePtr(row.PunktContragentRemainderHandedOverAt)

	out := OrderRoadmapOutput{
		Created:                     toStep(true, createdAt),
		PunktAssigned:               toStep(row.AssignedPunktID != nil, ""),
		PunktAccepted:               toStep(row.PunktAcceptanceStatus == domain.OrderPunktStatusContragentRequestsCreated, ""),
		PunktRejected:               toStep(row.PunktAcceptanceStatus == domain.OrderPunktStatusRejected, ""),
		ContragentRequestsCreated:   toStep(row.PunktAcceptanceStatus == domain.OrderPunktStatusContragentRequestsCreated, ""),
		PunktCollected:              toStep(row.PunktCollectedAt != nil, punktCollectedAt),
		PunktReady:                  toStep(row.PunktReadyAt != nil, punktReadyAt),
		AgentAssigned:               toStep(row.AssignedAgentID != nil, ""),
		AgentDeclaredPaymentToPunkt: toStep(row.AgentDeclaredPaymentToPunktAt != nil, agentPayAt),
		PunktConfirmedAgentPayment:  toStep(row.PunktConfirmedAgentPaymentAt != nil, punktConfirmAt),
		PunktPostPaymentDelivered:   toStep(row.PunktPostPaymentDeliveredAt != nil, postPayDeliveredAt),
		PunktRemainderHandedOver:    toStep(row.PunktContragentRemainderHandedOverAt != nil, remainderAt),
		Delivered:                   toStep(row.Status == domain.OrderStatusDelivered, ""),
		Cancelled:                   toStep(row.Status == domain.OrderStatusCancelled, ""),
	}
	out.CurrentStage = deriveOrderCurrentStage(row)
	return out
}

func deriveOrderCurrentStage(row *domain.Order) string {
	if row.Status == domain.OrderStatusCancelled {
		return "cancelled"
	}
	if row.Status == domain.OrderStatusDelivered {
		return "delivered"
	}
	if row.PunktAcceptanceStatus == domain.OrderPunktStatusRejected {
		return "punkt_rejected"
	}
	if row.PunktContragentRemainderHandedOverAt != nil {
		return "punkt_remainder_handed_over"
	}
	if row.PunktPostPaymentDeliveredAt != nil {
		return "punkt_post_payment_delivered"
	}
	if row.PunktConfirmedAgentPaymentAt != nil {
		return "punkt_confirmed_agent_payment"
	}
	if row.AgentDeclaredPaymentToPunktAt != nil {
		return "agent_declared_payment_to_punkt"
	}
	if row.AssignedAgentID != nil {
		return "agent_assigned"
	}
	if row.PunktReadyAt != nil {
		return "punkt_ready"
	}
	if row.PunktCollectedAt != nil {
		return "punkt_collected"
	}
	if row.PunktAcceptanceStatus == domain.OrderPunktStatusContragentRequestsCreated {
		return "contragent_requests_created"
	}
	if row.PunktAcceptanceStatus == domain.OrderPunktStatusInbox {
		return "punkt_inbox"
	}
	if row.PunktAcceptanceStatus == domain.OrderPunktStatusNoPunkt {
		return "no_punkt"
	}
	if row.PunktAcceptanceStatus == domain.OrderPunktStatusNone {
		return "no_routing"
	}
	return "pending"
}

func formatOrderTimePtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format("2006-01-02T15:04:05Z07:00")
}
