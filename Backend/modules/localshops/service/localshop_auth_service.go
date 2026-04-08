package service

import (
	"context"
	"encoding/base64"
	"errors"
	"regexp"
	"strings"
	"time"

	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/eskiz"
	"backend/modules/localshops/domain"
	"backend/modules/localshops/repository"
)

const codePurposePasswordSetup = "password_setup"

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrInvalidPhone        = errors.New("telefon raqami formati noto'g'ri")
	ErrLocalShopNotFound   = errors.New("local shop topilmadi")
	ErrLocalShopInactive   = errors.New("local shop faol emas")
	ErrPasswordNotSet      = errors.New("parol hali o'rnatilmagan")
	ErrPasswordAlreadySet  = errors.New("parol o'rnatilgan")
	ErrInvalidCredentials  = errors.New("telefon yoki parol noto'g'ri")
	ErrCodeNotFound        = errors.New("tasdiqlash kodi topilmadi")
	ErrCodeExpired         = errors.New("tasdiqlash kodi muddati o'tgan")
	ErrCodeInvalid         = errors.New("tasdiqlash kodi noto'g'ri")
	ErrCodeNotVerified     = errors.New("avval kodni tasdiqlang")
	ErrPasswordTooShort    = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
	ErrInvalidLogoBase64   = errors.New("logo base64 formati noto'g'ri")
)

type LoginResult struct {
	Token string                       `json:"token"`
	Shop  *adminDomain.NeighborhoodShop `json:"shop"`
}

type LocalShopAuthService interface {
	SendCode(phone string) error
	VerifyCode(phone, code string) error
	ResendCode(phone string) error
	SetPassword(phone, password string) (*LoginResult, error)
	Login(phone, password string) (*LoginResult, error)
	GetProfile(localShopID uint) (*adminDomain.NeighborhoodShop, error)
	ChangePassword(localShopID uint, oldPassword, newPassword string) error
	UpdateLogo(localShopID uint, logoBase64 string) (*adminDomain.NeighborhoodShop, error)
}

type localShopAuthService struct {
	repo           repository.LocalShopAuthRepository
	eskizService   *eskiz.Service
	jwtSecret      string
	jwtExpireHours int
}

func NewLocalShopAuthService(
	repo repository.LocalShopAuthRepository,
	eskizService *eskiz.Service,
	jwtSecret string,
	jwtExpireHours int,
) LocalShopAuthService {
	return &localShopAuthService{
		repo:           repo,
		eskizService:   eskizService,
		jwtSecret:      jwtSecret,
		jwtExpireHours: jwtExpireHours,
	}
}

func (s *localShopAuthService) SendCode(phone string) error {
	phone = strings.TrimSpace(phone)
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}

	shop, err := s.repo.GetByPhone(phone)
	if err != nil {
		return err
	}
	if shop == nil {
		return ErrLocalShopNotFound
	}
	if strings.ToLower(shop.Status) != "active" {
		return ErrLocalShopInactive
	}
	if strings.TrimSpace(shop.Password) != "" || !shop.PasswordSetupAllowed {
		return ErrPasswordAlreadySet
	}

	code := s.eskizService.GenerateCode()
	if _, err = s.eskizService.SendLocalShopPasswordSetupCode(context.Background(), phone, code); err != nil {
		return err
	}

	row := &domain.VerificationCode{
		NeighborhoodShopID: shop.ID,
		Phone:              phone,
		Code:               code,
		Purpose:            codePurposePasswordSetup,
		ExpiresAt:          time.Now().Add(5 * time.Minute),
	}
	return s.repo.CreateCode(row)
}

func (s *localShopAuthService) VerifyCode(phone, code string) error {
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

func (s *localShopAuthService) ResendCode(phone string) error {
	return s.SendCode(phone)
}

func (s *localShopAuthService) SetPassword(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	if len(password) < 6 {
		return nil, ErrPasswordTooShort
	}

	shop, err := s.repo.GetByPhone(phone)
	if err != nil {
		return nil, err
	}
	if shop == nil {
		return nil, ErrLocalShopNotFound
	}
	if strings.TrimSpace(shop.Password) != "" || !shop.PasswordSetupAllowed {
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
	shop.Password = hashed
	shop.PasswordSetupAllowed = false
	if err = s.repo.Update(shop); err != nil {
		return nil, err
	}

	now := time.Now()
	row.UsedAt = &now
	if err = s.repo.UpdateCode(row); err != nil {
		return nil, err
	}

	token, err := security.GenerateLocalShopToken(s.jwtSecret, shop.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Shop: shop}, nil
}

func (s *localShopAuthService) Login(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}

	shop, err := s.repo.GetByPhone(phone)
	if err != nil {
		return nil, err
	}
	if shop == nil {
		return nil, ErrInvalidCredentials
	}
	if strings.ToLower(shop.Status) != "active" {
		return nil, ErrLocalShopInactive
	}
	if strings.TrimSpace(shop.Password) == "" {
		return nil, ErrPasswordNotSet
	}
	if !security.CheckPassword(shop.Password, password) {
		return nil, ErrInvalidCredentials
	}

	token, err := security.GenerateLocalShopToken(s.jwtSecret, shop.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Shop: shop}, nil
}

func (s *localShopAuthService) GetProfile(localShopID uint) (*adminDomain.NeighborhoodShop, error) {
	row, err := s.repo.GetByID(localShopID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopNotFound
	}
	return row, nil
}

func (s *localShopAuthService) ChangePassword(localShopID uint, oldPassword, newPassword string) error {
	oldPassword = strings.TrimSpace(oldPassword)
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}

	row, err := s.repo.GetByID(localShopID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrLocalShopNotFound
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
	return s.repo.Update(row)
}

func (s *localShopAuthService) UpdateLogo(localShopID uint, logoBase64 string) (*adminDomain.NeighborhoodShop, error) {
	logoBase64 = strings.TrimSpace(logoBase64)
	if logoBase64 == "" {
		return nil, ErrInvalidLogoBase64
	}
	if !isValidBase64Image(logoBase64) {
		return nil, ErrInvalidLogoBase64
	}

	row, err := s.repo.GetByID(localShopID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrLocalShopNotFound
	}
	row.Logo = logoBase64
	if err = s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func isValidBase64Image(raw string) bool {
	payload := raw
	if strings.HasPrefix(raw, "data:") {
		parts := strings.SplitN(raw, ",", 2)
		if len(parts) != 2 {
			return false
		}
		payload = parts[1]
	}
	if payload == "" {
		return false
	}
	_, err := base64.StdEncoding.DecodeString(payload)
	return err == nil
}
