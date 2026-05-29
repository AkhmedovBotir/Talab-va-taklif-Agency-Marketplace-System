package service

import (
	"time"

	punktdomain "backend/modules/punkts/domain"
	"backend/modules/punkts/repository"
)

var (
	ErrTransferOrderNotFound      = repository.ErrTransferOrderNotFound
	ErrTransferTargetPunktInvalid = repository.ErrTransferTargetPunktInvalid
	ErrTransferOrderStateInvalid  = repository.ErrTransferOrderStateInvalid
	ErrTransferItemInvalid        = repository.ErrTransferItemInvalid
	ErrTransferAlreadyActive      = repository.ErrTransferAlreadyActive
	ErrTransferNotFound           = repository.ErrTransferNotFound
	ErrTransferAccessDenied       = repository.ErrTransferAccessDenied
	ErrTransferWrongState         = repository.ErrTransferWrongState
)

type CreateTransferInput struct {
	TargetPunktID uint   `json:"target_punkt_id"`
	Note          string `json:"note,omitempty"`
	OrderItemIDs  []uint `json:"order_item_ids,omitempty"`
}

type PunktOrderTransferOut struct {
	ID               uint   `json:"id"`
	OrderID          uint   `json:"order_id"`
	SourcePunktID    uint   `json:"source_punkt_id"`
	TargetPunktID    uint   `json:"target_punkt_id"`
	Status           string `json:"status"`
	Note             string `json:"note,omitempty"`
	OrderItemIDs     []uint `json:"order_item_ids"`
	SentAt           string `json:"sent_at,omitempty"`
	TargetAcceptedAt string `json:"target_accepted_at,omitempty"`
	TargetReturnedAt string `json:"target_returned_at,omitempty"`
	SourceReceivedAt string `json:"source_received_at,omitempty"`
	CreatedAt        string `json:"created_at"`
	UpdatedAt        string `json:"updated_at"`
}

type PaginatedTransfers struct {
	Items      []PunktOrderTransferOut `json:"items"`
	Total      int64                   `json:"total"`
	Page       int                     `json:"page"`
	Limit      int                     `json:"limit"`
	TotalPages int                     `json:"total_pages"`
}

type PunktOrderTransferService interface {
	Create(sourcePunktID, orderID uint, input CreateTransferInput) (*PunktOrderTransferOut, error)
	ListOutgoing(punktID uint, page, limit int) (*PaginatedTransfers, error)
	ListIncoming(punktID uint, page, limit int) (*PaginatedTransfers, error)
	GetByIDForPunkt(transferID, punktID uint) (*PunktOrderTransferOut, error)
	AcceptByTarget(transferID, targetPunktID uint) error
	ReturnByTarget(transferID, targetPunktID uint) error
	ConfirmReceivedBySource(transferID, sourcePunktID uint) error
}

type punktOrderTransferService struct {
	repo repository.PunktOrderTransferRepository
}

func NewPunktOrderTransferService(repo repository.PunktOrderTransferRepository) PunktOrderTransferService {
	return &punktOrderTransferService{repo: repo}
}

func (s *punktOrderTransferService) Create(sourcePunktID, orderID uint, input CreateTransferInput) (*PunktOrderTransferOut, error) {
	row, err := s.repo.Create(sourcePunktID, orderID, input.TargetPunktID, input.Note, input.OrderItemIDs)
	if err != nil {
		return nil, err
	}
	out := transferToOut(row)
	return &out, nil
}

func clamp(page, limit int) (int, int) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func (s *punktOrderTransferService) list(punktID uint, page, limit int, incoming bool) (*PaginatedTransfers, error) {
	page, limit = clamp(page, limit)
	var (
		rows  []punktdomain.PunktOrderTransfer
		total int64
		err   error
	)
	if incoming {
		rows, total, err = s.repo.ListIncoming(punktID, page, limit)
	} else {
		rows, total, err = s.repo.ListOutgoing(punktID, page, limit)
	}
	if err != nil {
		return nil, err
	}
	items := make([]PunktOrderTransferOut, 0, len(rows))
	for i := range rows {
		items = append(items, transferToOut(&rows[i]))
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedTransfers{Items: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *punktOrderTransferService) ListOutgoing(punktID uint, page, limit int) (*PaginatedTransfers, error) {
	return s.list(punktID, page, limit, false)
}

func (s *punktOrderTransferService) ListIncoming(punktID uint, page, limit int) (*PaginatedTransfers, error) {
	return s.list(punktID, page, limit, true)
}

func (s *punktOrderTransferService) GetByIDForPunkt(transferID, punktID uint) (*PunktOrderTransferOut, error) {
	row, err := s.repo.GetByIDForPunkt(transferID, punktID)
	if err != nil {
		return nil, err
	}
	out := transferToOut(row)
	return &out, nil
}

func (s *punktOrderTransferService) AcceptByTarget(transferID, targetPunktID uint) error {
	return s.repo.AcceptByTarget(transferID, targetPunktID)
}

func (s *punktOrderTransferService) ReturnByTarget(transferID, targetPunktID uint) error {
	return s.repo.ReturnByTarget(transferID, targetPunktID)
}

func (s *punktOrderTransferService) ConfirmReceivedBySource(transferID, sourcePunktID uint) error {
	return s.repo.ConfirmReceivedBySource(transferID, sourcePunktID)
}

func fmtT(t *time.Time) string {
	if t == nil {
		return ""
	}
	return t.UTC().Format("2006-01-02T15:04:05Z07:00")
}

func transferToOut(row *punktdomain.PunktOrderTransfer) PunktOrderTransferOut {
	itemIDs := make([]uint, 0, len(row.Items))
	for i := range row.Items {
		itemIDs = append(itemIDs, row.Items[i].OrderItemID)
	}
	return PunktOrderTransferOut{
		ID:               row.ID,
		OrderID:          row.OrderID,
		SourcePunktID:    row.SourcePunktID,
		TargetPunktID:    row.TargetPunktID,
		Status:           row.Status,
		Note:             row.Note,
		OrderItemIDs:     itemIDs,
		SentAt:           fmtT(row.SentAt),
		TargetAcceptedAt: fmtT(row.TargetAcceptedAt),
		TargetReturnedAt: fmtT(row.TargetReturnedAt),
		SourceReceivedAt: fmtT(row.SourceReceivedAt),
		CreatedAt:        row.CreatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:        row.UpdatedAt.UTC().Format("2006-01-02T15:04:05Z07:00"),
	}
}
