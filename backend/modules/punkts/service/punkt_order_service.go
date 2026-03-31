package service

import (
	"errors"
	"time"

	"backend/internal/pkg/orderembed"
	mpdomain "backend/modules/marketplace/domain"
	"backend/modules/punkts/repository"
)

var asiaTashkent *time.Location

func init() {
	loc, err := time.LoadLocation("Asia/Tashkent")
	if err != nil {
		asiaTashkent = time.UTC
	} else {
		asiaTashkent = loc
	}
}

func boundsTodayUTC() (startUTC, endExclusiveUTC time.Time) {
	now := time.Now().In(asiaTashkent)
	startLocal := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, asiaTashkent)
	endLocal := startLocal.Add(24 * time.Hour)
	return startLocal.UTC(), endLocal.UTC()
}

func startOfTodayUTC() time.Time {
	s, _ := boundsTodayUTC()
	return s
}

var (
	ErrPunktOrderNotFound       = repository.ErrPunktOrderNotFound
	ErrPunktOrderWrongPunkt     = repository.ErrPunktOrderWrongPunkt
	ErrPunktOrderNotInInbox     = repository.ErrPunktOrderNotInInbox
	ErrPunktOrderNotPending     = repository.ErrPunktOrderNotPending
	ErrPunktOrderAlreadyHandled = repository.ErrPunktOrderAlreadyHandled

	ErrPunktOrderFulfillmentWrongState = repository.ErrPunktOrderFulfillmentWrongState
	ErrPunktOrderNotCollected          = repository.ErrPunktOrderNotCollected
	ErrPunktOrderNotReady              = repository.ErrPunktOrderNotReady
	ErrPunktOrderPayoutInvalid         = repository.ErrPunktOrderPayoutInvalid
	ErrPunktOrderNoMFY                 = repository.ErrPunktOrderNoMFY
	ErrPunktOrderAgentInvalid          = repository.ErrPunktOrderAgentInvalid
	ErrPunktOrderAgentAlreadyOther     = repository.ErrPunktOrderAgentAlreadyOther
	ErrPunktOrderDistrictMismatch      = repository.ErrPunktOrderDistrictMismatch
	ErrPunktOrderTransferPending       = repository.ErrPunktOrderTransferPending

	ErrPunktOrderNoAgentAssigned             = repository.ErrPunktOrderNoAgentAssigned
	ErrPunktOrderAgentPaymentNotDeclared     = repository.ErrPunktOrderAgentPaymentNotDeclared
	ErrPunktOrderAgentPaymentNotConfirmed    = repository.ErrPunktOrderAgentPaymentNotConfirmed
	ErrPunktOrderPostPaymentDeliveredMissing = repository.ErrPunktOrderPostPaymentDeliveredMissing
)

type LineRequestOutput struct {
	ID                uint                        `json:"id"`
	OrderItemID       uint                        `json:"order_item_id"`
	Contragent        *orderembed.ContragentBrief `json:"contragent"`
	ContragentName    string                      `json:"contragent_name,omitempty"`
	RoutingDistrictID uint                        `json:"routing_district_id"`
	Status            string                      `json:"status"`
}

type OrderItemBrief struct {
	ID                      uint                        `json:"id"`
	ProductID               uint                        `json:"product_id"`
	Contragent              *orderembed.ContragentBrief `json:"contragent"`
	ContragentName          string                      `json:"contragent_name,omitempty"`
	ProductName             string                      `json:"product_name"`
	UnitPrice               float64                     `json:"unit_price"`
	Quantity                float64                     `json:"quantity"`
	Unit                    string                      `json:"unit"`
	LineTotal               float64                     `json:"line_total"`
	ContragentPayoutPercent *float64                    `json:"contragent_payout_percent,omitempty"`
	ContragentPayoutAmount  float64                     `json:"contragent_payout_amount"`
}

