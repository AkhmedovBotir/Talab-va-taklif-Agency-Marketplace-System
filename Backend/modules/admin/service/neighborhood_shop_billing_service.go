package service

import (
	"errors"
	"strings"
	"time"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
)

var (
	ErrNeighborhoodShopBillingShopNotFound       = errors.New("maxalla do'koni topilmadi")
	ErrNeighborhoodShopSubscriptionNotFound      = errors.New("obuna topilmadi")
	ErrNeighborhoodShopBillingTypeInvalid        = errors.New("billing_type 'monthly' yoki 'free' bo'lishi kerak")
	ErrNeighborhoodShopFreeMonthsInvalid         = errors.New("bepul oylar soni kamida 1 bo'lishi kerak")
	ErrNeighborhoodShopMonthlyPriceInvalid       = errors.New("oylik narx manfiy bo'lmasligi kerak")
	ErrNeighborhoodShopConfigMonthlyPriceInvalid = errors.New("konfigdagi oylik narx manfiy bo'lmasligi kerak")
)

type NeighborhoodShopMonthlyConfigInput struct {
	MonthlyPriceUZS float64 `json:"monthly_price_uzs"`
	Currency        string  `json:"currency"`
}

type NeighborhoodShopSubscriptionInput struct {
	BillingType     string     `json:"billing_type"`
	MonthlyPriceUZS *float64   `json:"monthly_price_uzs"`
	FreeMonths      int        `json:"free_months"`
	PeriodStartAt   *time.Time `json:"period_start_at"`
}

