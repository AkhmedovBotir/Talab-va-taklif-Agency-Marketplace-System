package service

import (
	agentRepo "backend/modules/agents/repository"
	"errors"
	"math"
	"backend/modules/core/domain"
	"backend/modules/core/repository"
	punktRepo "backend/modules/punkts/repository"
	"sort"
	"strings"
	"time"
)

var (
	ErrIntegrationKPIReportRange    = errors.New("from va to noto'g'ri yoki oralig'i juda katta (max 366 kun)")
	ErrIntegrationKPIPayoutCategory   = errors.New("category: punkt, agent, manager, finance, delivery")
	ErrIntegrationKPIPayoutTargetRequired = errors.New("agent/punkt/manager uchun target_ids yoki select_all kerak")
	ErrIntegrationKPIPayoutTargetForbidden = errors.New("finance/delivery uchun target_ids yuborilmaydi")
)

const (
	KPICategoryPunkt    = "punkt"
	KPICategoryAgent    = "agent"
	KPICategoryManager  = "manager"
	KPICategoryFinance  = "finance"
	KPICategoryDelivery = "delivery"
)

func NormalizeKPICategory(s string) (string, bool) {
	c := strings.ToLower(strings.TrimSpace(s))
	switch c {
	case KPICategoryPunkt, KPICategoryAgent, KPICategoryManager, KPICategoryFinance, KPICategoryDelivery:
		return c, true
	default:
		return "", false
	}
}

type KPIAccrualTotals struct {
	TotalKPIPool float64 `json:"total_kpi_pool"`
	Punkt        float64 `json:"punkt"`
	Agent        float64 `json:"agent"`
	Manager      float64 `json:"manager"`
	Finance      float64 `json:"finance"`
	Delivery     float64 `json:"delivery"`
}

type IntegrationKPIAccrualReport struct {
	FromUTC          string            `json:"from_utc"`
	ToUTC            string            `json:"to_utc"`
	PunktID          *uint             `json:"punkt_id,omitempty"`
	AgentID          *uint             `json:"agent_id,omitempty"`
	ManagerID        *uint             `json:"manager_id,omitempty"`
	OrdersCount      int               `json:"orders_count"`
	AllocationSource string            `json:"allocation_source"`
	AllocationUsed   KPIAllocationBody `json:"allocation_used"`
	Accrued          KPIAccrualTotals  `json:"accrued"`
	Paid             KPIAccrualTotals  `json:"paid"`
	Unpaid           KPIAccrualTotals  `json:"unpaid"`
}

type IntegrationKPIRoleReport struct {
	Role             string  `json:"role"`
	FromUTC          string  `json:"from_utc"`
	ToUTC            string  `json:"to_utc"`
	PunktID          *uint   `json:"punkt_id,omitempty"`
	AgentID          *uint   `json:"agent_id,omitempty"`
	ManagerID        *uint   `json:"manager_id,omitempty"`
	OrdersCount      int     `json:"orders_count"`
	AllocationSource string  `json:"allocation_source"`
	Accrued          float64 `json:"accrued"`
	TotalKPIPool     float64 `json:"total_kpi_pool"`
	Paid             float64 `json:"paid"`
	Unpaid           float64 `json:"unpaid"`
	People           []IntegrationKPIRolePerson `json:"people"`
}

type IntegrationKPIRolePersonDay struct {
	DateUTC  string  `json:"date_utc"`
	Accrued  float64 `json:"accrued"`
	Paid     float64 `json:"paid"`
	Unpaid   float64 `json:"unpaid"`
}

type IntegrationKPIRolePerson struct {
	ID      uint                         `json:"id"`
	Name    string                       `json:"name"`
	Accrued float64                      `json:"accrued"`
	Paid    float64                      `json:"paid"`
	Unpaid  float64                      `json:"unpaid"`
	Days    []IntegrationKPIRolePersonDay `json:"days"`
}

type CreateIntegrationKPIPayoutInput struct {
	Category        string     `json:"category"`
	Amount          float64    `json:"amount"`
	TargetIDs       []uint     `json:"target_ids,omitempty"`
	PaidAt          *time.Time `json:"paid_at"`
	Note            string     `json:"note"`
	ForPeriodFrom   *string    `json:"for_period_from,omitempty"` // hisobot from_utc bilan bir xil
	ForPeriodTo     *string    `json:"for_period_to,omitempty"`   // hisobot to_utc bilan bir xil
}

type SettleIntegrationKPIPayoutInput struct {
	Category  string `json:"category"`
	TargetIDs []uint `json:"target_ids,omitempty"`
	SelectAll bool   `json:"select_all"`
	Note      string `json:"note"`
}

