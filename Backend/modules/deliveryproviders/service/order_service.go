package service

import (
	"errors"
	"time"

	mpDomain "backend/modules/marketplace/domain"
	"backend/modules/deliveryproviders/repository"
)

var (
	ErrOrderNotFound                   = errors.New("buyurtma topilmadi")
	ErrOrderCannotAccept              = errors.New("buyurtma qabul qilinmaydi")
	ErrOrderCannotDeliver             = errors.New("buyurtma yetkazildi deb belgilab bo'lmaydi")
	ErrOrderCannotCollectPayment      = errors.New("to'lovni qabul qilib bo'lmaydi")
	ErrOrderCannotTransferPayment     = errors.New("to'lovni do'konga yuborib bo'lmaydi")
)

type OrderService interface {
	ListToday(courierID uint, page, limit int) (*OrderPage, error)
	ListHistory(courierID uint, page, limit int) (*OrderPage, error)
	GetByID(courierID, orderID uint) (*OrderOut, error)
	Accept(courierID, orderID uint) (*OrderOut, error)
	MarkDelivered(courierID, orderID uint) (*OrderOut, error)
	CollectPayment(courierID, orderID uint) (*OrderOut, error)
	TransferPaymentToShop(courierID, orderID uint) (*OrderOut, error)
}

type orderService struct{ repo repository.OrderRepository }

func NewOrderService(repo repository.OrderRepository) OrderService { return &orderService{repo: repo} }

type OrderItemOut struct {
	ID                 uint    `json:"id"`
	LocalShopProductID uint    `json:"local_shop_product_id"`
	ProductName        string  `json:"product_name"`
	Quantity           float64 `json:"quantity"`
	Unit               string  `json:"unit"`
	UnitPrice          float64 `json:"unit_price"`
	LineTotal          float64 `json:"line_total"`
}
type OrderOut struct {
	ID                         uint         `json:"id"`
	LocalShopID                uint         `json:"local_shop_id"`
	UserID                     uint         `json:"user_id"`
	Status                     string       `json:"status"`
	TotalAmount                float64      `json:"total_amount"`
	CourierAcceptedAt          string       `json:"courier_accepted_at,omitempty"`
	DeliveredAt                string       `json:"delivered_at,omitempty"`
	PaymentCollectedAt         string       `json:"payment_collected_at,omitempty"`
	PaymentTransferredToShopAt string       `json:"payment_transferred_to_shop_at,omitempty"`
	Items                      []OrderItemOut `json:"items"`
	CreatedAt                  string       `json:"created_at"`
	UpdatedAt                  string       `json:"updated_at"`
}
type OrderPage struct {
	Items      []OrderOut `json:"items"`
	Total      int64      `json:"total"`
	Page       int        `json:"page"`
	Limit      int        `json:"limit"`
	TotalPages int        `json:"total_pages"`
}

func (s *orderService) ListToday(courierID uint, page, limit int) (*OrderPage, error) {
	if page < 1 { page = 1 }
	if limit < 1 { limit = 10 }
	if limit > 100 { limit = 100 }
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	end := start.Add(24 * time.Hour)
	rows, total, err := s.repo.ListToday(courierID, start, end, page, limit)
	if err != nil { return nil, err }
	return toPage(rows, total, page, limit), nil
}

func (s *orderService) ListHistory(courierID uint, page, limit int) (*OrderPage, error) {
	if page < 1 { page = 1 }
	if limit < 1 { limit = 10 }
	if limit > 100 { limit = 100 }
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	rows, total, err := s.repo.ListHistory(courierID, start, page, limit)
	if err != nil { return nil, err }
	return toPage(rows, total, page, limit), nil
}

func (s *orderService) GetByID(courierID, orderID uint) (*OrderOut, error) {
	row, err := s.repo.GetByIDForCourier(orderID, courierID)
	if err != nil { return nil, err }
	if row == nil { return nil, ErrOrderNotFound }
	out := mapOrder(*row)
	return &out, nil
}

