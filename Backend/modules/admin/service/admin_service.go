package service

import (
	"errors"
	"regexp"
	"strings"

	"backend/internal/pkg/security"
	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
)

var (
	ErrInvalidPhone      = errors.New("telefon raqami formati noto'g'ri")
	ErrInvalidRole       = errors.New("rol noto'g'ri")
	ErrInvalidStatus     = errors.New("status noto'g'ri")
	ErrPhoneExists       = errors.New("telefon raqami allaqachon mavjud")
	ErrUsernameExists    = errors.New("username allaqachon mavjud")
	ErrNotFound          = errors.New("admin topilmadi")
	ErrInvalidCredential = errors.New("username yoki parol noto'g'ri")
	ErrInactiveAdmin        = errors.New("admin faol emas")
	ErrGeneralAlreadyExists = errors.New("general admin allaqachon mavjud")
)

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

type AdminService interface {
	Create(input CreateAdminInput) (*domain.Admin, error)
	GetAll() ([]domain.Admin, error)
	GetPaginated(page, limit int) (*PaginatedAdmins, error)
	GetByID(id uint) (*domain.Admin, error)
	GetMe(id uint) (*domain.Admin, error)
	Update(id uint, input UpdateAdminInput) (*domain.Admin, error)
	UpdateStatus(id uint, status string) (*domain.Admin, error)
	Delete(id uint) error
	Login(username, password string) (*domain.Admin, error)
}

type adminService struct {
	repo repository.AdminRepository
}

func NewAdminService(repo repository.AdminRepository) AdminService {
	return &adminService{repo: repo}
}

type CreateAdminInput struct {
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	Phone       string   `json:"phone"`
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	Status      string   `json:"status"`
	Permissions []string `json:"permissions"` // ixtiyoriy; API nomlarni tekshirmaydi
}

type UpdateAdminInput struct {
	Name        string   `json:"name"`
	Role        string   `json:"role"`
	Phone       string   `json:"phone"`
	Username    string   `json:"username"`
	Password    string   `json:"password"`
	Status      string   `json:"status"`
	Permissions *[]string `json:"permissions"` // null/yo'q — o'zgartirilmaydi; [] — tozalash
}

type PaginatedAdmins struct {
	Items      []domain.Admin `json:"items"`
	Total      int64          `json:"total"`
	Page       int            `json:"page"`
	Limit      int            `json:"limit"`
	TotalPages int            `json:"total_pages"`
}

func (s *adminService) Create(input CreateAdminInput) (*domain.Admin, error) {
	input.normalize()
	if err := validateInput(input.Role, input.Status, input.Phone); err != nil {
		return nil, err
	}
	if err := s.ensureSingleGeneral(input.Role, 0); err != nil {
		return nil, err
	}
	if exists, err := s.repo.ExistsByPhone(input.Phone, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrPhoneExists
	}
	if exists, err := s.repo.ExistsByUsername(input.Username, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrUsernameExists
	}

	hashed, err := security.HashPassword(input.Password)
	if err != nil {
		return nil, err
	}

	admin := &domain.Admin{
		Name:        input.Name,
		Role:        input.Role,
		Phone:       input.Phone,
		Username:    input.Username,
		Password:    hashed,
		Status:      input.Status,
		Permissions: domain.SanitizePermissionList(input.Permissions),
	}

	if err = s.repo.Create(admin); err != nil {
		return nil, err
	}
	return ensurePermissionsSlice(admin), nil
}

func (s *adminService) GetAll() ([]domain.Admin, error) {
	return s.repo.GetAll()
}

func (s *adminService) GetPaginated(page, limit int) (*PaginatedAdmins, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	items, total, err := s.repo.GetPaginated(page, limit)
	if err != nil {
		return nil, err
	}

	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}

	for i := range items {
		items[i] = *ensurePermissionsSlice(&items[i])
	}

	return &PaginatedAdmins{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *adminService) GetByID(id uint) (*domain.Admin, error) {
	admin, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if admin == nil {
		return nil, ErrNotFound
	}
	return ensurePermissionsSlice(admin), nil
}

