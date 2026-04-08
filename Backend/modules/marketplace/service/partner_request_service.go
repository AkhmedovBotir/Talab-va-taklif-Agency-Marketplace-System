package service

import (
	"errors"
	"regexp"
	"strings"

	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/repository"
)

var (
	ErrPartnerCompanyNameRequired  = errors.New("kompaniya nomi majburiy")
	ErrPartnerINNInvalid           = errors.New("STIR (INN) 9 yoki 12 raqamdan iborat bo'lishi kerak")
	ErrPartnerMFORequired          = errors.New("MFO majburiy")
	ErrPartnerAccountRequired      = errors.New("hisob raqami majburiy")
	ErrPartnerActivityTypeRequired = errors.New("faoliyat turi majburiy")
	ErrPartnerLocationRequired     = errors.New("viloyat, tuman va mfy majburiy")
	ErrPartnerPhoneInvalid         = errors.New("telefon raqami formati noto'g'ri")
	ErrPartnerPhoneExists          = errors.New("telefon raqami tizimda allaqachon mavjud")
)

var (
	partnerPhoneRegex = regexp.MustCompile(`^\+998\d{9}$`)
	partnerINNRegex   = regexp.MustCompile(`^(\d{9}|\d{12})$`)
)

type CreatePartnerRequestInput struct {
	CompanyName    string `json:"company_name"`
	INN            string `json:"inn"`
	MFO            string `json:"mfo"`
	AccountNumber  string `json:"account_number"`
	ActivityTypeID uint   `json:"activity_type_id"`
	RegionID       uint   `json:"region_id"`
	DistrictID     uint   `json:"district_id"`
	MFYID          uint   `json:"mfy_id"`
	Phone          string `json:"phone"`
}

type PartnerRequestService interface {
	Create(marketplaceUserID uint, input CreatePartnerRequestInput) (*domain.PartnerRequest, error)
	List(marketplaceUserID uint, page, limit int) (*PaginatedPartnerRequests, error)
}

type partnerRequestService struct {
	repo repository.PartnerRequestRepository
}

type PaginatedPartnerRequests struct {
	Items      []domain.PartnerRequest `json:"items"`
	Total      int64                   `json:"total"`
	Page       int                     `json:"page"`
	Limit      int                     `json:"limit"`
	TotalPages int                     `json:"total_pages"`
}

func NewPartnerRequestService(repo repository.PartnerRequestRepository) PartnerRequestService {
	return &partnerRequestService{repo: repo}
}

func (s *partnerRequestService) Create(marketplaceUserID uint, input CreatePartnerRequestInput) (*domain.PartnerRequest, error) {
	input.CompanyName = strings.TrimSpace(input.CompanyName)
	input.INN = strings.TrimSpace(input.INN)
	input.MFO = strings.TrimSpace(input.MFO)
	input.AccountNumber = strings.TrimSpace(input.AccountNumber)
	input.Phone = strings.TrimSpace(input.Phone)

	if input.CompanyName == "" {
		return nil, ErrPartnerCompanyNameRequired
	}
	if !partnerINNRegex.MatchString(input.INN) {
		return nil, ErrPartnerINNInvalid
	}
	if input.MFO == "" {
		return nil, ErrPartnerMFORequired
	}
	if input.AccountNumber == "" {
		return nil, ErrPartnerAccountRequired
	}
	if input.ActivityTypeID == 0 {
		return nil, ErrPartnerActivityTypeRequired
	}
	if input.RegionID == 0 || input.DistrictID == 0 || input.MFYID == 0 {
		return nil, ErrPartnerLocationRequired
	}
	if !partnerPhoneRegex.MatchString(input.Phone) {
		return nil, ErrPartnerPhoneInvalid
	}
	exists, err := s.repo.PhoneExistsInSystem(input.Phone)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, ErrPartnerPhoneExists
	}

	row := &domain.PartnerRequest{
		MarketplaceUserID: marketplaceUserID,
		CompanyName:       input.CompanyName,
		INN:               input.INN,
		MFO:               input.MFO,
		AccountNumber:     input.AccountNumber,
		ActivityTypeID:    input.ActivityTypeID,
		RegionID:          input.RegionID,
		DistrictID:        input.DistrictID,
		MFYID:             input.MFYID,
		Phone:             input.Phone,
		Status:            domain.PartnerRequestStatusNew,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *partnerRequestService) List(marketplaceUserID uint, page, limit int) (*PaginatedPartnerRequests, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.ListByMarketplaceUser(marketplaceUserID, page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedPartnerRequests{
		Items:      rows,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}
