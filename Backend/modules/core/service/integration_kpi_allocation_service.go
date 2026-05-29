package service

import (
	"errors"
	"math"

	"backend/modules/core/domain"
	"backend/modules/core/repository"
)

var (
	ErrKPIAllocationInvalidSum      = errors.New("besh yo'nalish foizlari yig'indisi aynan 100 bo'lishi kerak")
	ErrKPIAllocationInvalidRange = errors.New("har bir foiz 0 dan 100 gacha butun son bo'lishi kerak")
	ErrKPIAllocationAlreadyExists = errors.New("KPI ajratish allaqachon yaratilgan")
	ErrKPIAllocationNotFound      = repository.ErrKPIAllocationNotFound

	ErrTransactionKPIEmptyLines      = errors.New("kamida bitta qator kerak")
	ErrTransactionKPIInvalidLine     = errors.New("qatorda quantity > 0 va narxlar to'g'ri raqam bo'lishi kerak")
	ErrTransactionKPIInvalidKpiBonus = errors.New("kpi_bonus_percent 0 dan 100 gacha bo'lishi kerak")
	ErrTransactionKPIOrderNotWired   = errors.New("buyurtma bo'yicha hisob ulanmagan")
	ErrOrderForKPI                   = repository.ErrOrderForKPINotFound
)

// KPIAllocationBody — API da bitta obyekt (massiv emas).
type KPIAllocationBody struct {
	Punkt    int `json:"punkt"`    // Punkt
	Agent    int `json:"agent"`    // Agent
	Manager  int `json:"manager"`  // Menejer
	Finance  int `json:"finance"`  // Moliya
	Delivery int `json:"delivery"` // Yetkazib berish
}

// RecommendedKPIAllocation — backend tavsiyasi (yig‘indisi 100).
func RecommendedKPIAllocation() KPIAllocationBody {
	return KPIAllocationBody{
		Punkt:    22,
		Agent:    22,
		Manager:  20,
		Finance:  18,
		Delivery: 18,
	}
}

func validateKPIBody(b KPIAllocationBody) error {
	parts := []int{b.Punkt, b.Agent, b.Manager, b.Finance, b.Delivery}
	sum := 0
	for _, p := range parts {
		if p < 0 || p > 100 {
			return ErrKPIAllocationInvalidRange
		}
		sum += p
	}
	if sum != 100 {
		return ErrKPIAllocationInvalidSum
	}
	return nil
}

type KPIAllocationGetResponse struct {
	Allocation  *KPIAllocationBody `json:"allocation"` // saqlanmagan bo‘lsa null
	Recommended KPIAllocationBody  `json:"recommended"`
}

type IntegrationKPIAllocationService interface {
	Get(integrationKeyID uint) (*KPIAllocationGetResponse, error)
	Create(integrationKeyID uint, body KPIAllocationBody) (*KPIAllocationBody, error)
	Update(integrationKeyID uint, body KPIAllocationBody) (*KPIAllocationBody, error)
	Delete(integrationKeyID uint) error
	ComputeTransactionKPI(integrationKeyID uint, lines []TransactionKPILine) (*TransactionKPIBreakdown, error)
	ComputeTransactionKPIByOrderID(integrationKeyID uint, orderID uint) (*TransactionKPIBreakdown, error)
}

type orderLinesForKPIReader interface {
	GetLinesForKPI(orderID uint) ([]repository.OrderLineForKPI, error)
}

type integrationKPIAllocationService struct {
	repo     repository.IntegrationKPIAllocationRepository
	orderKPI orderLinesForKPIReader
}

func NewIntegrationKPIAllocationService(repo repository.IntegrationKPIAllocationRepository, orderKPI orderLinesForKPIReader) IntegrationKPIAllocationService {
	return &integrationKPIAllocationService{repo: repo, orderKPI: orderKPI}
}

func domainToBody(row *domain.IntegrationKPIAllocation) KPIAllocationBody {
	return KPIAllocationBody{
		Punkt:    row.PunktPercent,
		Agent:    row.AgentPercent,
		Manager:  row.ManagerPercent,
		Finance:  row.FinancePercent,
		Delivery: row.DeliveryPercent,
	}
}

func (s *integrationKPIAllocationService) Get(integrationKeyID uint) (*KPIAllocationGetResponse, error) {
	row, err := s.repo.GetByIntegrationKeyID(integrationKeyID)
	if err != nil {
		return nil, err
	}
	out := &KPIAllocationGetResponse{Recommended: RecommendedKPIAllocation()}
	if row != nil {
		b := domainToBody(row)
		out.Allocation = &b
	}
	return out, nil
}

