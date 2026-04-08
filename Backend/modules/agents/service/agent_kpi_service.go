package service

import (
	"errors"
	"math"
	"sort"
	"time"

	"backend/modules/agents/repository"
	coreRepo "backend/modules/core/repository"
	coreSvc "backend/modules/core/service"
)

var ErrAgentKPIHistoryRange = errors.New("from va to noto'g'ri yoki oralig'i juda katta (max 366 kun)")

type AgentKPITodayData struct {
	DateUTC          string  `json:"date_utc"`
	AllocationNote   string  `json:"allocation_note"`
	AgentKPITotal    float64 `json:"agent_kpi_total"`
	TotalKPIPool     float64 `json:"total_kpi_pool"`
	DeliveredOrders  int     `json:"delivered_orders"`
	PaidTotalToday   float64 `json:"paid_total_today"`
	PayoutEntries    int64   `json:"payout_entries_today"`
	UnpaidToday      float64 `json:"unpaid_today"`
}

type AgentKPIHistoryDay struct {
	DateUTC         string  `json:"date_utc"`
	AgentKPIAccrued float64 `json:"agent_kpi_accrued"`
	TotalKPIPool    float64 `json:"total_kpi_pool"`
	DeliveredOrders int     `json:"delivered_orders"`
	PaidTotal       float64 `json:"paid_total"`
	Unpaid          float64 `json:"unpaid"`
}

type AgentKPIHistoryOut struct {
	FromUTC string               `json:"from_utc"`
	ToUTC   string               `json:"to_utc"`
	Days    []AgentKPIHistoryDay `json:"days"`
}

type AgentKPIService struct {
	orderKPI *coreRepo.MarketplaceOrderKPIRepository
	payouts  *repository.AgentKPIPayoutRepository
}

func NewAgentKPIService(orderKPI *coreRepo.MarketplaceOrderKPIRepository, payouts *repository.AgentKPIPayoutRepository) *AgentKPIService {
	return &AgentKPIService{orderKPI: orderKPI, payouts: payouts}
}

func agentUtcDayRange(t time.Time) (start, end time.Time) {
	y, m, d := t.UTC().Date()
	start = time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	end = start.Add(24 * time.Hour)
	return start, end
}

func sumAgentKPIFromBundles(bundles []coreRepo.OrderKPIBundle, alloc coreSvc.KPIAllocationBody) (agentSum, poolSum float64, orderCount int, err error) {
	for _, b := range bundles {
		orderCount++
		if len(b.Lines) == 0 {
			continue
		}
		lines := make([]coreSvc.TransactionKPILine, len(b.Lines))
		for i, l := range b.Lines {
			lines[i] = coreSvc.TransactionKPILine{
				UnitSale:        l.UnitSale,
				UnitCost:        l.UnitCost,
				Quantity:        l.Quantity,
				KpiBonusPercent: l.KpiBonusPercent,
			}
		}
		br, e := coreSvc.BuildTransactionKPIBreakdown(lines, alloc, "recommended")
		if e != nil {
			return 0, 0, 0, e
		}
		agentSum += br.Agent
		poolSum += br.TotalKpiPool
	}
	agentSum = math.Round(agentSum*100) / 100
	poolSum = math.Round(poolSum*100) / 100
	return agentSum, poolSum, orderCount, nil
}

func agentUnpaidClamp(accrued, paid float64) float64 {
	u := math.Round((accrued-paid)*100) / 100
	if u < 0 {
		return 0
	}
	return u
}

const agentKPIAllocationNote = "Agent hisoboti: KPI foizlari server tavsiyasi (recommended) bo‘yicha."

func (s *AgentKPIService) Today(agentID uint) (*AgentKPITodayData, error) {
	now := time.Now().UTC()
	start, end := agentUtcDayRange(now)
	bundles, err := s.orderKPI.ListDeliveredOrderKPIBundlesForAgent(agentID, start, end)
	if err != nil {
		return nil, err
	}
	alloc := coreSvc.RecommendedKPIAllocation()
	agentTotal, poolTotal, nOrders, err := sumAgentKPIFromBundles(bundles, alloc)
	if err != nil {
		return nil, err
	}
	paidSum, pCount, err := s.payouts.SumBetween(agentID, start, end)
	if err != nil {
		return nil, err
	}
	paidSum = math.Round(paidSum*100) / 100
	return &AgentKPITodayData{
		DateUTC:         start.Format("2006-01-02"),
		AllocationNote:  agentKPIAllocationNote,
		AgentKPITotal:   agentTotal,
		TotalKPIPool:    poolTotal,
		DeliveredOrders: nOrders,
		PaidTotalToday:  paidSum,
		PayoutEntries:   pCount,
		UnpaidToday:     agentUnpaidClamp(agentTotal, paidSum),
	}, nil
}

func agentParseUTCDate(s string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02", s, time.UTC)
}

func (s *AgentKPIService) History(agentID uint, fromStr, toStr string) (*AgentKPIHistoryOut, error) {
	fromDay, err := agentParseUTCDate(fromStr)
	if err != nil {
		return nil, ErrAgentKPIHistoryRange
	}
	toDay, err := agentParseUTCDate(toStr)
	if err != nil {
		return nil, ErrAgentKPIHistoryRange
	}
	if toDay.Before(fromDay) {
		return nil, ErrAgentKPIHistoryRange
	}
	span := int(toDay.Sub(fromDay).Hours()/24) + 1
	if span < 1 || span > 366 {
		return nil, ErrAgentKPIHistoryRange
	}
	start := time.Date(fromDay.Year(), fromDay.Month(), fromDay.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(toDay.Year(), toDay.Month(), toDay.Day(), 0, 0, 0, 0, time.UTC).Add(24 * time.Hour)

	bundles, err := s.orderKPI.ListDeliveredOrderKPIBundlesForAgent(agentID, start, end)
	if err != nil {
		return nil, err
	}
	payoutRows, err := s.payouts.ListBetween(agentID, start, end)
	if err != nil {
		return nil, err
	}

	alloc := coreSvc.RecommendedKPIAllocation()
	dayBundles := make(map[string][]coreRepo.OrderKPIBundle)
	for _, b := range bundles {
		d := b.UpdatedAt.UTC().Format("2006-01-02")
		dayBundles[d] = append(dayBundles[d], b)
	}
	paidByDay := make(map[string]float64)
	for _, p := range payoutRows {
		d := p.PaidAt.UTC().Format("2006-01-02")
		paidByDay[d] += p.Amount
	}

	daySet := make(map[string]struct{})
	for d := range dayBundles {
		daySet[d] = struct{}{}
	}
	for d := range paidByDay {
		daySet[d] = struct{}{}
	}
	days := make([]string, 0, len(daySet))
	for d := range daySet {
		days = append(days, d)
	}
	sort.Strings(days)

	out := make([]AgentKPIHistoryDay, 0, len(days))
	for _, d := range days {
		bd := dayBundles[d]
		agentAcc, poolAcc, nOrd, err := sumAgentKPIFromBundles(bd, alloc)
		if err != nil {
			return nil, err
		}
		paid := math.Round(paidByDay[d]*100) / 100
		out = append(out, AgentKPIHistoryDay{
			DateUTC:         d,
			AgentKPIAccrued: agentAcc,
			TotalKPIPool:    poolAcc,
			DeliveredOrders: nOrd,
			PaidTotal:       paid,
			Unpaid:          agentUnpaidClamp(agentAcc, paid),
		})
	}

	return &AgentKPIHistoryOut{
		FromUTC: fromStr,
		ToUTC:   toStr,
		Days:    out,
	}, nil
}
