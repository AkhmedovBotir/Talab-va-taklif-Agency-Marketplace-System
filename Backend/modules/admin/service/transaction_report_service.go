package service

import (
	"errors"
	"strings"
	"time"

	"backend/modules/admin/repository"
)

var ErrInvalidAreaLevel = errors.New("level noto'g'ri: region|district|mfy")

type TransactionReportRow struct {
	RegionID     uint    `json:"region_id,omitempty"`
	RegionName   string  `json:"region_name,omitempty"`
	DistrictID   uint    `json:"district_id,omitempty"`
	DistrictName string  `json:"district_name,omitempty"`
	MFYID        uint    `json:"mfy_id,omitempty"`
	MFYName      string  `json:"mfy_name,omitempty"`
	OrdersCount  int64   `json:"orders_count"`
	TotalAmount  float64 `json:"total_amount"`
}

type TransactionReportOutput struct {
	Level string                 `json:"level"`
	Items []TransactionReportRow `json:"items"`
}

type TransactionReportService interface {
	ByArea(level, status, from, to string) (*TransactionReportOutput, error)
}

type transactionReportService struct {
	repo repository.TransactionReportRepository
}

func NewTransactionReportService(repo repository.TransactionReportRepository) TransactionReportService {
	return &transactionReportService{repo: repo}
}

func parseTimeBoundary(v string) (*time.Time, error) {
	v = strings.TrimSpace(v)
	if v == "" {
		return nil, nil
	}
	t, err := time.Parse(time.RFC3339, v)
	if err != nil {
		return nil, err
	}
	return &t, nil
}

func (s *transactionReportService) ByArea(level, status, from, to string) (*TransactionReportOutput, error) {
	level = strings.TrimSpace(strings.ToLower(level))
	st := strings.TrimSpace(strings.ToLower(status))
	var statusPtr *string
	if st != "" {
		statusPtr = &st
	}
	fromT, err := parseTimeBoundary(from)
	if err != nil {
		return nil, err
	}
	toT, err := parseTimeBoundary(to)
	if err != nil {
		return nil, err
	}
	filter := repository.TransactionReportFilter{Status: statusPtr, From: fromT, To: toT}

	switch level {
	case "region":
		rows, err := s.repo.ByRegion(filter)
		if err != nil {
			return nil, err
		}
		items := make([]TransactionReportRow, 0, len(rows))
		for i := range rows {
			items = append(items, TransactionReportRow{
				RegionID:    rows[i].RegionID,
				RegionName:  rows[i].RegionName,
				OrdersCount: rows[i].OrdersCount,
				TotalAmount: rows[i].TotalAmount,
			})
		}
		return &TransactionReportOutput{Level: level, Items: items}, nil
	case "district":
		rows, err := s.repo.ByDistrict(filter)
		if err != nil {
			return nil, err
		}
		items := make([]TransactionReportRow, 0, len(rows))
		for i := range rows {
			items = append(items, TransactionReportRow{
				RegionID:     rows[i].RegionID,
				DistrictID:   rows[i].DistrictID,
				DistrictName: rows[i].DistrictName,
				OrdersCount:  rows[i].OrdersCount,
				TotalAmount:  rows[i].TotalAmount,
			})
		}
		return &TransactionReportOutput{Level: level, Items: items}, nil
	case "mfy":
		rows, err := s.repo.ByMFY(filter)
		if err != nil {
			return nil, err
		}
		items := make([]TransactionReportRow, 0, len(rows))
		for i := range rows {
			items = append(items, TransactionReportRow{
				RegionID:    rows[i].RegionID,
				DistrictID:  rows[i].DistrictID,
				MFYID:       rows[i].MFYID,
				MFYName:     rows[i].MFYName,
				OrdersCount: rows[i].OrdersCount,
				TotalAmount: rows[i].TotalAmount,
			})
		}
		return &TransactionReportOutput{Level: level, Items: items}, nil
	default:
		return nil, ErrInvalidAreaLevel
	}
}