type SettleIntegrationKPIPayoutResult struct {
	Category        string    `json:"category"`
	PeriodFrom      string    `json:"period_from"`
	PeriodTo        string    `json:"period_to"`
	CreatedEntries  int       `json:"created_entries"`
	PaidTotal       float64   `json:"paid_total"`
	PaidAt          time.Time `json:"paid_at"`
	SelectedTargetIDs []uint  `json:"selected_target_ids,omitempty"`
}

type IntegrationKPIReportService struct {
	orders       *repository.MarketplaceOrderKPIRepository
	payouts      *repository.IntegrationKPIPayoutRepository
	agentPayouts *agentRepo.AgentKPIPayoutRepository
	punktPayouts *punktRepo.PunktKPIPayoutRepository
	alloc        IntegrationKPIAllocationService
}

func NewIntegrationKPIReportService(
	orders *repository.MarketplaceOrderKPIRepository,
	payouts *repository.IntegrationKPIPayoutRepository,
	agentPayouts *agentRepo.AgentKPIPayoutRepository,
	punktPayouts *punktRepo.PunktKPIPayoutRepository,
	alloc IntegrationKPIAllocationService,
) *IntegrationKPIReportService {
	return &IntegrationKPIReportService{
		orders:       orders,
		payouts:      payouts,
		agentPayouts: agentPayouts,
		punktPayouts: punktPayouts,
		alloc:        alloc,
	}
}

func (s *IntegrationKPIReportService) resolveAllocation(integrationKeyID uint) (KPIAllocationBody, string, error) {
	resp, err := s.alloc.Get(integrationKeyID)
	if err != nil {
		return KPIAllocationBody{}, "", err
	}
	alloc := RecommendedKPIAllocation()
	source := "recommended"
	if resp.Allocation != nil {
		alloc = *resp.Allocation
		source = "saved"
	}
	return alloc, source, nil
}

func round2(x float64) float64 {
	return math.Round(x*100) / 100
}

func kpiClampUnpaid(accrued, paid float64) float64 {
	return round2(math.Max(0, accrued-paid))
}

func formatInclusiveEndDate(endExclusive time.Time) string {
	return endExclusive.Add(-time.Nanosecond).UTC().Format("2006-01-02")
}

func (s *IntegrationKPIReportService) aggregateBundles(
	bundles []repository.OrderKPIBundle,
	alloc KPIAllocationBody,
	allocSource string,
) (tot KPIAccrualTotals, ordersCount int, err error) {
	ordersCount = len(bundles)
	for _, b := range bundles {
		if len(b.Lines) == 0 {
			continue
		}
		lines := make([]TransactionKPILine, len(b.Lines))
		for i, l := range b.Lines {
			lines[i] = TransactionKPILine{
				UnitSale:        l.UnitSale,
				UnitCost:        l.UnitCost,
				Quantity:        l.Quantity,
				KpiBonusPercent: l.KpiBonusPercent,
			}
		}
		br, e := BuildTransactionKPIBreakdown(lines, alloc, allocSource)
		if e != nil {
			return KPIAccrualTotals{}, 0, e
		}
		tot.Punkt += br.Punkt
		tot.Agent += br.Agent
		tot.Manager += br.Manager
		tot.Finance += br.Finance
		tot.Delivery += br.Delivery
		tot.TotalKPIPool += br.TotalKpiPool
	}
	tot.Punkt = round2(tot.Punkt)
	tot.Agent = round2(tot.Agent)
	tot.Manager = round2(tot.Manager)
	tot.Finance = round2(tot.Finance)
	tot.Delivery = round2(tot.Delivery)
	tot.TotalKPIPool = round2(tot.TotalKPIPool)
	return tot, ordersCount, nil
}

func accruedForCategory(t KPIAccrualTotals, cat string) float64 {
	switch cat {
	case KPICategoryPunkt:
		return t.Punkt
	case KPICategoryAgent:
		return t.Agent
	case KPICategoryManager:
		return t.Manager
	case KPICategoryFinance:
		return t.Finance
	case KPICategoryDelivery:
		return t.Delivery
	default:
		return 0
	}
}

func accruedFromBreakdown(br *TransactionKPIBreakdown, cat string) float64 {
	switch cat {
	case KPICategoryPunkt:
		return br.Punkt
	case KPICategoryAgent:
		return br.Agent
	case KPICategoryManager:
		return br.Manager
	case KPICategoryFinance:
		return br.Finance
	case KPICategoryDelivery:
		return br.Delivery
	default:
		return 0
	}
}