func (s *adminService) GetMe(id uint) (*domain.Admin, error) {
	return s.GetByID(id)
}

func (s *adminService) Update(id uint, input UpdateAdminInput) (*domain.Admin, error) {
	input.normalize()
	if err := validateInput(input.Role, input.Status, input.Phone); err != nil {
		return nil, err
	}
	if err := s.ensureSingleGeneral(input.Role, id); err != nil {
		return nil, err
	}

	admin, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if admin == nil {
		return nil, ErrNotFound
	}

	if exists, err := s.repo.ExistsByPhone(input.Phone, id); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrPhoneExists
	}
	if exists, err := s.repo.ExistsByUsername(input.Username, id); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrUsernameExists
	}

	admin.Name = input.Name
	admin.Role = input.Role
	admin.Phone = input.Phone
	admin.Username = input.Username
	admin.Status = input.Status
	if input.Permissions != nil {
		admin.Permissions = domain.SanitizePermissionList(*input.Permissions)
	}

	if input.Password != "" {
		hashed, hashErr := security.HashPassword(input.Password)
		if hashErr != nil {
			return nil, hashErr
		}
		admin.Password = hashed
	}

	if err = s.repo.Update(admin); err != nil {
		return nil, err
	}
	return ensurePermissionsSlice(admin), nil
}

func (s *adminService) Delete(id uint) error {
	admin, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if admin == nil {
		return ErrNotFound
	}
	return s.repo.Delete(id)
}

func (s *adminService) UpdateStatus(id uint, status string) (*domain.Admin, error) {
	status = strings.TrimSpace(status)
	if status != domain.StatusActive && status != domain.StatusInactive {
		return nil, ErrInvalidStatus
	}

	admin, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if admin == nil {
		return nil, ErrNotFound
	}

	admin.Status = status
	if err = s.repo.Update(admin); err != nil {
		return nil, err
	}
	return ensurePermissionsSlice(admin), nil
}

func (s *adminService) Login(username, password string) (*domain.Admin, error) {
	admin, err := s.repo.GetByUsername(strings.TrimSpace(username))
	if err != nil {
		return nil, err
	}
	if admin == nil {
		return nil, ErrInvalidCredential
	}
	if !security.CheckPassword(admin.Password, password) {
		return nil, ErrInvalidCredential
	}
	if admin.Status != domain.StatusActive {
		return nil, ErrInactiveAdmin
	}
	return ensurePermissionsSlice(admin), nil
}

func (s *adminService) ensureSingleGeneral(role string, exceptID uint) error {
	if role != domain.RoleGeneral {
		return nil
	}
	count, err := s.repo.CountByRole(domain.RoleGeneral, exceptID)
	if err != nil {
		return err
	}
	if count > 0 {
		return ErrGeneralAlreadyExists
	}
	return nil
}

func ensurePermissionsSlice(admin *domain.Admin) *domain.Admin {
	if admin == nil {
		return nil
	}
	if admin.Permissions == nil {
		admin.Permissions = []string{}
	}
	return admin
}

func validateInput(role, status, phone string) error {
	if role != domain.RoleGeneral && role != domain.RoleAdmin {
		return ErrInvalidRole
	}
	if status != domain.StatusActive && status != domain.StatusInactive {
		return ErrInvalidStatus
	}
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}
	return nil
}

func (i *CreateAdminInput) normalize() {
	i.Name = strings.TrimSpace(i.Name)
	i.Role = strings.TrimSpace(i.Role)
	i.Phone = strings.TrimSpace(i.Phone)
	i.Username = strings.TrimSpace(i.Username)
	i.Password = strings.TrimSpace(i.Password)
	i.Status = strings.TrimSpace(i.Status)
}

func (i *UpdateAdminInput) normalize() {
	i.Name = strings.TrimSpace(i.Name)
	i.Role = strings.TrimSpace(i.Role)
	i.Phone = strings.TrimSpace(i.Phone)
	i.Username = strings.TrimSpace(i.Username)
	i.Password = strings.TrimSpace(i.Password)
	i.Status = strings.TrimSpace(i.Status)
}
