package service

import (
	"time"

	"backend/modules/contragents/repository"
)

type ContragentStatsOut struct {
	FromUTC         string  `json:"from_utc,omitempty"`
	ToUTC           string  `json:"to_utc,omitempty"`
	OrdersCount     int64   `json:"orders_count"`
	LinesCount      int64   `json:"lines_count"`
	GrossSalesTotal float64 `json:"gross_sales_total"`
	CostTotal       float64 `json:"cost_total"`
	MarginTotal     float64 `json:"margin_total"`
	KPIPoolTotal    float64 `json:"kpi_pool_total"`
	PayoutTotal     float64 `json:"payout_total"`
}

type ContragentOrderSaleOut struct {
	OrderID         uint    `json:"order_id"`
	OrderStatus     string  `json:"order_status"`
	OrderUpdatedAt  string  `json:"order_updated_at"`
	LinesCount      int64   `json:"lines_count"`
	GrossSalesTotal float64 `json:"gross_sales_total"`
	CostTotal       float64 `json:"cost_total"`
	PayoutTotal     float64 `json:"payout_total"`
}

type PaginatedContragentOrderSales struct {
	Items      []ContragentOrderSaleOut `json:"items"`
	Total      int64                    `json:"total"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	TotalPages int                      `json:"total_pages"`
}

type ContragentAnalyticsService interface {
	Stats(contragentID uint, start, end *time.Time) (*ContragentStatsOut, error)
	OrderSales(contragentID uint, start, end *time.Time, page, limit int) (*PaginatedContragentOrderSales, error)
}

type contragentAnalyticsService struct {
	repo repository.ContragentAnalyticsRepository
}

func NewContragentAnalyticsService(repo repository.ContragentAnalyticsRepository) ContragentAnalyticsService {
	return &contragentAnalyticsService{repo: repo}
}

func (s *contragentAnalyticsService) Stats(contragentID uint, start, end *time.Time) (*ContragentStatsOut, error) {
	row, err := s.repo.GetSalesStats(contragentID, start, end)
	if err != nil {
		return nil, err
	}
	out := &ContragentStatsOut{
		OrdersCount:     row.OrdersCount,
		LinesCount:      row.LinesCount,
		GrossSalesTotal: row.GrossSalesTotal,
		CostTotal:       row.CostTotal,
		MarginTotal:     row.MarginTotal,
		KPIPoolTotal:    row.KpiPoolTotal,
		PayoutTotal:     row.PayoutTotal,
	}
	if start != nil {
		out.FromUTC = start.UTC().Format("2006-01-02")
	}
	if end != nil {
		out.ToUTC = end.Add(-time.Nanosecond).UTC().Format("2006-01-02")
	}
	return out, nil
}

func (s *contragentAnalyticsService) OrderSales(contragentID uint, start, end *time.Time, page, limit int) (*PaginatedContragentOrderSales, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.ListOrderSales(contragentID, start, end, page, limit)
	if err != nil {
		return nil, err
	}
	items := make([]ContragentOrderSaleOut, 0, len(rows))
	for _, r := range rows {
		items = append(items, ContragentOrderSaleOut{
			OrderID:         r.OrderID,
			OrderStatus:     r.OrderStatus,
			OrderUpdatedAt:  r.OrderUpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
			LinesCount:      r.LinesCount,
			GrossSalesTotal: r.GrossSalesTotal,
			CostTotal:       r.CostTotal,
			PayoutTotal:     r.PayoutTotal,
		})
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedContragentOrderSales{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