type PunktOrderListItem struct {
	ID                                   uint                   `json:"id"`
	MarketplaceStatus                    string                 `json:"marketplace_status"`
	PunktAcceptanceStatus                string                 `json:"punkt_acceptance_status"`
	TotalAmount                          float64                `json:"total_amount"`
	RoutingDistrictID                    uint                   `json:"routing_district_id"`
	CreatedAt                            string                 `json:"created_at"`
	ItemsCount                           int                    `json:"items_count"`
	PunktCollectedAt                     string                 `json:"punkt_collected_at,omitempty"`
	PunktReadyAt                         string                 `json:"punkt_ready_at,omitempty"`
	AssignedAgent                        *orderembed.AgentBrief `json:"assigned_agent"`
	AssignedAgentName                    string                 `json:"assigned_agent_name,omitempty"`
	AgentDeclaredPaymentToPunktAt        string                 `json:"agent_declared_payment_to_punkt_at,omitempty"`
	PunktConfirmedAgentPaymentAt         string                 `json:"punkt_confirmed_agent_payment_at,omitempty"`
	PunktPostPaymentDeliveredAt          string                 `json:"punkt_post_payment_delivered_at,omitempty"`
	PunktContragentRemainderHandedOverAt string                 `json:"punkt_contragent_remainder_handed_over_at,omitempty"`
}

type PunktOrderDetail struct {
	PunktOrderListItem
	UserID               uint                `json:"user_id"`
	ExtraPhone           string              `json:"extra_phone,omitempty"`
	AddressNote          string              `json:"address_note,omitempty"`
	AddressMode          string              `json:"address_mode"`
	SnapAreaName         string              `json:"snap_area_name,omitempty"`
	SnapRegionID         uint                `json:"snap_region_id,omitempty"`
	SnapDistrictID       uint                `json:"snap_district_id,omitempty"`
	SnapMFYID            uint                `json:"snap_mfy_id,omitempty"`
	PrimaryCustomAddress string              `json:"primary_custom_address,omitempty"`
	Items                []OrderItemBrief    `json:"items"`
	ContragentRequests   []LineRequestOutput `json:"contragent_line_requests"`
}

