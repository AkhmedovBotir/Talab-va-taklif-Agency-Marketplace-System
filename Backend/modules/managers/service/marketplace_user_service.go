package service

import (
	"errors"

	"backend/modules/managers/repository"
	mpDomain "backend/modules/marketplace/domain"
)

var ErrMarketplaceUserNotFound = errors.New("marketplace user topilmadi")

type ManagerPaginatedMarketplaceUsers struct {
	Items      []mpDomain.User `json:"items"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}

type ManagerMarketplaceUserService interface {
	GetPaginatedByRegion(regionID uint, page, limit int, filter repository.ManagerMarketplaceUserFilter) (*ManagerPaginatedMarketplaceUsers, error)
	GetByIDInRegion(id, regionID uint) (*mpDomain.User, error)
}

type managerMarketplaceUserService struct {
	repo repository.ManagerMarketplaceUserRepository
}

func NewManagerMarketplaceUserService(repo repository.ManagerMarketplaceUserRepository) ManagerMarketplaceUserService {
	return &managerMarketplaceUserService{repo: repo}
}

func (s *managerMarketplaceUserService) GetPaginatedByRegion(regionID uint, page, limit int, filter repository.ManagerMarketplaceUserFilter) (*ManagerPaginatedMarketplaceUsers, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	items, total, err := s.repo.GetPaginatedByRegion(regionID, page, limit, filter)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	return &ManagerPaginatedMarketplaceUsers{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *managerMarketplaceUserService) GetByIDInRegion(id, regionID uint) (*mpDomain.User, error) {
	row, err := s.repo.GetByIDInRegion(id, regionID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrMarketplaceUserNotFound
	}
	return row, nil
}

