package service

import (
	"errors"
	"math"
	"strings"
	"time"

	"backend/internal/pkg/orderembed"
	"backend/modules/agents/repository"
	mpdomain "backend/modules/marketplace/domain"
)

var (
	ErrAgentOrderNotFound             = repository.ErrAgentOrderNotFound
	ErrAgentOrderNotDeliverable       = repository.ErrAgentOrderNotDeliverable
	ErrAgentOrderSettlementWrongState = repository.ErrAgentOrderSettlementWrongState
	ErrAgentOrderSettlementIncomplete = repository.ErrAgentOrderSettlementIncomplete
	ErrAgentAnalyticsDateInvalid      = errors.New("sana formati noto'g'ri, YYYY-MM-DD ishlating")
	ErrAgentAnalyticsDateRangeInvalid = errors.New("from sanasi to sanasidan katta bo'lmasligi kerak")
)

type AgentOrderItemOut struct {
	ID                      uint                        `json:"id"`
	ProductID               uint                        `json:"product_id"`
	Contragent              *orderembed.ContragentBrief `json:"contragent,omitempty"`
	ProductName             string                      `json:"product_name"`
	UnitPrice               float64                     `json:"unit_price"`
	Quantity                float64                     `json:"quantity"`
	Unit                    string                      `json:"unit"`
	LineTotal               float64                     `json:"line_total"`
	ContragentPayoutPercent *float64                    `json:"contragent_payout_percent,omitempty"`
	ContragentPayoutAmount  float64                     `json:"contragent_payout_amount"`
}

type AgentOrderListItem struct {
	ID                                   uint                   `json:"id"`
	MarketplaceStatus                    string                 `json:"marketplace_status"`
	TotalAmount                          float64                `json:"total_amount"`
	AssignedPunkt                        *orderembed.PunktBrief `json:"assigned_punkt,omitempty"`
	RoutingDistrictID                    uint                   `json:"routing_district_id"`
	CreatedAt                            string                 `json:"created_at"`
	ItemsCount                           int                    `json:"items_count"`
	AddressMode                          string                 `json:"address_mode"`
	SnapAreaName                         string                 `json:"snap_area_name,omitempty"`
	SnapMFYID                            uint                   `json:"snap_mfy_id,omitempty"`
	PrimaryCustomAddress                 string                 `json:"primary_custom_address,omitempty"`
	AgentDeclaredPaymentToPunktAt        string                 `json:"agent_declared_payment_to_punkt_at,omitempty"`
	PunktConfirmedAgentPaymentAt         string                 `json:"punkt_confirmed_agent_payment_at,omitempty"`
	PunktPostPaymentDeliveredAt          string                 `json:"punkt_post_payment_delivered_at,omitempty"`
	PunktContragentRemainderHandedOverAt string                 `json:"punkt_contragent_remainder_handed_over_at,omitempty"`
}

type AgentOrderDetail struct {
	AgentOrderListItem
	ExtraPhone     string                           `json:"extra_phone,omitempty"`
	AddressNote    string                           `json:"address_note,omitempty"`
	SnapRegionID   uint                             `json:"snap_region_id,omitempty"`
	SnapDistrictID uint                             `json:"snap_district_id,omitempty"`
	UserID         uint                             `json:"user_id"`
	User           *orderembed.MarketplaceUserBrief `json:"user,omitempty"`
	UserPhone      string                           `json:"user_phone,omitempty"`
	ContactPhones  []string                         `json:"contact_phones,omitempty"`
	Items          []AgentOrderItemOut              `json:"items"`
}

