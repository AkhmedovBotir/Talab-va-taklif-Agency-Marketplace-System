package service

import (
	"errors"
	"sort"

	adminDomain "backend/modules/admin/domain"
	"backend/modules/localshops/repository"
)

var (
	ErrServiceAreaShopNotFound   = errors.New("maxalla do'koni topilmadi")
	ErrServiceAreaInvalidMFY     = errors.New("mfy_ids faqat o'z tumaningizdagi faol MFYlardan iborat bo'lishi kerak")
)

type ServiceAreaGetOut struct {
	DistrictID   uint                 `json:"district_id"`
	AvailableMFYs []adminDomain.MFY   `json:"available_mfys"`
	SelectedMFYIDs []uint             `json:"selected_mfy_ids"`
}

type ServiceAreaService interface {
	Get(localShopID uint) (*ServiceAreaGetOut, error)
	Save(localShopID uint, mfyIDs []uint) (*ServiceAreaGetOut, error)
}

type serviceAreaService struct {
	repo repository.ServiceAreaRepository
}

func NewServiceAreaService(repo repository.ServiceAreaRepository) ServiceAreaService {
	return &serviceAreaService{repo: repo}
}

func (s *serviceAreaService) Get(localShopID uint) (*ServiceAreaGetOut, error) {
	shop, err := s.repo.GetLocalShopByID(localShopID)
	if err != nil {
		return nil, err
	}
	if shop == nil {
		return nil, ErrServiceAreaShopNotFound
	}
	available, err := s.repo.ListAvailableMFYsByDistrict(shop.DistrictID)
	if err != nil {
		return nil, err
	}
	selected, err := s.repo.ListSelectedMFYIDs(localShopID)
	if err != nil {
		return nil, err
	}
	return &ServiceAreaGetOut{
		DistrictID:     shop.DistrictID,
		AvailableMFYs:  available,
		SelectedMFYIDs: selected,
	}, nil
}

func (s *serviceAreaService) Save(localShopID uint, mfyIDs []uint) (*ServiceAreaGetOut, error) {
	shop, err := s.repo.GetLocalShopByID(localShopID)
	if err != nil {
		return nil, err
	}
	if shop == nil {
		return nil, ErrServiceAreaShopNotFound
	}
	available, err := s.repo.ListAvailableMFYsByDistrict(shop.DistrictID)
	if err != nil {
		return nil, err
	}
	allowed := make(map[uint]struct{}, len(available))
	for _, m := range available {
		allowed[m.ID] = struct{}{}
	}
	uniq := make(map[uint]struct{})
	finalIDs := make([]uint, 0, len(mfyIDs))
	for _, id := range mfyIDs {
		if id == 0 {
			return nil, ErrServiceAreaInvalidMFY
		}
		if _, ok := allowed[id]; !ok {
			return nil, ErrServiceAreaInvalidMFY
		}
		if _, exists := uniq[id]; exists {
			continue
		}
		uniq[id] = struct{}{}
		finalIDs = append(finalIDs, id)
	}
	sort.Slice(finalIDs, func(i, j int) bool { return finalIDs[i] < finalIDs[j] })
	if err := s.repo.ReplaceSelected(localShopID, finalIDs); err != nil {
		return nil, err
	}
	return s.Get(localShopID)
}