func unpaidTotals(acc, paid KPIAccrualTotals) KPIAccrualTotals {
	return KPIAccrualTotals{
		TotalKPIPool: kpiClampUnpaid(acc.TotalKPIPool, paid.TotalKPIPool),
		Punkt:        kpiClampUnpaid(acc.Punkt, paid.Punkt),
		Agent:        kpiClampUnpaid(acc.Agent, paid.Agent),
		Manager:      kpiClampUnpaid(acc.Manager, paid.Manager),
		Finance:      kpiClampUnpaid(acc.Finance, paid.Finance),
		Delivery:     kpiClampUnpaid(acc.Delivery, paid.Delivery),
	}
}

func reportPeriodKeys(start, end time.Time) (periodFrom, periodTo string) {
	return start.Format("2006-01-02"), formatInclusiveEndDate(end)
}

func (s *IntegrationKPIReportService) paidTotals(integrationKeyID uint, start, end time.Time, punktID, agentID, managerID *uint) (KPIAccrualTotals, error) {
	pf, pt := reportPeriodKeys(start, end)
	var out KPIAccrualTotals
	var err error
	out.Punkt, err = s.payouts.SumByCategoryForReport(integrationKeyID, KPICategoryPunkt, start, end, pf, pt, punktID)
	if err != nil {
		return KPIAccrualTotals{}, err
	}
	out.Agent, err = s.payouts.SumByCategoryForReport(integrationKeyID, KPICategoryAgent, start, end, pf, pt, agentID)
	if err != nil {
		return KPIAccrualTotals{}, err
	}
	out.Manager, err = s.payouts.SumByCategoryForReport(integrationKeyID, KPICategoryManager, start, end, pf, pt, managerID)
	if err != nil {
		return KPIAccrualTotals{}, err
	}
	out.Finance, err = s.payouts.SumByCategoryForReport(integrationKeyID, KPICategoryFinance, start, end, pf, pt, nil)
	if err != nil {
		return KPIAccrualTotals{}, err
	}
	out.Delivery, err = s.payouts.SumByCategoryForReport(integrationKeyID, KPICategoryDelivery, start, end, pf, pt, nil)
	if err != nil {
		return KPIAccrualTotals{}, err
	}
	out.Punkt = round2(out.Punkt)
	out.Agent = round2(out.Agent)
	out.Manager = round2(out.Manager)
	out.Finance = round2(out.Finance)
	out.Delivery = round2(out.Delivery)
	out.TotalKPIPool = round2(out.Punkt + out.Agent + out.Manager + out.Finance + out.Delivery)
	return out, nil
}

func (s *IntegrationKPIReportService) AccrualReport(
	integrationKeyID uint,
	start, end time.Time,
	punktID, agentID, managerID *uint,
) (*IntegrationKPIAccrualReport, error) {
	bundles, err := s.orders.ListDeliveredOrderKPIBundlesFiltered(start, end, punktID, agentID)
	if err != nil {
		return nil, err
	}
	alloc, src, err := s.resolveAllocation(integrationKeyID)
	if err != nil {
		return nil, err
	}
	acc, nOrd, err := s.aggregateBundles(bundles, alloc, src)
	if err != nil {
		return nil, err
	}
	paid, err := s.paidTotals(integrationKeyID, start, end, punktID, agentID, managerID)
	if err != nil {
		return nil, err
	}
	return &IntegrationKPIAccrualReport{
		FromUTC:          start.Format("2006-01-02"),
		ToUTC:            formatInclusiveEndDate(end),
		PunktID:          punktID,
		AgentID:          agentID,
		ManagerID:        managerID,
		OrdersCount:      nOrd,
		AllocationSource: src,
		AllocationUsed:   alloc,
		Accrued:          acc,
		Paid:             paid,
		Unpaid:           unpaidTotals(acc, paid),
	}, nil
}

