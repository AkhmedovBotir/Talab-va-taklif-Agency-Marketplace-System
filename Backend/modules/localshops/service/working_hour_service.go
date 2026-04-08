package service

import (
	"errors"
	"fmt"
	"regexp"
	"sort"

	"backend/modules/localshops/domain"
	"backend/modules/localshops/repository"
)

var (
	ErrWorkingHoursPayloadEmpty = errors.New("working_hours bo'sh bo'lmasligi kerak")
	ErrWorkingHoursWeekday      = errors.New("weekday 1..7 oralig'ida bo'lishi kerak")
	ErrWorkingHoursDuplicateDay = errors.New("weekday takrorlangan")
	ErrWorkingHoursTimeFormat   = errors.New("open_time/close_time HH:MM formatda bo'lishi kerak")
	ErrWorkingHoursTimeRequired = errors.New("is_off=false bo'lsa open_time va close_time majburiy")
	ErrWorkingHoursTimeForbidden = errors.New("is_off=true bo'lsa open_time/close_time yuborilmaydi")
	ErrWorkingHoursRange        = errors.New("close_time open_time dan keyin bo'lishi kerak")
)

var hhmmRe = regexp.MustCompile(`^([01]\d|2[0-3]):[0-5]\d$`)

type WorkingHourInput struct {
	Weekday   int    `json:"weekday"`
	IsOff     bool   `json:"is_off"`
	OpenTime  string `json:"open_time,omitempty"`
	CloseTime string `json:"close_time,omitempty"`
}

type WorkingHourService interface {
	List(localShopID uint) ([]domain.WorkingHour, error)
	Save(localShopID uint, rows []WorkingHourInput) ([]domain.WorkingHour, error)
}

type workingHourService struct {
	repo repository.WorkingHourRepository
}

func NewWorkingHourService(repo repository.WorkingHourRepository) WorkingHourService {
	return &workingHourService{repo: repo}
}

func (s *workingHourService) List(localShopID uint) ([]domain.WorkingHour, error) {
	rows, err := s.repo.List(localShopID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		// Default 7 kunni bo'sh schedule sifatida qaytaramiz.
		def := make([]domain.WorkingHour, 0, 7)
		for d := 1; d <= 7; d++ {
			def = append(def, domain.WorkingHour{LocalShopID: localShopID, Weekday: d, IsOff: true})
		}
		return def, nil
	}
	return rows, nil
}

func (s *workingHourService) Save(localShopID uint, input []WorkingHourInput) ([]domain.WorkingHour, error) {
	if len(input) == 0 {
		return nil, ErrWorkingHoursPayloadEmpty
	}
	seen := make(map[int]struct{})
	rows := make([]domain.WorkingHour, 0, len(input))
	for _, in := range input {
		if in.Weekday < 1 || in.Weekday > 7 {
			return nil, ErrWorkingHoursWeekday
		}
		if _, ok := seen[in.Weekday]; ok {
			return nil, ErrWorkingHoursDuplicateDay
		}
		seen[in.Weekday] = struct{}{}
		if in.IsOff {
			if in.OpenTime != "" || in.CloseTime != "" {
				return nil, ErrWorkingHoursTimeForbidden
			}
			rows = append(rows, domain.WorkingHour{
				LocalShopID: localShopID,
				Weekday:     in.Weekday,
				IsOff:       true,
			})
			continue
		}
		if in.OpenTime == "" || in.CloseTime == "" {
			return nil, ErrWorkingHoursTimeRequired
		}
		if !hhmmRe.MatchString(in.OpenTime) || !hhmmRe.MatchString(in.CloseTime) {
			return nil, ErrWorkingHoursTimeFormat
		}
		if !isCloseAfterOpen(in.OpenTime, in.CloseTime) {
			return nil, ErrWorkingHoursRange
		}
		rows = append(rows, domain.WorkingHour{
			LocalShopID: localShopID,
			Weekday:     in.Weekday,
			IsOff:       false,
			OpenTime:    in.OpenTime,
			CloseTime:   in.CloseTime,
		})
	}
	sort.Slice(rows, func(i, j int) bool { return rows[i].Weekday < rows[j].Weekday })
	if err := s.repo.UpsertMany(localShopID, rows); err != nil {
		return nil, err
	}
	return s.List(localShopID)
}

func isCloseAfterOpen(open, close string) bool {
	return toMinutes(close) > toMinutes(open)
}

func toMinutes(hhmm string) int {
	var h, m int
	fmt.Sscanf(hhmm, "%d:%d", &h, &m)
	return h*60 + m
}
