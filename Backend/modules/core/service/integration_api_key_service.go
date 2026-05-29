package service

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"strings"

	"backend/internal/pkg/integrationkey"
	"backend/internal/pkg/security"
	"backend/modules/core/domain"
	"backend/modules/core/repository"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrIntegrationKeyNameRequired  = errors.New("name majburiy")
	ErrIntegrationKeyAPIKeyRequired = errors.New("api_key majburiy")
	ErrInvalidIntegrationAPIKey  = errors.New("noto'g'ri api_key")
	ErrIntegrationKeyNotFound    = repository.ErrIntegrationKeyNotFound
)

type CreateIntegrationKeyInput struct {
	Name string `json:"name"`
}

type UpdateIntegrationKeyInput struct {
	Name string `json:"name"`
}

type IntegrationKeyListItem struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	APIKey    string `json:"api_key"`
	KeyHint   string `json:"key_hint"`
	CreatedAt string `json:"created_at"`
}

type IntegrationKeyCreated struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	APIKey    string `json:"api_key"`
	CreatedAt string `json:"created_at"`
}

type IntegrationLoginResult struct {
	Token              string `json:"token"`
	IntegrationKeyID   uint   `json:"integration_key_id"`
	Name               string `json:"name"`
	ExpiresInHours     int    `json:"expires_in_hours"`
	TokenType          string `json:"token_type"` // "Bearer"
}

type IntegrationProfile struct {
	IntegrationKeyID uint   `json:"integration_key_id"`
	Name             string `json:"name"`
	CreatedAt        string `json:"created_at"`
}

type IntegrationAPIKeyService interface {
	Create(input CreateIntegrationKeyInput) (*IntegrationKeyCreated, error)
	List() ([]IntegrationKeyListItem, error)
	Update(id uint, input UpdateIntegrationKeyInput) error
	Delete(id uint) error
	Login(apiKey string) (*IntegrationLoginResult, error)
	Profile(integrationKeyID uint) (*IntegrationProfile, error)
}

type integrationAPIKeyService struct {
	repo           repository.IntegrationAPIKeyRepository
	secret         string // JWT_SECRET — shifrlash/ochish + JWT imzo
	jwtExpireHours int
}

func NewIntegrationAPIKeyService(repo repository.IntegrationAPIKeyRepository, jwtSecret string, jwtExpireHours int) IntegrationAPIKeyService {
	return &integrationAPIKeyService{repo: repo, secret: jwtSecret, jwtExpireHours: jwtExpireHours}
}

func generateAPIKey() (raw string, err error) {
	b := make([]byte, 32)
	if _, err = rand.Read(b); err != nil {
		return "", err
	}
	return "intgr_" + hex.EncodeToString(b), nil
}

func keyHintFromRaw(raw string) string {
	if len(raw) < 12 {
		return "••••"
	}
	suffix := raw[len(raw)-4:]
	return raw[:8] + "…" + suffix
}

func (s *integrationAPIKeyService) Create(input CreateIntegrationKeyInput) (*IntegrationKeyCreated, error) {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return nil, ErrIntegrationKeyNameRequired
	}
	raw, err := generateAPIKey()
	if err != nil {
		return nil, err
	}
	hash, err := bcrypt.GenerateFromPassword([]byte(raw), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	enc, err := integrationkey.EncryptString(raw, s.secret)
	if err != nil {
		return nil, err
	}
	row := &domain.IntegrationAPIKey{
		Name:         name,
		KeyHash:      string(hash),
		KeyEncrypted: enc,
		KeyHint:      keyHintFromRaw(raw),
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return &IntegrationKeyCreated{
		ID:        row.ID,
		Name:      row.Name,
		APIKey:    raw,
		CreatedAt: row.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}

func (s *integrationAPIKeyService) List() ([]IntegrationKeyListItem, error) {
	rows, err := s.repo.List()
	if err != nil {
		return nil, err
	}
	out := make([]IntegrationKeyListItem, 0, len(rows))
	for i := range rows {
		apiKey := ""
		if rows[i].KeyEncrypted != "" {
			if p, err := integrationkey.DecryptString(rows[i].KeyEncrypted, s.secret); err == nil {
				apiKey = p
			}
		}
		out = append(out, IntegrationKeyListItem{
			ID:        rows[i].ID,
			Name:      rows[i].Name,
			APIKey:    apiKey,
			KeyHint:   rows[i].KeyHint,
			CreatedAt: rows[i].CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		})
	}
	return out, nil
}

func (s *integrationAPIKeyService) Update(id uint, input UpdateIntegrationKeyInput) error {
	name := strings.TrimSpace(input.Name)
	if name == "" {
		return ErrIntegrationKeyNameRequired
	}
	return s.repo.UpdateName(id, name)
}

func (s *integrationAPIKeyService) Delete(id uint) error {
	return s.repo.Delete(id)
}

func (s *integrationAPIKeyService) Login(apiKey string) (*IntegrationLoginResult, error) {
	raw := strings.TrimSpace(apiKey)
	if raw == "" {
		return nil, ErrIntegrationKeyAPIKeyRequired
	}
	rows, err := s.repo.ListForAuth()
	if err != nil {
		return nil, err
	}
	var matched *domain.IntegrationAPIKey
	for i := range rows {
		if err := bcrypt.CompareHashAndPassword([]byte(rows[i].KeyHash), []byte(raw)); err == nil {
			matched = &rows[i]
			break
		}
	}
	if matched == nil {
		return nil, ErrInvalidIntegrationAPIKey
	}
	token, err := security.GenerateIntegrationToken(s.secret, matched.ID, s.jwtExpireHours)
	if err != nil {
		return nil, err
	}
	return &IntegrationLoginResult{
		Token:            token,
		IntegrationKeyID: matched.ID,
		Name:             matched.Name,
		ExpiresInHours:   s.jwtExpireHours,
		TokenType:        "Bearer",
	}, nil
}

func (s *integrationAPIKeyService) Profile(integrationKeyID uint) (*IntegrationProfile, error) {
	row, err := s.repo.GetByID(integrationKeyID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrIntegrationKeyNotFound
	}
	return &IntegrationProfile{
		IntegrationKeyID: row.ID,
		Name:             row.Name,
		CreatedAt:        row.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}, nil
}
