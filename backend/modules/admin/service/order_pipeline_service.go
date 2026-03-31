package service

import (
	"backend/modules/admin/repository"
	mpdomain "backend/modules/marketplace/domain"
)

type OrderPipelineItem struct {
	ID                                   uint                     `json:"id"`
	Status                               string                   `json:"status"`
	TotalAmount                          float64                  `json:"total_amount"`
	UserID                               uint                     `json:"user_id"`
	AssignedPunktID                      *uint                    `json:"assigned_punkt_id,omitempty"`
	PunktAcceptanceStatus                string                   `json:"punkt_acceptance_status"`
	PunktCollectedAt                     string                   `json:"punkt_collected_at,omitempty"`
	PunktReadyAt                         string                   `json:"punkt_ready_at,omitempty"`
	AssignedAgentID                      *uint                    `json:"assigned_agent_id,omitempty"`
	AgentDeclaredPaymentToPunktAt        string                   `json:"agent_declared_payment_to_punkt_at,omitempty"`
	PunktConfirmedAgentPaymentAt         string                   `json:"punkt_confirmed_agent_payment_at,omitempty"`
	PunktPostPaymentDeliveredAt          string                   `json:"punkt_post_payment_delivered_at,omitempty"`
	PunktContragentRemainderHandedOverAt string                   `json:"punkt_contragent_remainder_handed_over_at,omitempty"`
	Items                                []OrderPipelineOrderItem `json:"items"`
	CurrentStage                         string                   `json:"current_stage"`
	CreatedAt                            string                   `json:"created_at"`
	UpdatedAt                            string                   `json:"updated_at"`
}

type OrderPipelineOrderItem struct {
	ID           uint    `json:"id"`
	ProductID    uint    `json:"product_id"`
	ContragentID uint    `json:"contragent_id"`
	ProductName  string  `json:"product_name"`
	UnitPrice    float64 `json:"unit_price"`
	Quantity     float64 `json:"quantity"`
	Unit         string  `json:"unit"`
	LineTotal    float64 `json:"line_total"`
}

type PaginatedPipelineItems struct {
	Items      []OrderPipelineItem `json:"items"`
	Total      int64               `json:"total"`
	Page       int                 `json:"page"`
	Limit      int                 `json:"limit"`
	TotalPages int                 `json:"total_pages"`
}

type PipelineOverview struct {
	MarketplaceCreated         int64 `json:"marketplace_created"`
	PunktInbox                 int64 `json:"punkt_inbox"`
	ContragentRequestsCreated  int64 `json:"contragent_requests_created"`
	PunktCollectedPending      int64 `json:"punkt_collected_pending"`
	PunktReadyPending          int64 `json:"punkt_ready_pending"`
	AgentAssignPending         int64 `json:"agent_assign_pending"`
	AgentPaymentPending        int64 `json:"agent_payment_pending"`
	PaymentConfirmPending      int64 `json:"payment_confirm_pending"`
	PostPaymentDeliveryPending int64 `json:"post_payment_delivery_pending"`
	RemainderHandoverPending   int64 `json:"remainder_handover_pending"`
	ReadyForAgentDeliver       int64 `json:"ready_for_agent_deliver"`
	Delivered                  int64 `json:"delivered"`
}

type OrderPipelineService interface {
	ListByStage(stage string, page, limit int) (*PaginatedPipelineItems, error)
	Overview() (*PipelineOverview, error)
}

type orderPipelineService struct {
	repo repository.OrderPipelineRepository
}

func NewOrderPipelineService(repo repository.OrderPipelineRepository) OrderPipelineService {
	return &orderPipelineService{repo: repo}
}

