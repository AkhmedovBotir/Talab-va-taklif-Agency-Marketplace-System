package service

import (
	"errors"
	"math"
	"sort"
	"time"

	coreRepo "backend/modules/core/repository"
	coreSvc "backend/modules/core/service"
	"backend/modules/punkts/repository"
)

var (
	ErrPunktKPIHistoryRange = errors.New("from va to noto'g'ri yoki oralig'i juda katta (max 366 kun)")
)

type PunktKPITodayData struct {
	DateUTC         string  `json:"date_utc"`
	AllocationNote  string  `json:"allocation_note"`
	PunktKPITotal   float64 `json:"punkt_kpi_total"`
	TotalKPIPool    float64 `json:"total_kpi_pool"`
	DeliveredOrders int     `json:"delivered_orders"`
	PaidTotalToday  float64 `json:"paid_total_today"`
	PayoutEntries   int64   `json:"payout_entries_today"`
	UnpaidToday     float64 `json:"unpaid_today"`
}

type PunktKPIHistoryDay struct {
	DateUTC         string  `json:"date_utc"`
	PunktKPIAccrued float64 `json:"punkt_kpi_accrued"`
	TotalKPIPool    float64 `json:"total_kpi_pool"`
	DeliveredOrders int     `json:"delivered_orders"`
	PaidTotal       float64 `json:"paid_total"`
	Unpaid          float64 `json:"unpaid"`
}

type PunktKPIHistoryOut struct {
	FromUTC string               `json:"from_utc"`
	ToUTC   string               `json:"to_utc"`
	Days    []PunktKPIHistoryDay `json:"days"`
}

type PunktKPIService struct {
	orderKPI *coreRepo.MarketplaceOrderKPIRepository
	payouts  *repository.PunktKPIPayoutRepository
}

func NewPunktKPIService(orderKPI *coreRepo.MarketplaceOrderKPIRepository, payouts *repository.PunktKPIPayoutRepository) *PunktKPIService {
	return &PunktKPIService{orderKPI: orderKPI, payouts: payouts}
}

func utcDayRange(t time.Time) (start, end time.Time) {
	y, m, d := t.UTC().Date()
	start = time.Date(y, m, d, 0, 0, 0, 0, time.UTC)
	end = start.Add(24 * time.Hour)
	return start, end
}

func sumPunktKPIFromBundles(bundles []coreRepo.OrderKPIBundle, alloc coreSvc.KPIAllocationBody) (punktSum, poolSum float64, orderCount int, err error) {
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
		punktSum += br.Punkt
		poolSum += br.TotalKpiPool
	}
	punktSum = math.Round(punktSum*100) / 100
	poolSum = math.Round(poolSum*100) / 100
	return punktSum, poolSum, orderCount, nil
}

func unpaidClamp(accrued, paid float64) float64 {
	u := math.Round((accrued-paid)*100) / 100
	if u < 0 {
		return 0
	}
	return u
}

const punktKPIAllocationNote = "Punkt hisoboti: KPI foizlari server tavsiyasi (recommended) bo‘yicha; integratsiya kaliti sozlamasi o‘zgarmaydi."

func (s *PunktKPIService) Today(punktID uint) (*PunktKPITodayData, error) {
	now := time.Now().UTC()
	start, end := utcDayRange(now)
	bundles, err := s.orderKPI.ListDeliveredOrderKPIBundlesForPunkt(punktID, start, end)
	if err != nil {
		return nil, err
	}
	alloc := coreSvc.RecommendedKPIAllocation()
	punktTotal, poolTotal, nOrders, err := sumPunktKPIFromBundles(bundles, alloc)
	if err != nil {
		return nil, err
	}
	paidSum, pCount, err := s.payouts.SumBetween(punktID, start, end)
	if err != nil {
		return nil, err
	}
	paidSum = math.Round(paidSum*100) / 100
	return &PunktKPITodayData{
		DateUTC:         start.Format("2006-01-02"),
		AllocationNote:  punktKPIAllocationNote,
		PunktKPITotal:   punktTotal,
		TotalKPIPool:    poolTotal,
		DeliveredOrders: nOrders,
		PaidTotalToday:  paidSum,
		PayoutEntries:   pCount,
		UnpaidToday:     unpaidClamp(punktTotal, paidSum),
	}, nil
}

func parseUTCDate(s string) (time.Time, error) {
	return time.ParseInLocation("2006-01-02", s, time.UTC)
}

func (s *PunktKPIService) History(punktID uint, fromStr, toStr string) (*PunktKPIHistoryOut, error) {
	fromDay, err := parseUTCDate(fromStr)
	if err != nil {
		return nil, ErrPunktKPIHistoryRange
	}
	toDay, err := parseUTCDate(toStr)
	if err != nil {
		return nil, ErrPunktKPIHistoryRange
	}
	if toDay.Before(fromDay) {
		return nil, ErrPunktKPIHistoryRange
	}
	span := int(toDay.Sub(fromDay).Hours()/24) + 1
	if span < 1 || span > 366 {
		return nil, ErrPunktKPIHistoryRange
	}
	start := time.Date(fromDay.Year(), fromDay.Month(), fromDay.Day(), 0, 0, 0, 0, time.UTC)
	end := time.Date(toDay.Year(), toDay.Month(), toDay.Day(), 0, 0, 0, 0, time.UTC).Add(24 * time.Hour)

	bundles, err := s.orderKPI.ListDeliveredOrderKPIBundlesForPunkt(punktID, start, end)
	if err != nil {
		return nil, err
	}
	payoutRows, err := s.payouts.ListBetween(punktID, start, end)
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

	out := make([]PunktKPIHistoryDay, 0, len(days))
	for _, d := range days {
		bd := dayBundles[d]
		punktAcc, poolAcc, nOrd, err := sumPunktKPIFromBundles(bd, alloc)
		if err != nil {
			return nil, err
		}
		paid := math.Round(paidByDay[d]*100) / 100
		out = append(out, PunktKPIHistoryDay{
			DateUTC:         d,
			PunktKPIAccrued: punktAcc,
			TotalKPIPool:    poolAcc,
			DeliveredOrders: nOrd,
			PaidTotal:       paid,
			Unpaid:          unpaidClamp(punktAcc, paid),
		})
	}

	return &PunktKPIHistoryOut{
		FromUTC: fromStr,
		ToUTC:   toStr,
		Days:    out,
	}, nil
}
