package service

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"strings"
	"time"

	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/eskiz"
	"backend/modules/punkts/domain"
	"backend/modules/punkts/repository"
)

const codePurposePasswordSetup = "password_setup"

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrInvalidPhone    = errors.New("telefon raqami formati noto'g'ri")
	ErrPunktNotFound   = errors.New("punkt topilmadi")
	ErrPunktInactive   = errors.New("punkt faol emas")
	ErrPasswordNotSet  = errors.New("parol hali o'rnatilmagan")
	ErrPasswordAlreadySet = errors.New("parol o'rnatilgan")
	ErrInvalidCredentials = errors.New("telefon yoki parol noto'g'ri")
	ErrCodeNotFound    = errors.New("tasdiqlash kodi topilmadi")
	ErrCodeExpired     = errors.New("tasdiqlash kodi muddati o'tgan")
	ErrCodeInvalid     = errors.New("tasdiqlash kodi noto'g'ri")
	ErrCodeNotVerified = errors.New("avval kodni tasdiqlang")
	ErrPasswordTooShort = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
)

type LoginResult struct {
	Token string               `json:"token"`
	Punkt *adminDomain.Punkt   `json:"punkt"`
}

type PunktAuthService interface {
	SendCode(phone string) error
	VerifyCode(phone, code string) error
	ResendCode(phone string) error
	SetPassword(phone, password string) (*LoginResult, error)
	Login(phone, password string) (*LoginResult, error)
	GetProfile(punktID uint) (*adminDomain.Punkt, error)
	ChangePassword(punktID uint, oldPassword, newPassword string) error
}

type punktAuthService struct {
	repo           repository.PunktAuthRepository
	eskizService   *eskiz.Service
	jwtSecret      string
	jwtExpireHours int
}

func NewPunktAuthService(
	repo repository.PunktAuthRepository,
	eskizService *eskiz.Service,
	jwtSecret string,
	jwtExpireHours int,
) PunktAuthService {
	return &punktAuthService{
		repo:           repo,
		eskizService:   eskizService,
		jwtSecret:      jwtSecret,
		jwtExpireHours: jwtExpireHours,
	}
}

func (s *punktAuthService) SendCode(phone string) error {
	phone = strings.TrimSpace(phone)
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}

	p, err := s.repo.GetPunktByPhone(phone)
	if err != nil {
		return err
	}
	if p == nil {
		return ErrPunktNotFound
	}
	if strings.ToLower(p.Status) != "active" {
		return ErrPunktInactive
	}
	if strings.TrimSpace(p.Password) != "" || !p.PasswordSetupAllowed {
		return ErrPasswordAlreadySet
	}

	code := s.eskizService.GenerateCode()
	message := fmt.Sprintf("%s - Punkt hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.", code)
	if _, err = s.eskizService.SendSMS(context.Background(), phone, message); err != nil {
		return err
	}

	expires := time.Now().Add(5 * time.Minute)
	row := &domain.VerificationCode{
		PunktID:   p.ID,
		Phone:     phone,
		Code:      code,
		Purpose:   codePurposePasswordSetup,
		ExpiresAt: expires,
	}
	return s.repo.CreateCode(row)
}

func (s *punktAuthService) VerifyCode(phone, code string) error {
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

func (s *punktAuthService) ResendCode(phone string) error {
	return s.SendCode(phone)
}

func (s *punktAuthService) SetPassword(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	if len(password) < 6 {
		return nil, ErrPasswordTooShort
	}

	p, err := s.repo.GetPunktByPhone(phone)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrPunktNotFound
	}
	if strings.TrimSpace(p.Password) != "" || !p.PasswordSetupAllowed {
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
	p.Password = hashed
	p.PasswordSetupAllowed = false
	if err = s.repo.UpdatePunkt(p); err != nil {
		return nil, err
	}

	now := time.Now()
	row.UsedAt = &now
	if err = s.repo.UpdateCode(row); err != nil {
		return nil, err
	}

	token, err := security.GeneratePunktToken(s.jwtSecret, p.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Punkt: p}, nil
}

func (s *punktAuthService) Login(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}

	p, err := s.repo.GetPunktByPhone(phone)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, ErrInvalidCredentials
	}
	if strings.ToLower(p.Status) != "active" {
		return nil, ErrPunktInactive
	}
	if strings.TrimSpace(p.Password) == "" {
		return nil, ErrPasswordNotSet
	}
	if !security.CheckPassword(p.Password, password) {
		return nil, ErrInvalidCredentials
	}

	token, err := security.GeneratePunktToken(s.jwtSecret, p.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Punkt: p}, nil
}

func (s *punktAuthService) GetProfile(punktID uint) (*adminDomain.Punkt, error) {
	row, err := s.repo.GetPunktByID(punktID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrPunktNotFound
	}
	return row, nil
}

func (s *punktAuthService) ChangePassword(punktID uint, oldPassword, newPassword string) error {
	oldPassword = strings.TrimSpace(oldPassword)
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}

	row, err := s.repo.GetPunktByID(punktID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrPunktNotFound
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
	return s.repo.UpdatePunkt(row)
}