func (s *orderPipelineService) ListByStage(stage string, page, limit int) (*PaginatedPipelineItems, error) {
	rows, total, err := s.repo.ListByStage(stage, page, limit)
	if err != nil {
		return nil, err
	}
	items := make([]OrderPipelineItem, 0, len(rows))
	for i := range rows {
		r := &rows[i]
		var collected, ready, ap, pcp, ppd, rh string
		if r.PunktCollectedAt != nil {
			collected = r.PunktCollectedAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		if r.PunktReadyAt != nil {
			ready = r.PunktReadyAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		if r.AgentDeclaredPaymentToPunktAt != nil {
			ap = r.AgentDeclaredPaymentToPunktAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		if r.PunktConfirmedAgentPaymentAt != nil {
			pcp = r.PunktConfirmedAgentPaymentAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		if r.PunktPostPaymentDeliveredAt != nil {
			ppd = r.PunktPostPaymentDeliveredAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		if r.PunktContragentRemainderHandedOverAt != nil {
			rh = r.PunktContragentRemainderHandedOverAt.UTC().Format("2006-01-02T15:04:05Z07:00")
		}
		itemRows := make([]OrderPipelineOrderItem, 0, len(r.Items))
		for j := range r.Items {
			it := &r.Items[j]
			itemRows = append(itemRows, OrderPipelineOrderItem{
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
		items = append(items, OrderPipelineItem{
			ID:                                   r.ID,
			Status:                               r.Status,
			TotalAmount:                          r.TotalAmount,
			UserID:                               r.UserID,
			AssignedPunktID:                      r.AssignedPunktID,
			PunktAcceptanceStatus:                r.PunktAcceptanceStatus,
			PunktCollectedAt:                     collected,
			PunktReadyAt:                         ready,
			AssignedAgentID:                      r.AssignedAgentID,
			AgentDeclaredPaymentToPunktAt:        ap,
			PunktConfirmedAgentPaymentAt:         pcp,
			PunktPostPaymentDeliveredAt:          ppd,
			PunktContragentRemainderHandedOverAt: rh,
			Items:                                itemRows,
			CurrentStage:                         detectCurrentStage(r),
			CreatedAt:                            r.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:                            r.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	if limit < 1 {
		limit = 10
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	if page < 1 {
		page = 1
	}
	return &PaginatedPipelineItems{Items: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *orderPipelineService) Overview() (*PipelineOverview, error) {
	get := func(stage string) (int64, error) { return s.repo.CountByStage(stage) }
	out := &PipelineOverview{}
	var err error
	if out.MarketplaceCreated, err = get("marketplace_created"); err != nil {
		return nil, err
	}
	if out.PunktInbox, err = get("punkt_inbox"); err != nil {
		return nil, err
	}
	if out.ContragentRequestsCreated, err = get("contragent_requests_created"); err != nil {
		return nil, err
	}
	if out.PunktCollectedPending, err = get("punkt_collected_pending"); err != nil {
		return nil, err
	}
	if out.PunktReadyPending, err = get("punkt_ready_pending"); err != nil {
		return nil, err
	}
	if out.AgentAssignPending, err = get("agent_assign_pending"); err != nil {
		return nil, err
	}
	if out.AgentPaymentPending, err = get("agent_payment_pending"); err != nil {
		return nil, err
	}
	if out.PaymentConfirmPending, err = get("payment_confirm_pending"); err != nil {
		return nil, err
	}
	if out.PostPaymentDeliveryPending, err = get("post_payment_delivery_pending"); err != nil {
		return nil, err
	}
	if out.RemainderHandoverPending, err = get("remainder_handover_pending"); err != nil {
		return nil, err
	}
	if out.ReadyForAgentDeliver, err = get("ready_for_agent_deliver"); err != nil {
		return nil, err
	}
	if out.Delivered, err = get("delivered"); err != nil {
		return nil, err
	}
	return out, nil
}

func detectCurrentStage(r *mpdomain.Order) string {
	if r.Status == mpdomain.OrderStatusDelivered {
		return "delivered"
	}
	if r.Status == mpdomain.OrderStatusCancelled {
		return "cancelled"
	}
	if r.PunktContragentRemainderHandedOverAt != nil {
		return "ready_for_agent_deliver"
	}
	if r.PunktPostPaymentDeliveredAt != nil {
		return "remainder_handover_pending"
	}
	if r.PunktConfirmedAgentPaymentAt != nil {
		return "post_payment_delivery_pending"
	}
	if r.AgentDeclaredPaymentToPunktAt != nil {
		return "payment_confirm_pending"
	}
	if r.AssignedAgentID != nil {
		return "agent_payment_pending"
	}
	if r.PunktReadyAt != nil {
		return "agent_assign_pending"
	}
	if r.PunktCollectedAt != nil {
		return "punkt_ready_pending"
	}
	if r.PunktAcceptanceStatus == mpdomain.OrderPunktStatusContragentRequestsCreated {
		return "punkt_collected_pending"
	}
	if r.PunktAcceptanceStatus == mpdomain.OrderPunktStatusInbox {
		return "punkt_inbox"
	}
	return "marketplace_created"
}