func (s *orderService) Accept(courierID, orderID uint) (*OrderOut, error) {
	row, err := s.repo.GetByIDForCourier(orderID, courierID); if err != nil { return nil, err }
	if row == nil { return nil, ErrOrderNotFound }
	if row.Status != mpDomain.LocalShopOrderStatusApproved { return nil, ErrOrderCannotAccept }
	now := time.Now().UTC()
	row.CourierAcceptedAt = &now
	if err := s.repo.Update(row); err != nil { return nil, err }
	out := mapOrder(*row); return &out, nil
}

func (s *orderService) MarkDelivered(courierID, orderID uint) (*OrderOut, error) {
	row, err := s.repo.GetByIDForCourier(orderID, courierID); if err != nil { return nil, err }
	if row == nil { return nil, ErrOrderNotFound }
	if row.CourierAcceptedAt == nil || row.Status != mpDomain.LocalShopOrderStatusApproved { return nil, ErrOrderCannotDeliver }
	now := time.Now().UTC()
	row.DeliveredAt = &now
	row.Status = mpDomain.LocalShopOrderStatusDelivered
	if err := s.repo.Update(row); err != nil { return nil, err }
	out := mapOrder(*row); return &out, nil
}

func (s *orderService) CollectPayment(courierID, orderID uint) (*OrderOut, error) {
	row, err := s.repo.GetByIDForCourier(orderID, courierID); if err != nil { return nil, err }
	if row == nil { return nil, ErrOrderNotFound }
	if row.Status != mpDomain.LocalShopOrderStatusDelivered { return nil, ErrOrderCannotCollectPayment }
	now := time.Now().UTC()
	row.PaymentCollectedAt = &now
	if err := s.repo.Update(row); err != nil { return nil, err }
	out := mapOrder(*row); return &out, nil
}

func (s *orderService) TransferPaymentToShop(courierID, orderID uint) (*OrderOut, error) {
	row, err := s.repo.GetByIDForCourier(orderID, courierID); if err != nil { return nil, err }
	if row == nil { return nil, ErrOrderNotFound }
	if row.PaymentCollectedAt == nil { return nil, ErrOrderCannotTransferPayment }
	now := time.Now().UTC()
	row.PaymentTransferredToShopAt = &now
	if err := s.repo.Update(row); err != nil { return nil, err }
	out := mapOrder(*row); return &out, nil
}

func toPage(rows []mpDomain.LocalShopOrder, total int64, page, limit int) *OrderPage {
	items := make([]OrderOut, 0, len(rows))
	for _, r := range rows { items = append(items, mapOrder(r)) }
	totalPages := int((total + int64(limit) - 1) / int64(limit)); if totalPages == 0 { totalPages = 1 }
	return &OrderPage{Items: items, Total: total, Page: page, Limit: limit, TotalPages: totalPages}
}

func mapOrder(row mpDomain.LocalShopOrder) OrderOut {
	items := make([]OrderItemOut, 0, len(row.Items))
	for _, it := range row.Items {
		items = append(items, OrderItemOut{ID: it.ID, LocalShopProductID: it.LocalShopProductID, ProductName: it.ProductName, Quantity: it.Quantity, Unit: it.Unit, UnitPrice: it.UnitPrice, LineTotal: it.UnitPrice * it.Quantity})
	}
	return OrderOut{
		ID: row.ID, LocalShopID: row.LocalShopID, UserID: row.UserID, Status: row.Status, TotalAmount: row.TotalAmount,
		CourierAcceptedAt: fmtTime(row.CourierAcceptedAt), DeliveredAt: fmtTime(row.DeliveredAt),
		PaymentCollectedAt: fmtTime(row.PaymentCollectedAt), PaymentTransferredToShopAt: fmtTime(row.PaymentTransferredToShopAt),
		Items: items, CreatedAt: row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"), UpdatedAt: row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}

func fmtTime(t *time.Time) string { if t == nil { return "" }; return t.Format("2006-01-02T15:04:05Z07:00") }
