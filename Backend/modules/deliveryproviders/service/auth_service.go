package service

import (
	"context"
	"errors"
	"regexp"
	"strings"
	"time"

	"backend/internal/pkg/security"
	dpDomain "backend/modules/deliveryproviders/domain"
	"backend/modules/deliveryproviders/repository"
	"backend/modules/eskiz"
	lsDomain "backend/modules/localshops/domain"
)

const codePurposePasswordSetup = "password_setup"

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrInvalidPhone        = errors.New("telefon raqami formati noto'g'ri")
	ErrCourierNotFound     = errors.New("yetkazib beruvchi topilmadi")
	ErrPasswordNotSet      = errors.New("parol hali o'rnatilmagan")
	ErrPasswordAlreadySet  = errors.New("parol o'rnatilgan")
	ErrInvalidCredentials  = errors.New("telefon yoki parol noto'g'ri")
	ErrCodeNotFound        = errors.New("tasdiqlash kodi topilmadi")
	ErrCodeExpired         = errors.New("tasdiqlash kodi muddati o'tgan")
	ErrCodeInvalid         = errors.New("tasdiqlash kodi noto'g'ri")
	ErrCodeNotVerified     = errors.New("avval kodni tasdiqlang")
	ErrPasswordTooShort    = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
)

type LoginResult struct {
	Token   string            `json:"token"`
	Courier *lsDomain.Courier `json:"courier"`
}

type AuthService interface {
	SendCode(phone string) error
	VerifyCode(phone, code string) error
	ResendCode(phone string) error
	SetPassword(phone, password string) (*LoginResult, error)
	Login(phone, password string) (*LoginResult, error)
	GetProfile(courierID uint) (*lsDomain.Courier, error)
	ChangePassword(courierID uint, oldPassword, newPassword string) error
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
	c, err := s.repo.GetCourierByPhone(phone)
	if err != nil {
		return err
	}
	if c == nil {
		return ErrCourierNotFound
	}
	if strings.TrimSpace(c.Password) != "" || !c.PasswordSetupAllowed {
		return ErrPasswordAlreadySet
	}
	code := s.eskizService.GenerateCode()
	if _, err = s.eskizService.SendDeliveryProviderPasswordSetupCode(context.Background(), phone, code); err != nil {
		return err
	}
	row := &dpDomain.VerificationCode{
		CourierID: c.ID,
		Phone:     phone,
		Code:      code,
		Purpose:   codePurposePasswordSetup,
		ExpiresAt: time.Now().Add(5 * time.Minute),
	}
	return s.repo.CreateCode(row)
}

func (s *authService) VerifyCode(phone, code string) error {
	phone = strings.TrimSpace(phone)
	code = strings.TrimSpace(code)
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
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	if len(password) < 6 {
		return nil, ErrPasswordTooShort
	}
	c, err := s.repo.GetCourierByPhone(phone)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, ErrCourierNotFound
	}
	if strings.TrimSpace(c.Password) != "" || !c.PasswordSetupAllowed {
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
	c.Password = hashed
	c.PasswordSetupAllowed = false
	if err = s.repo.UpdateCourier(c); err != nil {
		return nil, err
	}
	now := time.Now()
	row.UsedAt = &now
	if err = s.repo.UpdateCode(row); err != nil {
		return nil, err
	}
	token, err := security.GenerateDeliveryProviderToken(s.jwtSecret, c.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Courier: c}, nil
}

func (s *authService) Login(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	c, err := s.repo.GetCourierByPhone(phone)
	if err != nil {
		return nil, err
	}
	if c == nil {
		return nil, ErrInvalidCredentials
	}
	if strings.TrimSpace(c.Password) == "" {
		return nil, ErrPasswordNotSet
	}
	if !security.CheckPassword(c.Password, password) {
		return nil, ErrInvalidCredentials
	}
	token, err := security.GenerateDeliveryProviderToken(s.jwtSecret, c.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Courier: c}, nil
}

func (s *authService) GetProfile(courierID uint) (*lsDomain.Courier, error) {
	row, err := s.repo.GetCourierByID(courierID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrCourierNotFound
	}
	return row, nil
}

func (s *authService) ChangePassword(courierID uint, oldPassword, newPassword string) error {
	oldPassword = strings.TrimSpace(oldPassword)
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}
	row, err := s.repo.GetCourierByID(courierID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrCourierNotFound
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
	return s.repo.UpdateCourier(row)
}