type NeighborhoodShopMonthlyConfigView struct {
	ID              uint      `json:"id"`
	MonthlyPriceUZS float64   `json:"monthly_price_uzs"`
	Currency        string    `json:"currency"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type NeighborhoodShopSubscriptionView struct {
	ID                       uint      `json:"id"`
	NeighborhoodShopID       uint      `json:"neighborhood_shop_id"`
	BillingType              string    `json:"billing_type"`
	MonthlyPriceUZS          *float64  `json:"monthly_price_uzs,omitempty"`
	FreeMonths               int       `json:"free_months"`
	PeriodStartAt            time.Time `json:"period_start_at"`
	PeriodEndAt              time.Time `json:"period_end_at"`
	ConfigMonthlyPriceUZS    float64   `json:"config_monthly_price_uzs"`
	EffectiveMonthlyPriceUZS float64   `json:"effective_monthly_price_uzs"`
	IsInFreePeriod           bool      `json:"is_in_free_period"`
	IsPeriodActive           bool      `json:"is_period_active"`
	CreatedAt                time.Time `json:"created_at"`
	UpdatedAt                time.Time `json:"updated_at"`
}

const (
	ServiceAccessReasonActive           = "active"
	ServiceAccessReasonShopInactive     = "shop_inactive"
	ServiceAccessReasonNoSubscription   = "no_subscription"
	ServiceAccessReasonPeriodNotStarted = "period_not_started"
	ServiceAccessReasonPeriodExpired    = "period_expired"
)

// NeighborhoodShopServiceAccess — maxalla do'koni ilovasi uchun xizmatga ruxsat holati.
type NeighborhoodShopServiceAccess struct {
	CanOperate     bool       `json:"can_operate"`
	Message        string     `json:"message"`
	Reason         string     `json:"reason"`
	BillingType    string     `json:"billing_type,omitempty"`
	FreeMonths     int        `json:"free_months,omitempty"`
	PeriodStartAt  *time.Time `json:"period_start_at,omitempty"`
	PeriodEndAt    *time.Time `json:"period_end_at,omitempty"`
	IsInFreePeriod bool       `json:"is_in_free_period,omitempty"`
}

type NeighborhoodShopBillingService interface {
	GetMonthlyConfig() (*NeighborhoodShopMonthlyConfigView, error)
	UpdateMonthlyConfig(input NeighborhoodShopMonthlyConfigInput) (*NeighborhoodShopMonthlyConfigView, error)
	GetSubscription(shopID uint) (*NeighborhoodShopSubscriptionView, error)
	UpsertSubscription(shopID uint, input NeighborhoodShopSubscriptionInput) (*NeighborhoodShopSubscriptionView, error)
	EvaluateServiceAccess(shopID uint) (*NeighborhoodShopServiceAccess, error)
}

type neighborhoodShopBillingService struct {
	repo repository.NeighborhoodShopBillingRepository
}

func NewNeighborhoodShopBillingService(repo repository.NeighborhoodShopBillingRepository) NeighborhoodShopBillingService {
	return &neighborhoodShopBillingService{repo: repo}
}

func (s *neighborhoodShopBillingService) GetMonthlyConfig() (*NeighborhoodShopMonthlyConfigView, error) {
	row, err := s.repo.GetMonthlyConfig()
	if err != nil {
		return nil, err
	}
	return toMonthlyConfigView(row), nil
}

func (s *neighborhoodShopBillingService) UpdateMonthlyConfig(input NeighborhoodShopMonthlyConfigInput) (*NeighborhoodShopMonthlyConfigView, error) {
	if input.MonthlyPriceUZS < 0 {
		return nil, ErrNeighborhoodShopConfigMonthlyPriceInvalid
	}
	row, err := s.repo.GetMonthlyConfig()
	if err != nil {
		return nil, err
	}
	row.MonthlyPriceUZS = input.MonthlyPriceUZS
	if cur := strings.TrimSpace(strings.ToUpper(input.Currency)); cur != "" {
		row.Currency = cur
	}
	if err = s.repo.SaveMonthlyConfig(row); err != nil {
		return nil, err
	}
	return toMonthlyConfigView(row), nil
}

func (s *neighborhoodShopBillingService) GetSubscription(shopID uint) (*NeighborhoodShopSubscriptionView, error) {
	exists, err := s.repo.ShopExists(shopID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNeighborhoodShopBillingShopNotFound
	}
	sub, err := s.repo.GetSubscriptionByShopID(shopID)
	if err != nil {
		return nil, err
	}
	if sub == nil {
		return nil, ErrNeighborhoodShopSubscriptionNotFound
	}
	return s.toSubscriptionView(sub)
}

func (s *neighborhoodShopBillingService) UpsertSubscription(shopID uint, input NeighborhoodShopSubscriptionInput) (*NeighborhoodShopSubscriptionView, error) {
	exists, err := s.repo.ShopExists(shopID)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, ErrNeighborhoodShopBillingShopNotFound
	}

	billingType := strings.TrimSpace(strings.ToLower(input.BillingType))
	switch billingType {
	case domain.NeighborhoodShopBillingTypeMonthly, domain.NeighborhoodShopBillingTypeFree:
	default:
		return nil, ErrNeighborhoodShopBillingTypeInvalid
	}

	start := time.Now().UTC()
	if input.PeriodStartAt != nil {
		start = input.PeriodStartAt.UTC()
	}

	var periodEnd time.Time
	var monthlyOverride *float64
	freeMonths := 0

	switch billingType {
	case domain.NeighborhoodShopBillingTypeMonthly:
		if input.MonthlyPriceUZS != nil {
			if *input.MonthlyPriceUZS < 0 {
				return nil, ErrNeighborhoodShopMonthlyPriceInvalid
			}
			v := *input.MonthlyPriceUZS
			monthlyOverride = &v
		}
		periodEnd = start.AddDate(0, 1, 0)
	case domain.NeighborhoodShopBillingTypeFree:
		if input.FreeMonths < 1 {
			return nil, ErrNeighborhoodShopFreeMonthsInvalid
		}
		freeMonths = input.FreeMonths
		periodEnd = start.AddDate(0, freeMonths, 0)
	}

	sub, err := s.repo.GetSubscriptionByShopID(shopID)
	if err != nil {
		return nil, err
	}
	if sub == nil {
		sub = &domain.NeighborhoodShopSubscription{NeighborhoodShopID: shopID}
	}
	sub.BillingType = billingType
	sub.MonthlyPriceUZS = monthlyOverride
	sub.FreeMonths = freeMonths
	sub.PeriodStartAt = start
	sub.PeriodEndAt = periodEnd

	if err = s.repo.SaveSubscription(sub); err != nil {
		return nil, err
	}
	return s.toSubscriptionView(sub)
}

func (s *neighborhoodShopBillingService) toSubscriptionView(sub *domain.NeighborhoodShopSubscription) (*NeighborhoodShopSubscriptionView, error) {
	cfg, err := s.repo.GetMonthlyConfig()
	if err != nil {
		return nil, err
	}
	effective := cfg.MonthlyPriceUZS
	if sub.MonthlyPriceUZS != nil {
		effective = *sub.MonthlyPriceUZS
	}
	now := time.Now().UTC()
	isFree := sub.BillingType == domain.NeighborhoodShopBillingTypeFree
	inFree := isFree && !now.Before(sub.PeriodStartAt) && now.Before(sub.PeriodEndAt)
	active := !now.Before(sub.PeriodStartAt) && now.Before(sub.PeriodEndAt)

	return &NeighborhoodShopSubscriptionView{
		ID:                       sub.ID,
		NeighborhoodShopID:       sub.NeighborhoodShopID,
		BillingType:              sub.BillingType,
		MonthlyPriceUZS:          sub.MonthlyPriceUZS,
		FreeMonths:               sub.FreeMonths,
		PeriodStartAt:            sub.PeriodStartAt,
		PeriodEndAt:              sub.PeriodEndAt,
		ConfigMonthlyPriceUZS:    cfg.MonthlyPriceUZS,
		EffectiveMonthlyPriceUZS: effective,
		IsInFreePeriod:           inFree,
		IsPeriodActive:           active,
		CreatedAt:                sub.CreatedAt,
		UpdatedAt:                sub.UpdatedAt,
	}, nil
}

func (s *neighborhoodShopBillingService) EvaluateServiceAccess(shopID uint) (*NeighborhoodShopServiceAccess, error) {
	shop, err := s.repo.GetShopByID(shopID)
	if err != nil {
		return nil, err
	}
	if shop == nil {
		return nil, ErrNeighborhoodShopBillingShopNotFound
	}
	if strings.ToLower(strings.TrimSpace(shop.Status)) != domain.StatusActive {
		return &NeighborhoodShopServiceAccess{
			CanOperate: false,
			Message:    "Do'kon faol emas. Admin bilan bog'laning.",
			Reason:     ServiceAccessReasonShopInactive,
		}, nil
	}

	sub, err := s.repo.GetSubscriptionByShopID(shopID)
	if err != nil {
		return nil, err
	}
	if sub == nil {
		return &NeighborhoodShopServiceAccess{
			CanOperate: false,
			Message:    "Xizmat uchun obuna berilmagan. Admin bilan bog'laning.",
			Reason:     ServiceAccessReasonNoSubscription,
		}, nil
	}

	start := sub.PeriodStartAt.UTC()
	end := sub.PeriodEndAt.UTC()
	now := time.Now().UTC()
	periods := &NeighborhoodShopServiceAccess{
		BillingType:   sub.BillingType,
		FreeMonths:    sub.FreeMonths,
		PeriodStartAt: &start,
		PeriodEndAt:   &end,
	}
	if sub.BillingType == domain.NeighborhoodShopBillingTypeFree {
		periods.IsInFreePeriod = !now.Before(start) && now.Before(end)
	}

	if now.Before(start) {
		periods.CanOperate = false
		periods.Message = "Xizmat boshlanish sanasi hali kelmagan."
		periods.Reason = ServiceAccessReasonPeriodNotStarted
		return periods, nil
	}
	if !now.Before(end) {
		periods.CanOperate = false
		periods.Message = "Xizmat muddati tugagan. Davom etish uchun admin bilan bog'laning."
		periods.Reason = ServiceAccessReasonPeriodExpired
		return periods, nil
	}

	periods.CanOperate = true
	periods.Reason = ServiceAccessReasonActive
	if sub.BillingType == domain.NeighborhoodShopBillingTypeFree {
		periods.Message = "Bepul xizmat muddati faol."
	} else {
		periods.Message = "Oylik xizmat muddati faol."
	}
	return periods, nil
}

func toMonthlyConfigView(row *domain.NeighborhoodShopMonthlyConfig) *NeighborhoodShopMonthlyConfigView {
	return &NeighborhoodShopMonthlyConfigView{
		ID:              row.ID,
		MonthlyPriceUZS: row.MonthlyPriceUZS,
		Currency:        row.Currency,
		CreatedAt:       row.CreatedAt,
		UpdatedAt:       row.UpdatedAt,
	}
}
