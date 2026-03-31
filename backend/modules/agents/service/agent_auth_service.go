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
	"backend/modules/agents/domain"
	"backend/modules/agents/repository"
	"backend/modules/eskiz"
)

const codePurposePasswordSetup = "password_setup"

var phoneRegex = regexp.MustCompile(`^\+998\d{9}$`)

var (
	ErrInvalidPhone         = errors.New("telefon raqami formati noto'g'ri")
	ErrAgentNotFound        = errors.New("agent topilmadi")
	ErrAgentInactive        = errors.New("agent faol emas")
	ErrPasswordNotSet       = errors.New("parol hali o'rnatilmagan")
	ErrPasswordAlreadySet   = errors.New("parol o'rnatilgan")
	ErrInvalidCredentials   = errors.New("telefon yoki parol noto'g'ri")
	ErrCodeNotFound         = errors.New("tasdiqlash kodi topilmadi")
	ErrCodeExpired          = errors.New("tasdiqlash kodi muddati o'tgan")
	ErrCodeInvalid          = errors.New("tasdiqlash kodi noto'g'ri")
	ErrCodeNotVerified      = errors.New("avval kodni tasdiqlang")
	ErrPasswordTooShort     = errors.New("parol kamida 6 ta belgidan iborat bo'lishi kerak")
)

type LoginResult struct {
	Token string              `json:"token"`
	Agent *adminDomain.Agent  `json:"agent"`
}

type AgentAuthService interface {
	SendCode(phone string) error
	VerifyCode(phone, code string) error
	ResendCode(phone string) error
	SetPassword(phone, password string) (*LoginResult, error)
	Login(phone, password string) (*LoginResult, error)
	GetProfile(agentID uint) (*adminDomain.Agent, error)
	ChangePassword(agentID uint, oldPassword, newPassword string) error
}

type agentAuthService struct {
	repo           repository.AgentAuthRepository
	eskizService   *eskiz.Service
	jwtSecret      string
	jwtExpireHours int
}

func NewAgentAuthService(
	repo repository.AgentAuthRepository,
	eskizService *eskiz.Service,
	jwtSecret string,
	jwtExpireHours int,
) AgentAuthService {
	return &agentAuthService{
		repo:           repo,
		eskizService:   eskizService,
		jwtSecret:      jwtSecret,
		jwtExpireHours: jwtExpireHours,
	}
}

func (s *agentAuthService) SendCode(phone string) error {
	phone = strings.TrimSpace(phone)
	if !phoneRegex.MatchString(phone) {
		return ErrInvalidPhone
	}

	a, err := s.repo.GetAgentByPhone(phone)
	if err != nil {
		return err
	}
	if a == nil {
		return ErrAgentNotFound
	}
	if strings.ToLower(a.Status) != "active" {
		return ErrAgentInactive
	}
	if strings.TrimSpace(a.Password) != "" || !a.PasswordSetupAllowed {
		return ErrPasswordAlreadySet
	}

	code := s.eskizService.GenerateCode()
	message := fmt.Sprintf("%s - Agent hisobi uchun parol o'rnatish kodi. Kod 5 daqiqa amal qiladi. Talab va Taklif Agency.", code)
	if _, err = s.eskizService.SendSMS(context.Background(), phone, message); err != nil {
		return err
	}

	expires := time.Now().Add(5 * time.Minute)
	row := &domain.VerificationCode{
		AgentID:   a.ID,
		Phone:     phone,
		Code:      code,
		Purpose:   codePurposePasswordSetup,
		ExpiresAt: expires,
	}
	return s.repo.CreateCode(row)
}

func (s *agentAuthService) VerifyCode(phone, code string) error {
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

func (s *agentAuthService) ResendCode(phone string) error {
	return s.SendCode(phone)
}

func (s *agentAuthService) SetPassword(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}
	if len(password) < 6 {
		return nil, ErrPasswordTooShort
	}

	a, err := s.repo.GetAgentByPhone(phone)
	if err != nil {
		return nil, err
	}
	if a == nil {
		return nil, ErrAgentNotFound
	}
	if strings.TrimSpace(a.Password) != "" || !a.PasswordSetupAllowed {
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
	a.Password = hashed
	a.PasswordSetupAllowed = false
	if err = s.repo.UpdateAgent(a); err != nil {
		return nil, err
	}

	now := time.Now()
	row.UsedAt = &now
	if err = s.repo.UpdateCode(row); err != nil {
		return nil, err
	}

	token, err := security.GenerateAgentToken(s.jwtSecret, a.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Agent: a}, nil
}

func (s *agentAuthService) Login(phone, password string) (*LoginResult, error) {
	phone = strings.TrimSpace(phone)
	password = strings.TrimSpace(password)
	if !phoneRegex.MatchString(phone) {
		return nil, ErrInvalidPhone
	}

	a, err := s.repo.GetAgentByPhone(phone)
	if err != nil {
		return nil, err
	}
	if a == nil {
		return nil, ErrInvalidCredentials
	}
	if strings.ToLower(a.Status) != "active" {
		return nil, ErrAgentInactive
	}
	if strings.TrimSpace(a.Password) == "" {
		return nil, ErrPasswordNotSet
	}
	if !security.CheckPassword(a.Password, password) {
		return nil, ErrInvalidCredentials
	}

	token, err := security.GenerateAgentToken(s.jwtSecret, a.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &LoginResult{Token: token, Agent: a}, nil
}

func (s *agentAuthService) GetProfile(agentID uint) (*adminDomain.Agent, error) {
	row, err := s.repo.GetAgentByID(agentID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrAgentNotFound
	}
	return row, nil
}

func (s *agentAuthService) ChangePassword(agentID uint, oldPassword, newPassword string) error {
	oldPassword = strings.TrimSpace(oldPassword)
	newPassword = strings.TrimSpace(newPassword)
	if len(newPassword) < 6 {
		return ErrPasswordTooShort
	}

	row, err := s.repo.GetAgentByID(agentID)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrAgentNotFound
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
	return s.repo.UpdateAgent(row)
}
