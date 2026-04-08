package service

import (
	"errors"
	"regexp"
	"strings"

	"backend/internal/pkg/security"
	"backend/modules/localshops/domain"
	"backend/modules/localshops/repository"
)

var phoneRegexCourier = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrCourierNotFound        = errors.New("kuryer topilmadi")
	ErrCourierFirstNameRequired = errors.New("ism majburiy")
	ErrCourierLastNameRequired  = errors.New("familiya majburiy")
	ErrCourierPhoneInvalid    = errors.New("telefon raqami formati noto'g'ri")
	ErrCourierPhoneExists     = errors.New("telefon raqami allaqachon mavjud")
	ErrCourierPasswordTooShort = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
)

type CourierInput struct {
	FirstName            string `json:"first_name"`
	LastName             string `json:"last_name"`
	Phone                string `json:"phone"`
	Note                 string `json:"note"`
	Password             string `json:"password"`
	PasswordSetupAllowed *bool  `json:"password_setup_allowed"`
}

type PaginatedCouriers struct {
	Items      []domain.Courier `json:"items"`
	Total      int64            `json:"total"`
	Page       int              `json:"page"`
	Limit      int              `json:"limit"`
	TotalPages int              `json:"total_pages"`
}

type CourierService interface {
	Create(localShopID uint, input CourierInput) (*domain.Courier, error)
	GetPaginated(localShopID uint, page, limit int) (*PaginatedCouriers, error)
	GetByID(localShopID, id uint) (*domain.Courier, error)
	Update(localShopID, id uint, input CourierInput) (*domain.Courier, error)
	Delete(localShopID, id uint) error
}

type courierService struct {
	repo repository.CourierRepository
}

func NewCourierService(repo repository.CourierRepository) CourierService {
	return &courierService{repo: repo}
}

func (s *courierService) Create(localShopID uint, input CourierInput) (*domain.Courier, error) {
	input.normalize()
	if err := validateCourierInput(input); err != nil {
		return nil, err
	}
	if exists, err := s.repo.ExistsByPhone(localShopID, input.Phone, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrCourierPhoneExists
	}
	setupAllowed := true
	if input.PasswordSetupAllowed != nil {
		setupAllowed = *input.PasswordSetupAllowed
	}
	passwordHash := ""
	if input.Password != "" {
		hash, err := security.HashPassword(input.Password)
		if err != nil {
			return nil, err
		}
		passwordHash = hash
		setupAllowed = false
	}
	row := &domain.Courier{
		LocalShopID:          localShopID,
		FirstName:            input.FirstName,
		LastName:             input.LastName,
		Phone:                input.Phone,
		Note:                 input.Note,
		Password:             passwordHash,
		PasswordSetupAllowed: setupAllowed,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *courierService) GetPaginated(localShopID uint, page, limit int) (*PaginatedCouriers, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	items, total, err := s.repo.GetPaginated(localShopID, page, limit)
	if err != nil {
		return nil, err
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedCouriers{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *courierService) GetByID(localShopID, id uint) (*domain.Courier, error) {
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCourierNotFound
	}
	return row, nil
}

func (s *courierService) Update(localShopID, id uint, input CourierInput) (*domain.Courier, error) {
	input.normalize()
	if err := validateCourierInput(input); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCourierNotFound
	}
	if exists, err := s.repo.ExistsByPhone(localShopID, input.Phone, id); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrCourierPhoneExists
	}
	row.FirstName = input.FirstName
	row.LastName = input.LastName
	row.Phone = input.Phone
	row.Note = input.Note
	if input.PasswordSetupAllowed != nil {
		row.PasswordSetupAllowed = *input.PasswordSetupAllowed
	}
	if input.Password != "" {
		hash, err := security.HashPassword(input.Password)
		if err != nil {
			return nil, err
		}
		row.Password = hash
		row.PasswordSetupAllowed = false
	}
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *courierService) Delete(localShopID, id uint) error {
	row, err := s.repo.GetByID(localShopID, id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrCourierNotFound
	}
	return s.repo.Delete(localShopID, id)
}

func validateCourierInput(input CourierInput) error {
	if input.FirstName == "" {
		return ErrCourierFirstNameRequired
	}
	if input.LastName == "" {
		return ErrCourierLastNameRequired
	}
	if !phoneRegexCourier.MatchString(input.Phone) {
		return ErrCourierPhoneInvalid
	}
	if input.Password != "" && len(input.Password) < 6 {
		return ErrCourierPasswordTooShort
	}
	return nil
}

func (i *CourierInput) normalize() {
	i.FirstName = strings.TrimSpace(i.FirstName)
	i.LastName = strings.TrimSpace(i.LastName)
	i.Phone = strings.TrimSpace(i.Phone)
	i.Note = strings.TrimSpace(i.Note)
	i.Password = strings.TrimSpace(i.Password)
}