func (s *IntegrationKPIReportService) RoleReport(
	integrationKeyID uint,
	category string,
	start, end time.Time,
	punktID, agentID, managerID *uint,
) (*IntegrationKPIRoleReport, error) {
	cat, ok := NormalizeKPICategory(category)
	if !ok {
		return nil, ErrIntegrationKPIPayoutCategory
	}
	bundles, err := s.orders.ListDeliveredOrderKPIBundlesFiltered(start, end, punktID, agentID)
	if err != nil {
		return nil, err
	}
	alloc, src, err := s.resolveAllocation(integrationKeyID)
	if err != nil {
		return nil, err
	}
	acc, nOrd, err := s.aggregateBundles(bundles, alloc, src)
	if err != nil {
		return nil, err
	}
	accrued := accruedForCategory(acc, cat)
	type agg struct {
		name string
		acc  float64
		paid float64
		dayAcc map[string]float64
	}
	per := make(map[uint]*agg)
	regionSet := make(map[uint]struct{})
	for _, b := range bundles {
		if b.SnapRegionID > 0 {
			regionSet[b.SnapRegionID] = struct{}{}
		}
	}
	regionIDs := make([]uint, 0, len(regionSet))
	for id := range regionSet {
		regionIDs = append(regionIDs, id)
	}
	managerByRegion, err := s.orders.ManagerByRegion(regionIDs, managerID)
	if err != nil {
		return nil, err
	}
	for _, b := range bundles {
		if len(b.Lines) == 0 {
			continue
		}
		lines := make([]TransactionKPILine, len(b.Lines))
		for i, l := range b.Lines {
			lines[i] = TransactionKPILine{
				UnitSale: l.UnitSale,
				UnitCost: l.UnitCost,
				Quantity: l.Quantity,
				KpiBonusPercent: l.KpiBonusPercent,
			}
		}
		br, e := BuildTransactionKPIBreakdown(lines, alloc, src)
		if e != nil {
			return nil, e
		}
		part := accruedFromBreakdown(br, cat)
		if part <= 0 {
			continue
		}
		var personID uint
		switch cat {
		case KPICategoryPunkt:
			if b.AssignedPunktID != nil {
				personID = *b.AssignedPunktID
			}
		case KPICategoryAgent:
			if b.AssignedAgentID != nil {
				personID = *b.AssignedAgentID
			}
		case KPICategoryManager:
			personID = managerByRegion[b.SnapRegionID]
		}
		if personID == 0 {
			continue
		}
		if cat == KPICategoryPunkt && punktID != nil && *punktID > 0 && personID != *punktID {
			continue
		}
		if cat == KPICategoryAgent && agentID != nil && *agentID > 0 && personID != *agentID {
			continue
		}
		if cat == KPICategoryManager && managerID != nil && *managerID > 0 && personID != *managerID {
			continue
		}
		row := per[personID]
		if row == nil {
			row = &agg{dayAcc: map[string]float64{}}
			per[personID] = row
		}
		day := b.UpdatedAt.UTC().Format("2006-01-02")
		row.acc = round2(row.acc + part)
		row.dayAcc[day] = round2(row.dayAcc[day] + part)
	}
	personIDs := make([]uint, 0, len(per))
	for id := range per {
		personIDs = append(personIDs, id)
	}
	nameMap, err := s.orders.RoleNamesByIDs(cat, personIDs)
	if err != nil {
		return nil, err
	}
	pf, pt := reportPeriodKeys(start, end)
	paidByDay, err := s.payouts.SumByTargetAndDay(integrationKeyID, cat, start, end, pf, pt, personIDs)
	if err != nil {
		return nil, err
	}
	people := make([]IntegrationKPIRolePerson, 0, len(personIDs))
	sort.Slice(personIDs, func(i, j int) bool { return personIDs[i] < personIDs[j] })
	totalPaid := 0.0
	for _, id := range personIDs {
		row := per[id]
		row.name = nameMap[id]
		daySet := make(map[string]struct{})
		for d := range row.dayAcc {
			daySet[d] = struct{}{}
		}
		if paidByDay[id] != nil {
			for d := range paidByDay[id] {
				daySet[d] = struct{}{}
			}
		}
		days := make([]IntegrationKPIRolePersonDay, 0, len(daySet))
		for d := range daySet {
			accD := round2(row.dayAcc[d])
			paidD := 0.0
			if paidByDay[id] != nil {
				paidD = round2(paidByDay[id][d])
			}
			days = append(days, IntegrationKPIRolePersonDay{
				DateUTC: d,
				Accrued: accD,
				Paid: paidD,
				Unpaid: kpiClampUnpaid(accD, paidD),
			})
			row.paid = round2(row.paid + paidD)
		}
		sort.Slice(days, func(i, j int) bool { return days[i].DateUTC < days[j].DateUTC })
		person := IntegrationKPIRolePerson{
			ID: id,
			Name: row.name,
			Accrued: row.acc,
			Paid: row.paid,
			Unpaid: kpiClampUnpaid(row.acc, row.paid),
			Days: days,
		}
		totalPaid = round2(totalPaid + row.paid)
		people = append(people, person)
	}
	paidSum := totalPaid
	return &IntegrationKPIRoleReport{
		Role:             cat,
		FromUTC:          start.Format("2006-01-02"),
		ToUTC:            formatInclusiveEndDate(end),
		PunktID:          punktID,
		AgentID:          agentID,
		ManagerID:        managerID,
		OrdersCount:      nOrd,
		AllocationSource: src,
		Accrued:          accrued,
		TotalKPIPool:     acc.TotalKPIPool,
		Paid:             paidSum,
		Unpaid:           kpiClampUnpaid(accrued, paidSum),
		People:           people,
	}, nil
}