type PaginatedAgentOrders struct {
	Items      []AgentOrderListItem `json:"items"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

type AgentOrderService struct {
	repo  repository.AgentOrderRepository
	embed *orderembed.Loader
}

type AgentOrderAnalyticsOutput struct {
	From                      string  `json:"from,omitempty"`
	To                        string  `json:"to,omitempty"`
	TotalOrders               int64   `json:"total_orders"`
	TotalAmount               float64 `json:"total_amount"`
	DeliveredOrders           int64   `json:"delivered_orders"`
	DeliveredAmount           float64 `json:"delivered_amount"`
	PendingOrders             int64   `json:"pending_orders"`
	PendingAmount             float64 `json:"pending_amount"`
	DeclaredToPunktAmount     float64 `json:"declared_to_punkt_amount"`
	ConfirmedByPunktAmount    float64 `json:"confirmed_by_punkt_amount"`
	UnconfirmedDeclaredAmount float64 `json:"unconfirmed_declared_amount"`
}

func NewAgentOrderService(repo repository.AgentOrderRepository, embed *orderembed.Loader) *AgentOrderService {
	return &AgentOrderService{repo: repo, embed: embed}
}

func clampPageLimit(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func (s *AgentOrderService) ListActive(agentID uint, page, limit int) (*PaginatedAgentOrders, error) {
	return s.list(agentID, "active", page, limit)
}

func (s *AgentOrderService) ListHistory(agentID uint, page, limit int) (*PaginatedAgentOrders, error) {
	return s.list(agentID, "history", page, limit)
}

func (s *AgentOrderService) list(agentID uint, kind string, page, limit int) (*PaginatedAgentOrders, error) {
	page, limit = clampPageLimit(page, limit)
	rows, total, err := s.repo.ListForAgent(agentID, kind, page, limit)
	if err != nil {
		return nil, err
	}
	var punktIDs []uint
	for i := range rows {
		if rows[i].AssignedPunktID != nil {
			punktIDs = append(punktIDs, *rows[i].AssignedPunktID)
		}
	}
	punkts, err := s.embed.PunktsByIDs(punktIDs)
	if err != nil {
		return nil, err
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if total == 0 {
		totalPages = 0
	}
	items := make([]AgentOrderListItem, 0, len(rows))
	for i := range rows {
		it := orderToAgentListItem(&rows[i])
		if rows[i].AssignedPunktID != nil {
			it.AssignedPunkt = orderembed.PunktPtr(punkts, *rows[i].AssignedPunktID)
		}
		items = append(items, it)
	}
	return &PaginatedAgentOrders{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func orderToAgentListItem(row *mpdomain.Order) AgentOrderListItem {
	return AgentOrderListItem{
		ID:                                   row.ID,
		MarketplaceStatus:                    row.Status,
		TotalAmount:                          row.TotalAmount,
		RoutingDistrictID:                    row.RoutingDistrictID,
		CreatedAt:                            row.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		ItemsCount:                           len(row.Items),
		AddressMode:                          row.AddressMode,
		SnapAreaName:                         row.SnapAreaName,
		SnapMFYID:                            row.SnapMFYID,
		PrimaryCustomAddress:                 row.PrimaryCustomAddress,
		AgentDeclaredPaymentToPunktAt:        formatAgentTimePtr(row.AgentDeclaredPaymentToPunktAt),
		PunktConfirmedAgentPaymentAt:         formatAgentTimePtr(row.PunktConfirmedAgentPaymentAt),
		PunktPostPaymentDeliveredAt:          formatAgentTimePtr(row.PunktPostPaymentDeliveredAt),
		PunktContragentRemainderHandedOverAt: formatAgentTimePtr(row.PunktContragentRemainderHandedOverAt),
	}
}

func (s *AgentOrderService) GetByID(agentID, orderID uint) (*AgentOrderDetail, error) {
	row, err := s.repo.GetByIDForAgent(orderID, agentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAgentOrderNotFound
	}
	base := orderToAgentListItem(row)
	if row.AssignedPunktID != nil {
		pm, err := s.embed.PunktsByIDs([]uint{*row.AssignedPunktID})
		if err != nil {
			return nil, err
		}
		base.AssignedPunkt = orderembed.PunktPtr(pm, *row.AssignedPunktID)
	}
	var cIDs []uint
	for i := range row.Items {
		cIDs = append(cIDs, row.Items[i].ContragentID)
	}
	cmap, err := s.embed.ContragentsByIDs(cIDs)
	if err != nil {
		return nil, err
	}
	umap, err := s.embed.MarketplaceUsersByIDs([]uint{row.UserID})
	if err != nil {
		return nil, err
	}
	user := orderembed.MarketplaceUserPtr(umap, row.UserID)
	items := make([]AgentOrderItemOut, 0, len(row.Items))
	for i := range row.Items {
		it := &row.Items[i]
		lineTotal := it.UnitPrice * it.Quantity
		var payoutAmt float64
		if it.PunktContragentPayoutPercent != nil {
			payoutAmt = lineTotal * (*it.PunktContragentPayoutPercent) / 100
		}
		items = append(items, AgentOrderItemOut{
			ID:                      it.ID,
			ProductID:               it.ProductID,
			Contragent:              orderembed.ContragentPtr(cmap, it.ContragentID),
			ProductName:             it.ProductName,
			UnitPrice:               it.UnitPrice,
			Quantity:                it.Quantity,
			Unit:                    it.Unit,
			LineTotal:               lineTotal,
			ContragentPayoutPercent: it.PunktContragentPayoutPercent,
			ContragentPayoutAmount:  payoutAmt,
		})
	}
	phones := make([]string, 0, 2)
	if user != nil && user.Phone != "" {
		phones = append(phones, user.Phone)
	}
	if row.ExtraPhone != "" {
		phones = append(phones, row.ExtraPhone)
	}
	out := &AgentOrderDetail{
		AgentOrderListItem: base,
		UserID:             row.UserID,
		ExtraPhone:         row.ExtraPhone,
		AddressNote:        row.AddressNote,
		SnapRegionID:       row.SnapRegionID,
		SnapDistrictID:     row.SnapDistrictID,
		User:               user,
		Items:              items,
	}
	if user != nil {
		out.UserPhone = user.Phone
	}
	if len(phones) > 0 {
		out.ContactPhones = phones
	}
	return out, nil
}

func (s *AgentOrderService) MarkDelivered(agentID, orderID uint) error {
	return s.repo.MarkDeliveredByAgent(orderID, agentID)
}

func (s *AgentOrderService) DeclarePaymentToPunkt(agentID, orderID uint) error {
	return s.repo.DeclarePaymentToPunkt(orderID, agentID)
}

func formatAgentTimePtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format("2006-01-02T15:04:05Z07:00")
}

func (s *AgentOrderService) Analytics(agentID uint, fromRaw, toRaw string) (*AgentOrderAnalyticsOutput, error) {
	var from *time.Time
	var to *time.Time
	if v := strings.TrimSpace(fromRaw); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return nil, ErrAgentAnalyticsDateInvalid
		}
		utc := t.UTC()
		from = &utc
	}
	if v := strings.TrimSpace(toRaw); v != "" {
		t, err := time.Parse("2006-01-02", v)
		if err != nil {
			return nil, ErrAgentAnalyticsDateInvalid
		}
		end := t.UTC().Add(24*time.Hour - time.Nanosecond)
		to = &end
	}
	if from != nil && to != nil && from.After(*to) {
		return nil, ErrAgentAnalyticsDateRangeInvalid
	}
	row, err := s.repo.GetAnalytics(agentID, from, to)
	if err != nil {
		return nil, err
	}
	out := &AgentOrderAnalyticsOutput{
		TotalOrders:               row.TotalOrders,
		TotalAmount:               row.TotalAmount,
		DeliveredOrders:           row.DeliveredOrders,
		DeliveredAmount:           row.DeliveredAmount,
		PendingOrders:             row.PendingOrders,
		PendingAmount:             row.PendingAmount,
		DeclaredToPunktAmount:     row.DeclaredToPunktAmount,
		ConfirmedByPunktAmount:    row.ConfirmedByPunktAmount,
		UnconfirmedDeclaredAmount: row.UnconfirmedDeclaredAmount,
	}
	if from != nil {
		out.From = from.UTC().Format("2006-01-02")
	}
	if to != nil {
		out.To = to.UTC().Format("2006-01-02")
	}
	return out, nil
}
