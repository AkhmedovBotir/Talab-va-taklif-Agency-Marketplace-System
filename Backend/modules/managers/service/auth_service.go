package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/eskiz"
	"backend/modules/managers/domain"
	"backend/modules/managers/repository"
)

const codePurposePasswordSetup = "password_setup"

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrInvalidPhone       = errors.New("telefon raqami formati noto'g'ri")
	ErrManagerNotFound    = errors.New("menejer topilmadi")
	ErrManagerInactive    = errors.New("menejer faol emas")
	ErrPasswordNotSet     = errors.New("parol hali o'rnatilmagan")
	ErrPasswordAlreadySet = errors.New("parol o'rnatilgan")
	ErrInvalidCredentials = errors.New("telefon yoki parol noto'g'ri")
	ErrCodeNotFound       = errors.New("tasdiqlash kodi topilmadi")
	ErrCodeExpired        = errors.New("tasdiqlash kodi muddati o'tgan")
	ErrCodeInvalid        = errors.New("tasdiqlash kodi noto'g'ri")
	ErrCodeNotVerified    = errors.New("avval kodni tasdiqlang")
	ErrPasswordTooShort   = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
)

type LoginResult struct {
	Token   string               `json:"token"`
	Manager *adminDomain.Manager `json:"manager"`
}

type AuthService interface {
	SendCode(phone string) error
	VerifyCode(phone, code string) error
	ResendCode(phone string) error
	SetPassword(phone, password string) (*LoginResult, error)
	Login(phone, password string) (*LoginResult, error)
	GetProfile(managerID uint) (*adminDomain.Manager, error)
	ChangePassword(managerID uint, oldPassword, newPassword string) error
}

type authService struct {
	repo           repository.AuthRepository
	eskizService   *eskiz.Service
	jwtSecret      string
	jwtExpireHours int
}

func NewAuthService(repo repository.AuthRepository, eskizService *eskiz.Service, jwtSecret string, jwtExpireHours int) AuthService {
	return &authService{repo: repo, eskizService: eskizService, jwtSecret: jwtSecret, jwtExpireHours: jwtExpireHours}
}

func (s *authService) SendCode(phone string) error {
	phone = strings.TrimSpace(phone)
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}
	m, err := s.repo.GetManagerByPhone(phone)
	if err != nil {
		return err
	}
	if m == nil {
		return ErrManagerNotFound
	}
	if strings.ToLower(m.Status) != "active" {
		return ErrManagerInactive
	}
	if strings.TrimSpace(m.Password) != "" || !m.PasswordSetupAllowed {
		return ErrPasswordAlreadySet
	}
	code := s.eskizService.GenerateCode()
	if _, err = s.eskizService.SendManagerPasswordSetupCode(context.Background(), phone, code); err != nil {
		return err
	}
	return s.repo.CreateCode(&domain.VerificationCode{
		ManagerID: m.ID, Phone: phone, Code: code, Purpose: codePurposePasswordSetup, ExpiresAt: time.Now().Add(5 * time.Minute),
	})
}

func (s *authService) VerifyCode(phone, code string) error {
	phone, code = strings.TrimSpace(phone), strings.TrimSpace(code)
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}
	if code == "" {
		return ErrCodeInvalid
	}
	row, err := s.repo.GetLatestActiveCode(phone, codePurposePasswordSetup)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrCodeNotFound
	}
	if time.Now().After(row.ExpiresAt) {
		return ErrCodeExpired
	}
	if row.Code != code {
		row.Attempts++
		_ = s.repo.UpdateCode(row)
		return ErrCodeInvalid
	}
	now := time.Now()
	row.VerifiedAt = &now
	return s.repo.UpdateCode(row)
}
func (s *authService) ResendCode(phone string) error { return s.SendCode(phone) }

func (s *authService) SetPassword(phone, password string) (*LoginResult, error) {
	phone, password = strings.TrimSpace(phone), strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	if len(password) < 6 {
		return nil, ErrPasswordTooShort
	}
	m, err := s.repo.GetManagerByPhone(phone)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, ErrManagerNotFound
	}
	if strings.TrimSpace(m.Password) != "" || !m.PasswordSetupAllowed {
		return nil, ErrPasswordAlreadySet
	}
	row, err := s.repo.GetLatestActiveCode(phone, codePurposePasswordSetup)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCodeNotFound
	}
	if time.Now().After(row.ExpiresAt) {
		return nil, ErrCodeExpired
	}
	if row.VerifiedAt == nil {
		return nil, ErrCodeNotVerified
	}
	hashed, err := security.HashPassword(password)
	if err != nil {
		return nil, err
	}
	m.Password = hashed
	m.PasswordSetupAllowed = false
	if err = s.repo.UpdateManager(m); err != nil {
		return nil, err
	}
	now := time.Now()
	row.UsedAt = &now
	_ = s.repo.UpdateCode(row)
	token, err := security.GenerateManagerToken(s.jwtSecret, m.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Manager: m}, nil
}

func (s *authService) Login(phone, password string) (*LoginResult, error) {
	phone, password = strings.TrimSpace(phone), strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	m, err := s.repo.GetManagerByPhone(phone)
	if err != nil {
		return nil, err
	}
	if m == nil {
		return nil, ErrInvalidCredentials
	}
	if strings.ToLower(m.Status) != "active" {
		return nil, ErrManagerInactive
	}
	if strings.TrimSpace(m.Password) == "" {
		return nil, ErrPasswordNotSet
	}
	if !security.CheckPassword(m.Password, password) {
		return nil, ErrInvalidCredentials
	}
	token, err := security.GenerateManagerToken(s.jwtSecret, m.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Manager: m}, nil
}

func (s *authService) GetProfile(managerID uint) (*adminDomain.Manager, error) {
	row, err := s.repo.GetManagerByID(managerID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrManagerNotFound
	}
	return row, nil
}
func (s *authService) ChangePassword(managerID uint, oldPassword, newPassword string) error {
	oldPassword, newPassword = strings.TrimSpace(oldPassword), strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}
	row, err := s.repo.GetManagerByID(managerID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrManagerNotFound
	}
	if strings.TrimSpace(row.Password) == "" {
		return ErrPasswordNotSet
	}
	if !security.CheckPassword(row.Password, oldPassword) {
		return ErrInvalidCredentials
	}
	hashed, err := security.HashPassword(newPassword)
	if err != nil {
		return err
	}
	row.Password = hashed
	return s.repo.UpdateManager(row)
}