type PaginatedPunktOrders struct {
	Items      []PunktOrderListItem `json:"items"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

type PunktOrderService interface {
	ListToday(punktID uint, page, limit int) (*PaginatedPunktOrders, error)
	ListHistory(punktID uint, page, limit int) (*PaginatedPunktOrders, error)
	GetByID(punktID, orderID uint) (*PunktOrderDetail, error)
	Accept(punktID, orderID uint) error
	Reject(punktID, orderID uint) error

	MarkPunktCollected(punktID, orderID uint) error
	MarkPunktReady(punktID, orderID uint) error
	SetContragentPayoutPercents(punktID, orderID uint, percents map[uint]float64) error
	AssignAgent(punktID, orderID, agentID uint) error

	ConfirmAgentPaymentToPunkt(punktID, orderID uint) error
	MarkPunktPostPaymentDelivered(punktID, orderID uint) error
	MarkPunktContragentRemainderHandedOver(punktID, orderID uint) error
}

type punktOrderService struct {
	repo  repository.PunktMarketplaceOrderRepository
	embed *orderembed.Loader
}

func NewPunktOrderService(repo repository.PunktMarketplaceOrderRepository, embed *orderembed.Loader) PunktOrderService {
	return &punktOrderService{repo: repo, embed: embed}
}

func (s *punktOrderService) ListToday(punktID uint, page, limit int) (*PaginatedPunktOrders, error) {
	start, end := boundsTodayUTC()
	return s.listInRange(punktID, &start, &end, page, limit)
}

func (s *punktOrderService) ListHistory(punktID uint, page, limit int) (*PaginatedPunktOrders, error) {
	cutoff := startOfTodayUTC()
	return s.listInRange(punktID, nil, &cutoff, page, limit)
}

func (s *punktOrderService) listInRange(punktID uint, startInclusive, endExclusive *time.Time, page, limit int) (*PaginatedPunktOrders, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.ListByPunktCreatedInRange(punktID, startInclusive, endExclusive, page, limit)
	if err != nil {
		return nil, err
	}
	var agentIDs []uint
	for i := range rows {
		if rows[i].AssignedAgentID != nil {
			agentIDs = append(agentIDs, *rows[i].AssignedAgentID)
		}
	}
	agents, err := s.embed.AgentsByIDs(agentIDs)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	items := make([]PunktOrderListItem, 0, len(rows))
	for i := range rows {
		it := orderToListItem(&rows[i])
		if rows[i].AssignedAgentID != nil {
			it.AssignedAgent = orderembed.AgentPtr(agents, *rows[i].AssignedAgentID)
			if it.AssignedAgent != nil {
				it.AssignedAgentName = it.AssignedAgent.Name
			}
		}
		items = append(items, it)
	}
	return &PaginatedPunktOrders{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *punktOrderService) GetByID(punktID, orderID uint) (*PunktOrderDetail, error) {
	row, err := s.repo.GetByIDForPunktWithItems(orderID, punktID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrPunktOrderNotFound
	}
	reqs, err := s.repo.ListLineRequestsByOrderID(orderID)
	if err != nil {
		return nil, err
	}
	base := orderToListItem(row)
	if row.AssignedAgentID != nil {
		agents, err := s.embed.AgentsByIDs([]uint{*row.AssignedAgentID})
		if err != nil {
			return nil, err
		}
		base.AssignedAgent = orderembed.AgentPtr(agents, *row.AssignedAgentID)
		if base.AssignedAgent != nil {
			base.AssignedAgentName = base.AssignedAgent.Name
		}
	}
	var cIDs []uint
	for i := range row.Items {
		cIDs = append(cIDs, row.Items[i].ContragentID)
	}
	for i := range reqs {
		cIDs = append(cIDs, reqs[i].ContragentID)
	}
	cmap, err := s.embed.ContragentsByIDs(cIDs)
	if err != nil {
		return nil, err
	}
	items := make([]OrderItemBrief, 0, len(row.Items))
	for i := range row.Items {
		it := &row.Items[i]
		lineTotal := it.UnitPrice * it.Quantity
		var payoutAmt float64
		if it.PunktContragentPayoutPercent != nil {
			payoutAmt = lineTotal * (*it.PunktContragentPayoutPercent) / 100
		}
		cPtr := orderembed.ContragentPtr(cmap, it.ContragentID)
		ob := OrderItemBrief{
			ID:                      it.ID,
			ProductID:               it.ProductID,
			Contragent:              cPtr,
			ProductName:             it.ProductName,
			UnitPrice:               it.UnitPrice,
			Quantity:                it.Quantity,
			Unit:                    it.Unit,
			LineTotal:               lineTotal,
			ContragentPayoutPercent: it.PunktContragentPayoutPercent,
			ContragentPayoutAmount:  payoutAmt,
		}
		if cPtr != nil {
			ob.ContragentName = cPtr.Name
		}
		items = append(items, ob)
	}
	cr := make([]LineRequestOutput, 0, len(reqs))
	for i := range reqs {
		r := &reqs[i]
		cPtr := orderembed.ContragentPtr(cmap, r.ContragentID)
		lr := LineRequestOutput{
			ID:                r.ID,
			OrderItemID:       r.OrderItemID,
			Contragent:        cPtr,
			RoutingDistrictID: r.RoutingDistrictID,
			Status:            r.Status,
		}
		if cPtr != nil {
			lr.ContragentName = cPtr.Name
		}
		cr = append(cr, lr)
	}
	return &PunktOrderDetail{
		PunktOrderListItem:   base,
		UserID:               row.UserID,
		ExtraPhone:           row.ExtraPhone,
		AddressNote:          row.AddressNote,
		AddressMode:          row.AddressMode,
		SnapAreaName:         row.SnapAreaName,
		SnapRegionID:         row.SnapRegionID,
		SnapDistrictID:       row.SnapDistrictID,
		SnapMFYID:            row.SnapMFYID,
		PrimaryCustomAddress: row.PrimaryCustomAddress,
		Items:                items,
		ContragentRequests:   cr,
	}, nil
}

func (s *punktOrderService) Accept(punktID, orderID uint) error {
	err := s.repo.AcceptOrderAndCreateLineRequests(punktID, orderID)
	if err != nil && errors.Is(err, repository.ErrPunktOrderWrongPunkt) {
		return repository.ErrPunktOrderNotFound
	}
	return err
}

func (s *punktOrderService) Reject(punktID, orderID uint) error {
	err := s.repo.RejectOrder(punktID, orderID)
	if err != nil && errors.Is(err, repository.ErrPunktOrderWrongPunkt) {
		return repository.ErrPunktOrderNotFound
	}
	return err
}

func (s *punktOrderService) MarkPunktCollected(punktID, orderID uint) error {
	err := s.repo.MarkPunktCollected(punktID, orderID)
	return mapPunktWrongToNotFound(err)
}

func (s *punktOrderService) MarkPunktReady(punktID, orderID uint) error {
	err := s.repo.MarkPunktReady(punktID, orderID)
	return mapPunktWrongToNotFound(err)
}

func (s *punktOrderService) SetContragentPayoutPercents(punktID, orderID uint, percents map[uint]float64) error {
	err := s.repo.SetPunktLinePayoutPercents(punktID, orderID, percents)
	return mapPunktWrongToNotFound(err)
}

func (s *punktOrderService) AssignAgent(punktID, orderID, agentID uint) error {
	err := s.repo.AssignOrderToAgent(punktID, orderID, agentID)
	return mapPunktWrongToNotFound(err)
}

func (s *punktOrderService) ConfirmAgentPaymentToPunkt(punktID, orderID uint) error {
	return mapPunktWrongToNotFound(s.repo.ConfirmAgentPaymentToPunkt(punktID, orderID))
}

func (s *punktOrderService) MarkPunktPostPaymentDelivered(punktID, orderID uint) error {
	return mapPunktWrongToNotFound(s.repo.MarkPunktPostPaymentDelivered(punktID, orderID))
}

func (s *punktOrderService) MarkPunktContragentRemainderHandedOver(punktID, orderID uint) error {
	return mapPunktWrongToNotFound(s.repo.MarkPunktContragentRemainderHandedOver(punktID, orderID))
}

func mapPunktWrongToNotFound(err error) error {
	if err != nil && errors.Is(err, repository.ErrPunktOrderWrongPunkt) {
		return repository.ErrPunktOrderNotFound
	}
	return err
}

func formatTimePtr(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format("2006-01-02T15:04:05Z07:00")
}

func orderToListItem(row *mpdomain.Order) PunktOrderListItem {
	return PunktOrderListItem{
		ID:                                   row.ID,
		MarketplaceStatus:                    row.Status,
		PunktAcceptanceStatus:                row.PunktAcceptanceStatus,
		TotalAmount:                          row.TotalAmount,
		RoutingDistrictID:                    row.RoutingDistrictID,
		CreatedAt:                            row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		ItemsCount:                           len(row.Items),
		PunktCollectedAt:                     formatTimePtr(row.PunktCollectedAt),
		PunktReadyAt:                         formatTimePtr(row.PunktReadyAt),
		AgentDeclaredPaymentToPunktAt:        formatTimePtr(row.AgentDeclaredPaymentToPunktAt),
		PunktConfirmedAgentPaymentAt:         formatTimePtr(row.PunktConfirmedAgentPaymentAt),
		PunktPostPaymentDeliveredAt:          formatTimePtr(row.PunktPostPaymentDeliveredAt),
		PunktContragentRemainderHandedOverAt: formatTimePtr(row.PunktContragentRemainderHandedOverAt),
	}
}
