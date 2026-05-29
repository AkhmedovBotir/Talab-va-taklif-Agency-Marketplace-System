package service

import (
	"crypto/rand"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"net/url"
	"strings"

	"backend/modules/admin/domain"
	"backend/modules/admin/repository"
	"github.com/skip2/go-qrcode"
)

var (
	ErrQRNotFound     = errors.New("qr topilmadi")
	ErrQRNameRequired = errors.New("qr nomi majburiy")
	ErrQRLinkInvalid  = errors.New("qr link noto'g'ri")
)

type QRInput struct {
	Name string `json:"name"`
	Link string `json:"link"`
}

type PaginatedQRs struct {
	Items      []domain.QR `json:"items"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	Limit      int         `json:"limit"`
	TotalPages int         `json:"total_pages"`
}

type QRService interface {
	Create(input QRInput) (*domain.QR, error)
	GetPaginated(page, limit int) (*PaginatedQRs, error)
	GetByID(id uint) (*domain.QR, error)
	Update(id uint, input QRInput) (*domain.QR, error)
	Delete(id uint) error
	ResolveScanLink(code string) (string, error)
}

type qrService struct {
	repo    repository.QRRepository
	baseURL string
}

func NewQRService(repo repository.QRRepository, appBaseURL string) QRService {
	baseURL := strings.TrimSpace(appBaseURL)
	if baseURL == "" {
		baseURL = "http://localhost:8081"
	}
	return &qrService{repo: repo, baseURL: strings.TrimRight(baseURL, "/")}
}

func (s *qrService) Create(input QRInput) (*domain.QR, error) {
	input.normalize()
	if input.Name == "" {
		return nil, ErrQRNameRequired
	}
	if err := validateLink(input.Link); err != nil {
		return nil, err
	}

	code, err := generateCode()
	if err != nil {
		return nil, err
	}
	scanURL := fmt.Sprintf("%s/api/v1/qr/%s/scan", s.baseURL, code)
	pngBytes, err := qrcode.Encode(scanURL, qrcode.Medium, 1000)
	if err != nil {
		return nil, err
	}
	imageBase64 := base64.StdEncoding.EncodeToString(pngBytes)

	row := &domain.QR{
		Code:        code,
		Name:        input.Name,
		Link:        input.Link,
		ImageBase64: imageBase64,
		ScanCount:   0,
	}
	if err := s.repo.Create(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *qrService) GetPaginated(page, limit int) (*PaginatedQRs, error) {
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
	return &PaginatedQRs{
		Items:      items,
		Total:      total,
		Page:       page,
		Limit:      limit,
		TotalPages: totalPages,
	}, nil
}

func (s *qrService) GetByID(id uint) (*domain.QR, error) {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrQRNotFound
	}
	return row, nil
}

func (s *qrService) Update(id uint, input QRInput) (*domain.QR, error) {
	input.normalize()
	if input.Name == "" {
		return nil, ErrQRNameRequired
	}
	if err := validateLink(input.Link); err != nil {
		return nil, err
	}
	row, err := s.repo.GetByID(id)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrQRNotFound
	}

	// QR o'zgarmaydi: faqat nom va link yangilanadi.
	row.Name = input.Name
	row.Link = input.Link
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	return row, nil
}

func (s *qrService) Delete(id uint) error {
	row, err := s.repo.GetByID(id)
	if err != nil {
		return err
	}
	if row == nil {
		return ErrQRNotFound
	}
	return s.repo.Delete(id)
}

func (s *qrService) ResolveScanLink(code string) (string, error) {
	code = strings.TrimSpace(code)
	if code == "" {
		return "", ErrQRNotFound
	}
	row, err := s.repo.GetByCode(code)
	if err != nil {
		return "", err
	}
	if row == nil {
		return "", ErrQRNotFound
	}
	if err := s.repo.IncrementScanCountByCode(code); err != nil {
		return "", err
	}
	return row.Link, nil
}

func validateLink(link string) error {
	u, err := url.ParseRequestURI(strings.TrimSpace(link))
	if err != nil {
		return ErrQRLinkInvalid
	}
	if u.Scheme != "http" && u.Scheme != "https" {
		return ErrQRLinkInvalid
	}
	return nil
}

func generateCode() (string, error) {
	buf := make([]byte, 12)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return hex.EncodeToString(buf), nil
}

func (i *QRInput) normalize() {
	i.Name = strings.TrimSpace(i.Name)
	i.Link = strings.TrimSpace(i.Link)
}

