package service

import (
	"math"

	"backend/internal/pkg/orderembed"
	"backend/modules/contragents/repository"
	punktdomain "backend/modules/punkts/domain"
)

var (
	ErrContragentLineRequestNotFound   = repository.ErrContragentLineRequestNotFound
	ErrContragentLineInvalidTransition = repository.ErrContragentLineInvalidTransition
)

type ContragentPunktLineRequestService struct {
	repo  repository.ContragentPunktLineRequestRepository
	embed *orderembed.Loader
}

func NewContragentPunktLineRequestService(repo repository.ContragentPunktLineRequestRepository, embed *orderembed.Loader) *ContragentPunktLineRequestService {
	return &ContragentPunktLineRequestService{repo: repo, embed: embed}
}

type LineRequestListItemOut struct {
	ID                uint                   `json:"id"`
	OrderID           uint                   `json:"order_id"`
	OrderItemID       uint                   `json:"order_item_id"`
	Punkt             *orderembed.PunktBrief `json:"punkt,omitempty"`
	AssignedAgent     *orderembed.AgentBrief `json:"assigned_agent,omitempty"`
	RoutingDistrictID uint                   `json:"routing_district_id"`
	Status            string                 `json:"status"`
	OrderStatus       string                 `json:"order_status"`
	ProductName       string                 `json:"product_name"`
	Quantity          float64                `json:"quantity"`
	Unit              string                 `json:"unit"`
	UnitPrice         float64                `json:"unit_price"`
	CreatedAt         string                 `json:"created_at"`
	UpdatedAt         string                 `json:"updated_at"`
}