func uniqueNonZeroIDs(ids []uint) []uint {
	seen := make(map[uint]struct{})
	out := make([]uint, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	sort.Slice(out, func(i, j int) bool { return out[i] < out[j] })
	return out
}

func (s *IntegrationKPIReportService) SettleUnpaid(
	integrationKeyID uint,
	start, end time.Time,
	in SettleIntegrationKPIPayoutInput,
) (*SettleIntegrationKPIPayoutResult, error) {
	cat, ok := NormalizeKPICategory(in.Category)
	if !ok {
		return nil, ErrIntegrationKPIPayoutCategory
	}
	pf, pt := reportPeriodKeys(start, end)
	now := time.Now().UTC()
	note := strings.TrimSpace(in.Note)

	if cat == KPICategoryFinance || cat == KPICategoryDelivery {
		if len(in.TargetIDs) > 0 {
			return nil, ErrIntegrationKPIPayoutTargetForbidden
		}
		rep, err := s.RoleReport(integrationKeyID, cat, start, end, nil, nil, nil)
		if err != nil {
			return nil, err
		}
		amt := round2(rep.Unpaid)
		created := 0
		if amt > 0 {
			row := &domain.IntegrationKPIPayout{
				IntegrationAPIKeyID: integrationKeyID,
				Category:            cat,
				Amount:              amt,
				PaidAt:              now,
				PeriodFrom:          &pf,
				PeriodTo:            &pt,
				Note:                note,
			}
			if err := s.payouts.CreateWithTargets(row, nil); err != nil {
				return nil, err
			}
			created = 1
		}
		return &SettleIntegrationKPIPayoutResult{
			Category: cat, PeriodFrom: pf, PeriodTo: pt, CreatedEntries: created, PaidTotal: amt, PaidAt: now,
		}, nil
	}

	rep, err := s.RoleReport(integrationKeyID, cat, start, end, nil, nil, nil)
	if err != nil {
		return nil, err
	}
	targetIDs := uniqueNonZeroIDs(in.TargetIDs)
	if !in.SelectAll && len(targetIDs) == 0 {
		return nil, ErrIntegrationKPIPayoutTargetRequired
	}
	eligible := make(map[uint]float64)
	for _, p := range rep.People {
		eligible[p.ID] = round2(p.Unpaid)
	}
	selected := targetIDs
	if in.SelectAll {
		selected = make([]uint, 0, len(rep.People))
		for _, p := range rep.People {
			selected = append(selected, p.ID)
		}
	}
	selected = uniqueNonZeroIDs(selected)
	created := 0
	total := 0.0
	for _, id := range selected {
		amt := eligible[id]
		if amt <= 0 {
			continue
		}
		row := &domain.IntegrationKPIPayout{
			IntegrationAPIKeyID: integrationKeyID,
			Category:            cat,
			Amount:              amt,
			PaidAt:              now,
			PeriodFrom:          &pf,
			PeriodTo:            &pt,
			Note:                note,
			TargetIDs:           []uint{id},
		}
		if err := s.payouts.CreateWithTargets(row, []uint{id}); err != nil {
			return nil, err
		}
		if err := s.mirrorToRolePayout(cat, id, amt, now, note); err != nil {
			return nil, err
		}
		created++
		total = round2(total + amt)
	}
	return &SettleIntegrationKPIPayoutResult{
		Category: cat, PeriodFrom: pf, PeriodTo: pt, CreatedEntries: created, PaidTotal: total, PaidAt: now, SelectedTargetIDs: selected,
	}, nil
}

func (s *IntegrationKPIReportService) mirrorToRolePayout(cat string, targetID uint, amount float64, paidAt time.Time, note string) error {
	switch cat {
	case KPICategoryAgent:
		if s.agentPayouts == nil {
			return nil
		}
		return s.agentPayouts.Create(targetID, amount, paidAt, note)
	case KPICategoryPunkt:
		if s.punktPayouts == nil {
			return nil
		}
		return s.punktPayouts.Create(targetID, amount, paidAt, note)
	default:
		return nil
	}
}
