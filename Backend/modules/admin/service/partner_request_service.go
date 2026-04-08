package service

import (
	"errors"
	"strings"
	"time"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
	mpdomain "backend/modules/marketplace/domain"
)

var (
	ErrPartnerRequestNotFound      = errors.New("hamkorlik so'rovi topilmadi")
	ErrPartnerRequestStateInvalid  = errors.New("joriy holatda bu amalni bajarib bo'lmaydi")
	ErrPartnerRequestPhoneRequired = errors.New("telefon raqami majburiy")
)

type PaginatedPartnerRequests struct {
	Items      []mpdomain.PartnerRequest `json:"items"`
	Total      int64                     `json:"total"`
	Page       int                       `json:"page"`
	Limit      int                       `json:"limit"`
	TotalPages int                       `json:"total_pages"`
}

type ConvertPartnerRequestInput struct {
	Phone *string `json:"phone"`
}

type PartnerRequestService interface {
	List(page, limit int) (*PaginatedPartnerRequests, error)
	GetByID(id uint) (*mpdomain.PartnerRequest, error)
	MarkContacted(id uint) (*mpdomain.PartnerRequest, error)
	MarkDeal(id uint, signed bool) (*mpdomain.PartnerRequest, error)
	ConvertToContragent(id uint, input ConvertPartnerRequestInput) (*domain.Contragent, error)
}

type partnerRequestService struct {
	repo           repository.PartnerRequestRepository
	contragentRepo repository.ContragentRepository
	regionRepo     repository.RegionRepository
	ctRepo         repository.ContragentTypeRepository
}

func NewPartnerRequestService(
	repo repository.PartnerRequestRepository,
	contragentRepo repository.ContragentRepository,
	regionRepo repository.RegionRepository,
	ctRepo repository.ContragentTypeRepository,
) PartnerRequestService {
	return &partnerRequestService{
		repo: repo, contragentRepo: contragentRepo, regionRepo: regionRepo, ctRepo: ctRepo,
	}
}

func (s *partnerRequestService) List(page, limit int) (*PaginatedPartnerRequests, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.List(page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedPartnerRequests{Items: rows, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *partnerRequestService) GetByID(id uint) (*mpdomain.PartnerRequest, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrPartnerRequestNotFound
	}
	return row, nil
}

func (s *partnerRequestService) MarkContacted(id uint) (*mpdomain.PartnerRequest, error) {
	row, err := s.mustGet(id)
	if err != nil {
		return nil, err
	}
	if row.Status == mpdomain.PartnerRequestStatusConverted || row.Status == mpdomain.PartnerRequestStatusDealNotSigned {
		return nil, ErrPartnerRequestStateInvalid
	}
	now := time.Now().UTC()
	row.ContactedAt = &now
	row.Status = mpdomain.PartnerRequestStatusContacted
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *partnerRequestService) MarkDeal(id uint, signed bool) (*mpdomain.PartnerRequest, error) {
	row, err := s.mustGet(id)
	if err != nil {
		return nil, err
	}
	if row.Status == mpdomain.PartnerRequestStatusConverted {
		return nil, ErrPartnerRequestStateInvalid
	}
	now := time.Now().UTC()
	row.DealMarkedAt = &now
	if signed {
		row.Status = mpdomain.PartnerRequestStatusDealSigned
	} else {
		row.Status = mpdomain.PartnerRequestStatusDealNotSigned
	}
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *partnerRequestService) ConvertToContragent(id uint, input ConvertPartnerRequestInput) (*domain.Contragent, error) {
	row, err := s.mustGet(id)
	if err != nil {
		return nil, err
	}
	if row.Status != mpdomain.PartnerRequestStatusDealSigned {
		return nil, ErrPartnerRequestStateInvalid
	}
	phone := row.Phone
	if input.Phone != nil {
		phone = strings.TrimSpace(*input.Phone)
	}
	if phone == "" {
		return nil, ErrPartnerRequestPhoneRequired
	}
	if err := validateContragentPhone(phone); err != nil {
		return nil, err
	}
	if exists, err := s.contragentRepo.ExistsByPhone(phone, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrContragentPhoneExists
	}
	if err := s.mustExistContragentType(row.ActivityTypeID); err != nil {
		return nil, err
	}
	if err := s.validateLocation(row.RegionID, row.DistrictID, row.MFYID); err != nil {
		return nil, err
	}
	contr := &domain.Contragent{
		Name:                 row.CompanyName,
		INN:                  row.INN,
		RegionID:             row.RegionID,
		DistrictID:           row.DistrictID,
		MFYID:                row.MFYID,
		Phone:                phone,
		ActivityTypeID:       row.ActivityTypeID,
		Status:               domain.StatusActive,
		PasswordSetupAllowed: true,
	}
	if err := s.contragentRepo.Create(contr); err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	row.ConvertedAt = &now
	row.Status = mpdomain.PartnerRequestStatusConverted
	row.ConvertedContragentID = &contr.ID
	row.Phone = phone
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return contr, nil
}

func (s *partnerRequestService) mustGet(id uint) (*mpdomain.PartnerRequest, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrPartnerRequestNotFound
	}
	return row, nil
}

func (s *partnerRequestService) mustExistContragentType(id uint) error {
	row, err := s.ctRepo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrContragentActivityTypeNotFound
	}
	return nil
}

func (s *partnerRequestService) validateLocation(regionID, districtID, mfyID uint) error {
	if regionID == 0 || districtID == 0 || mfyID == 0 {
		return ErrContragentLocationIDs
	}
	district, err := s.regionRepo.GetDistrictByID(districtID)
	if err != nil {
		return err
	}
	if district == nil || district.RegionID != regionID {
		return ErrContragentHierarchy
	}
	mfy, err := s.regionRepo.GetMFYByID(mfyID)
	if err != nil {
		return err
	}
	if mfy == nil || mfy.DistrictID != districtID {
		return ErrContragentHierarchy
	}
	return nil
}