func (s *integrationKPIAllocationService) Create(integrationKeyID uint, body KPIAllocationBody) (*KPIAllocationBody, error) {
	if err := validateKPIBody(body); err != nil {
		return nil, err
	}
	exists, err := s.repo.GetByIntegrationKeyID(integrationKeyID)
	if err != nil {
		return nil, err
	}
	if exists != nil {
		return nil, ErrKPIAllocationAlreadyExists
	}
	row := &domain.IntegrationKPIAllocation{
		IntegrationAPIKeyID: integrationKeyID,
		PunktPercent:        body.Punkt,
		AgentPercent:        body.Agent,
		ManagerPercent:      body.Manager,
		FinancePercent:      body.Finance,
		DeliveryPercent:     body.Delivery,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return &body, nil
}

func (s *integrationKPIAllocationService) Update(integrationKeyID uint, body KPIAllocationBody) (*KPIAllocationBody, error) {
	if err := validateKPIBody(body); err != nil {
		return nil, err
	}
	if err := s.repo.UpdateByIntegrationKeyID(integrationKeyID, body.Punkt, body.Agent, body.Manager, body.Finance, body.Delivery); err != nil {
		return nil, err
	}
	return &body, nil
}

func (s *integrationKPIAllocationService) Delete(integrationKeyID uint) error {
	return s.repo.DeleteByIntegrationKeyID(integrationKeyID)
}

// TransactionKPILine — tranzaksiya / buyurtma qatori (asl va sotuv narxlari bilan).
type TransactionKPILine struct {
	UnitSale        float64 `json:"unit_sale"`         // sotuv (birlik)
	UnitCost        float64 `json:"unit_cost"`         // asl narx (birlik)
	Quantity        float64 `json:"quantity"`
	KpiBonusPercent float64 `json:"kpi_bonus_percent"` // margindan KPI havzasiga ajratiladigan foiz (kontragent)
}

type TransactionKPILineDetail struct {
	UnitSale        float64 `json:"unit_sale"`
	UnitCost        float64 `json:"unit_cost"`
	Quantity        float64 `json:"quantity"`
	KpiBonusPercent float64 `json:"kpi_bonus_percent"`
	LineSaleTotal   float64 `json:"line_sale_total"`
	LineCostTotal   float64 `json:"line_cost_total"`
	Margin          float64 `json:"margin"`
	KpiPoolFromLine float64 `json:"kpi_pool_from_line"`
}

// TransactionKPIBreakdown — KPI havzasi va undan Punkt/Agent/... bo‘yicha summalar.
type TransactionKPIBreakdown struct {
	Explanation string `json:"explanation"`

	TotalLineSale   float64 `json:"total_line_sale"`
	TotalLineCost   float64 `json:"total_line_cost"`
	TotalMargin     float64 `json:"total_margin"`
	TotalKpiPool    float64 `json:"total_kpi_pool"`
	AllocationUsed  KPIAllocationBody `json:"allocation_used"`
	AllocationSource string           `json:"allocation_source"` // "saved" | "recommended"

	Punkt    float64 `json:"punkt"`
	Agent    float64 `json:"agent"`
	Manager  float64 `json:"manager"`
	Finance  float64 `json:"finance"`
	Delivery float64 `json:"delivery"`

	Lines []TransactionKPILineDetail `json:"lines"`
}

func validateTransactionKPILine(l TransactionKPILine) error {
	if l.Quantity <= 0 || math.IsNaN(l.Quantity) || math.IsInf(l.Quantity, 0) {
		return ErrTransactionKPIInvalidLine
	}
	for _, x := range []float64{l.UnitSale, l.UnitCost, l.KpiBonusPercent} {
		if math.IsNaN(x) || math.IsInf(x, 0) {
			return ErrTransactionKPIInvalidLine
		}
	}
	if l.KpiBonusPercent < 0 || l.KpiBonusPercent > 100 {
		return ErrTransactionKPIInvalidKpiBonus
	}
	return nil
}

func (s *integrationKPIAllocationService) ComputeTransactionKPI(integrationKeyID uint, lines []TransactionKPILine) (*TransactionKPIBreakdown, error) {
	if len(lines) == 0 {
		return nil, ErrTransactionKPIEmptyLines
	}
	for _, ln := range lines {
		if err := validateTransactionKPILine(ln); err != nil {
			return nil, err
		}
	}
	return s.computeFromLines(integrationKeyID, lines)
}

func (s *integrationKPIAllocationService) ComputeTransactionKPIByOrderID(integrationKeyID uint, orderID uint) (*TransactionKPIBreakdown, error) {
	if s.orderKPI == nil {
		return nil, ErrTransactionKPIOrderNotWired
	}
	if orderID == 0 {
		return nil, ErrOrderForKPI
	}
	raw, err := s.orderKPI.GetLinesForKPI(orderID)
	if err != nil {
		return nil, err
	}
	if len(raw) == 0 {
		return nil, ErrTransactionKPIEmptyLines
	}
	lines := make([]TransactionKPILine, 0, len(raw))
	for _, r := range raw {
		lines = append(lines, TransactionKPILine{
			UnitSale:        r.UnitSale,
			UnitCost:        r.UnitCost,
			Quantity:        r.Quantity,
			KpiBonusPercent: r.KpiBonusPercent,
		})
	}
	for _, ln := range lines {
		if err := validateTransactionKPILine(ln); err != nil {
			return nil, err
		}
	}
	return s.computeFromLines(integrationKeyID, lines)
}

func (s *integrationKPIAllocationService) computeFromLines(integrationKeyID uint, lines []TransactionKPILine) (*TransactionKPIBreakdown, error) {
	allocResp, err := s.Get(integrationKeyID)
	if err != nil {
		return nil, err
	}
	alloc := RecommendedKPIAllocation()
	source := "recommended"
	if allocResp.Allocation != nil {
		alloc = *allocResp.Allocation
		source = "saved"
	}
	return BuildTransactionKPIBreakdown(lines, alloc, source)
}

// BuildTransactionKPIBreakdown — berilgan KPI foizlari va qatorlar bo‘yicha to‘liq ajratish (punkt ichki hisobotlari uchun).
func BuildTransactionKPIBreakdown(lines []TransactionKPILine, alloc KPIAllocationBody, allocationSource string) (*TransactionKPIBreakdown, error) {
	if err := validateKPIBody(alloc); err != nil {
		return nil, err
	}
	if len(lines) == 0 {
		return nil, ErrTransactionKPIEmptyLines
	}
	for _, ln := range lines {
		if err := validateTransactionKPILine(ln); err != nil {
			return nil, err
		}
	}

	details := make([]TransactionKPILineDetail, 0, len(lines))
	var totalSale, totalCost, totalMargin, totalPool float64
	for _, ln := range lines {
		lineSale := ln.UnitSale * ln.Quantity
		lineCost := ln.UnitCost * ln.Quantity
		margin := lineSale - lineCost
		if margin < 0 {
			margin = 0
		}
		poolL := margin * (ln.KpiBonusPercent / 100.0)
		details = append(details, TransactionKPILineDetail{
			UnitSale:        ln.UnitSale,
			UnitCost:        ln.UnitCost,
			Quantity:        ln.Quantity,
			KpiBonusPercent: ln.KpiBonusPercent,
			LineSaleTotal:   math.Round(lineSale*100) / 100,
			LineCostTotal:   math.Round(lineCost*100) / 100,
			Margin:          math.Round(margin*100) / 100,
			KpiPoolFromLine: math.Round(poolL*100) / 100,
		})
		totalSale += lineSale
		totalCost += lineCost
		totalMargin += margin
		totalPool += poolL
	}

	totalPool = math.Round(totalPool*100) / 100
	punkt, agent, mgr, fin, del := splitKPIPoolMoney(totalPool, alloc)

	return &TransactionKPIBreakdown{
		Explanation: "Margin = (sotuv - asl) * miqdor. KPI havzasi = margin * (kpi_bonus_percent/100). Bu summa KPI sozlamasidagi foizlar (punkt+agent+manager+finance+delivery=100) bo‘yicha ajratiladi.",
		TotalLineSale:    math.Round(totalSale*100) / 100,
		TotalLineCost:    math.Round(totalCost*100) / 100,
		TotalMargin:      math.Round(totalMargin*100) / 100,
		TotalKpiPool:     totalPool,
		AllocationUsed:   alloc,
		AllocationSource: allocationSource,
		Punkt:            punkt,
		Agent:            agent,
		Manager:          mgr,
		Finance:          fin,
		Delivery:         del,
		Lines:            details,
	}, nil
}