type LineRequestListOut struct {
	Items      []LineRequestListItemOut `json:"items"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

type LineRequestOrderOut struct {
	ID            uint                   `json:"id"`
	Status        string                 `json:"status"`
	TotalAmount   float64                `json:"total_amount"`
	AssignedPunkt *orderembed.PunktBrief `json:"assigned_punkt,omitempty"`
	AssignedAgent *orderembed.AgentBrief `json:"assigned_agent,omitempty"`
}

type LineRequestDetailOut struct {
	ID                uint                   `json:"id"`
	OrderItemID       uint                   `json:"order_item_id"`
	RoutingDistrictID uint                   `json:"routing_district_id"`
	Status            string                 `json:"status"`
	Punkt             *orderembed.PunktBrief `json:"punkt,omitempty"`
	Order             *LineRequestOrderOut   `json:"order"`
	ProductID         uint                   `json:"product_id"`
	ProductName       string                 `json:"product_name"`
	Quantity          float64                `json:"quantity"`
	Unit              string                 `json:"unit"`
	UnitPrice         float64                `json:"unit_price"`
	CreatedAt         string                 `json:"created_at"`
	UpdatedAt         string                 `json:"updated_at"`
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

func (s *ContragentPunktLineRequestService) List(contragentID uint, page, limit int, status string) (*LineRequestListOut, error) {
	page, limit = clampPageLimit(page, limit)
	rows, total, err := s.repo.ListByContragent(contragentID, page, limit, status)
	if err != nil {
		return nil, err
	}
	var punktIDs, agentIDs []uint
	for i := range rows {
		punktIDs = append(punktIDs, rows[i].PunktID)
		if rows[i].AssignedAgentID != nil {
			agentIDs = append(agentIDs, *rows[i].AssignedAgentID)
		}
	}
	punkts, err := s.embed.PunktsByIDs(punktIDs)
	if err != nil {
		return nil, err
	}
	agents, err := s.embed.AgentsByIDs(agentIDs)
	if err != nil {
		return nil, err
	}
	items := make([]LineRequestListItemOut, 0, len(rows))
	for _, row := range rows {
		unitPrice := row.UnitPrice
		if row.PayoutPercent != nil && row.Quantity > 0 {
			linePaid := row.UnitPrice * row.Quantity * (*row.PayoutPercent) / 100
			unitPrice = math.Round((linePaid/row.Quantity)*100) / 100
		}
		var ag *orderembed.AgentBrief
		if row.AssignedAgentID != nil {
			ag = orderembed.AgentPtr(agents, *row.AssignedAgentID)
		}
		items = append(items, LineRequestListItemOut{
			ID:                row.ID,
			OrderID:           row.OrderID,
			OrderItemID:       row.OrderItemID,
			Punkt:             orderembed.PunktPtr(punkts, row.PunktID),
			AssignedAgent:     ag,
			RoutingDistrictID: row.RoutingDistrictID,
			Status:            row.Status,
			OrderStatus:       row.OrderStatus,
			ProductName:       row.ProductName,
			Quantity:          row.Quantity,
			Unit:              row.Unit,
			UnitPrice:         unitPrice,
			CreatedAt:         row.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:         row.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	totalPages := int(math.Ceil(float64(total) / float64(limit)))
	if total == 0 {
		totalPages = 0
	}
	return &LineRequestListOut{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *ContragentPunktLineRequestService) GetByID(contragentID, id uint) (*LineRequestDetailOut, error) {
	d, err := s.repo.GetDetail(contragentID, id)
	if err != nil {
		return nil, err
	}
	r := d.Request
	var punktIDs []uint
	punktIDs = append(punktIDs, r.PunktID)
	if d.Order.AssignedPunktID != nil {
		punktIDs = append(punktIDs, *d.Order.AssignedPunktID)
	}
	var agentIDs []uint
	if d.Order.AssignedAgentID != nil {
		agentIDs = append(agentIDs, *d.Order.AssignedAgentID)
	}
	punkts, err := s.embed.PunktsByIDs(punktIDs)
	if err != nil {
		return nil, err
	}
	agents, err := s.embed.AgentsByIDs(agentIDs)
	if err != nil {
		return nil, err
	}
	orderOut := &LineRequestOrderOut{
		ID:          d.Order.ID,
		Status:      d.Order.Status,
		TotalAmount: d.Order.TotalAmount,
	}
	if total, err := s.repo.SumOrderTotalForContragent(d.Order.ID, contragentID); err == nil {
		orderOut.TotalAmount = math.Round(total*100) / 100
	}
	if d.Order.AssignedPunktID != nil {
		orderOut.AssignedPunkt = orderembed.PunktPtr(punkts, *d.Order.AssignedPunktID)
	}
	if d.Order.AssignedAgentID != nil {
		orderOut.AssignedAgent = orderembed.AgentPtr(agents, *d.Order.AssignedAgentID)
	}
	unitPrice := d.Item.UnitPrice
	if d.Item.PunktContragentPayoutPercent != nil && d.Item.Quantity > 0 {
		linePaid := d.Item.UnitPrice * d.Item.Quantity * (*d.Item.PunktContragentPayoutPercent) / 100
		unitPrice = math.Round((linePaid/d.Item.Quantity)*100) / 100
	}
	return &LineRequestDetailOut{
		ID:                r.ID,
		OrderItemID:       r.OrderItemID,
		RoutingDistrictID: r.RoutingDistrictID,
		Status:            r.Status,
		Punkt:             orderembed.PunktPtr(punkts, r.PunktID),
		Order:             orderOut,
		ProductID:         d.Item.ProductID,
		ProductName:       d.Item.ProductName,
		Quantity:          d.Item.Quantity,
		Unit:              d.Item.Unit,
		UnitPrice:         unitPrice,
		CreatedAt:         r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:         r.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *ContragentPunktLineRequestService) Accept(contragentID, id uint) error {
	return s.repo.Transition(contragentID, id, []string{punktdomain.LineRequestStatusPending}, punktdomain.LineRequestStatusAccepted)
}

func (s *ContragentPunktLineRequestService) Preparing(contragentID, id uint) error {
	return s.repo.Transition(contragentID, id, []string{punktdomain.LineRequestStatusAccepted}, punktdomain.LineRequestStatusPreparing)
}

func (s *ContragentPunktLineRequestService) Deliver(contragentID, id uint) error {
	return s.repo.Transition(contragentID, id, []string{punktdomain.LineRequestStatusPreparing}, punktdomain.LineRequestStatusDelivered)
}
