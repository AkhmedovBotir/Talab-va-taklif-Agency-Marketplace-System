package service

import (
	"errors"
	"strings"
	"time"

	mpDomain "backend/modules/marketplace/domain"
	"backend/modules/localshops/repository"
)

var (
	ErrOrderNotFound            = errors.New("buyurtma topilmadi")
	ErrOrderCannotApprove       = errors.New("faqat kutilmoqdagi buyurtma tasdiqlanadi")
	ErrOrderCannotCancel        = errors.New("faqat kutilmoqda yoki tasdiqlangan buyurtma bekor qilinadi")
	ErrOrderCannotAssignCourier = errors.New("kuryer biriktirish uchun buyurtma tasdiqlangan bo'lishi kerak")
	ErrOrderCourierNotFound     = errors.New("kuryer topilmadi")
	ErrOrderCannotAcceptPayment = errors.New("to'lovni qabul qilib bo'lmaydi")
)

type ManagedOrderItemOutput struct {
	ID                 uint    `json:"id"`
	LocalShopProductID uint    `json:"local_shop_product_id"`
	TemplateID         uint    `json:"template_id"`
	ProductName        string  `json:"product_name"`
	UnitPrice          float64 `json:"unit_price"`
	Quantity           float64 `json:"quantity"`
	Unit               string  `json:"unit"`
	LineTotal          float64 `json:"line_total"`
}

type ManagedOrderOutput struct {
	ID                uint                     `json:"id"`
	UserID            uint                     `json:"user_id"`
	Buyer             ManagedOrderBuyerOutput  `json:"buyer"`
	LocalShopID       uint                     `json:"local_shop_id"`
	Status            string                   `json:"status"`
	CanApprove        bool                     `json:"can_approve"`
	CanCancel         bool                     `json:"can_cancel"`
	CanAssignCourier  bool                     `json:"can_assign_courier"`
	AssignedCourierID *uint                    `json:"assigned_courier_id,omitempty"`
	CourierAssignedAt string                   `json:"courier_assigned_at,omitempty"`
	PaymentTransferredToShopAt string          `json:"payment_transferred_to_shop_at,omitempty"`
	ShopPaymentAcceptedAt      string          `json:"shop_payment_accepted_at,omitempty"`
	TotalAmount       float64                  `json:"total_amount"`
	ExtraPhone        string                   `json:"extra_phone,omitempty"`
	AddressNote       string                   `json:"address_note,omitempty"`
	Items             []ManagedOrderItemOutput `json:"items"`
	CreatedAt         string                   `json:"created_at"`
	UpdatedAt         string                   `json:"updated_at"`
}

type ManagedOrderBuyerOutput struct {
	ID         uint   `json:"id"`
	Phone      string `json:"phone"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Gender     string `json:"gender"`
	Avatar     string `json:"avatar,omitempty"`
	RegionID   uint   `json:"region_id"`
	DistrictID uint   `json:"district_id"`
	MFYID      uint   `json:"mfy_id"`
	BirthDate  string `json:"birth_date"`
	Status     string `json:"status"`
	CreatedAt  string `json:"created_at"`
	UpdatedAt  string `json:"updated_at"`
}

type PaginatedManagedOrders struct {
	Items      []ManagedOrderOutput `json:"items"`
	Total      int64                `json:"total"`
	Page       int                  `json:"page"`
	Limit      int                  `json:"limit"`
	TotalPages int                  `json:"total_pages"`
}

type OrderManagementService interface {
	List(localShopID uint, page, limit int) (*PaginatedManagedOrders, error)
	GetByID(localShopID, orderID uint) (*ManagedOrderOutput, error)
	Approve(localShopID, orderID uint) (*ManagedOrderOutput, error)
	Cancel(localShopID, orderID uint) (*ManagedOrderOutput, error)
	AssignCourier(localShopID, orderID, courierID uint) (*ManagedOrderOutput, error)
	AcceptPayment(localShopID, orderID uint) (*ManagedOrderOutput, error)
	Analytics(localShopID uint, from, to string) (*OrderAnalyticsOutput, error)
}

type OrderAnalyticsOutput struct {
	From                string  `json:"from,omitempty"`
	To                  string  `json:"to,omitempty"`
	TotalOrders         int64   `json:"total_orders"`
	TotalAmount         float64 `json:"total_amount"`
	DeliveredAmount     float64 `json:"delivered_amount"`
	UndeliveredAmount   float64 `json:"undelivered_amount"`
	TransferredAmount   float64 `json:"transferred_amount"`
	UntransferredAmount float64 `json:"untransferred_amount"`
}

type orderManagementService struct {
	repo repository.OrderManagementRepository
}

func NewOrderManagementService(repo repository.OrderManagementRepository) OrderManagementService {
	return &orderManagementService{repo: repo}
}

func (s *orderManagementService) List(localShopID uint, page, limit int) (*PaginatedManagedOrders, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	rows, total, err := s.repo.GetPaginated(localShopID, page, limit)
	if err != nil {
		return nil, err
	}
	buyerMap, err := s.getBuyerMap(rows)
	if err != nil {
		return nil, err
	}
	out := make([]ManagedOrderOutput, 0, len(rows))
	for i := range rows {
		out = append(out, mapManagedOrder(&rows[i], buyerMap[rows[i].UserID]))
	}
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return &PaginatedManagedOrders{Items: out, Total: total, Page: page, Limit: limit, TotalPages: totalPages}, nil
}

func (s *orderManagementService) GetByID(localShopID, orderID uint) (*ManagedOrderOutput, error) {
	row, err := s.repo.GetByID(localShopID, orderID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	buyer, err := s.getBuyerByID(row.UserID)
	if err != nil {
		return nil, err
	}
	out := mapManagedOrder(row, buyer)
	return &out, nil
}

func (s *orderManagementService) Approve(localShopID, orderID uint) (*ManagedOrderOutput, error) {
	row, err := s.repo.GetByID(localShopID, orderID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	if row.Status != mpDomain.LocalShopOrderStatusPending {
		return nil, ErrOrderCannotApprove
	}
	row.Status = mpDomain.LocalShopOrderStatusApproved
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	buyer, err := s.getBuyerByID(row.UserID)
	if err != nil {
		return nil, err
	}
	out := mapManagedOrder(row, buyer)
	return &out, nil
}

func (s *orderManagementService) Cancel(localShopID, orderID uint) (*ManagedOrderOutput, error) {
	row, err := s.repo.GetByID(localShopID, orderID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	if row.Status != mpDomain.LocalShopOrderStatusPending && row.Status != mpDomain.LocalShopOrderStatusApproved {
		return nil, ErrOrderCannotCancel
	}
	row.Status = mpDomain.LocalShopOrderStatusCancelled
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	buyer, err := s.getBuyerByID(row.UserID)
	if err != nil {
		return nil, err
	}
	out := mapManagedOrder(row, buyer)
	return &out, nil
}

func (s *orderManagementService) AssignCourier(localShopID, orderID, courierID uint) (*ManagedOrderOutput, error) {
	row, err := s.repo.GetByID(localShopID, orderID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	if row.Status != mpDomain.LocalShopOrderStatusApproved {
		return nil, ErrOrderCannotAssignCourier
	}
	cr, err := s.repo.GetCourierByID(localShopID, courierID)
	if err != nil {
		return nil, err
	}
	if cr == nil {
		return nil, ErrOrderCourierNotFound
	}
	row.AssignedCourierID = &courierID
	now := time.Now().UTC()
	row.CourierAssignedAt = &now
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	buyer, err := s.getBuyerByID(row.UserID)
	if err != nil {
		return nil, err
	}
	out := mapManagedOrder(row, buyer)
	return &out, nil
}

func (s *orderManagementService) AcceptPayment(localShopID, orderID uint) (*ManagedOrderOutput, error) {
	row, err := s.repo.GetByID(localShopID, orderID)
	if err != nil {
		return nil, err
	}
	if row == nil {
		return nil, ErrOrderNotFound
	}
	if row.PaymentTransferredToShopAt == nil {
		return nil, ErrOrderCannotAcceptPayment
	}
	now := time.Now().UTC()
	row.ShopPaymentAcceptedAt = &now
	if err := s.repo.Update(row); err != nil {
		return nil, err
	}
	buyer, err := s.getBuyerByID(row.UserID)
	if err != nil {
		return nil, err
	}
	out := mapManagedOrder(row, buyer)
	return &out, nil
}

func (s *orderManagementService) Analytics(localShopID uint, from, to string) (*OrderAnalyticsOutput, error) {
	var fromPtr *time.Time
	var toPtr *time.Time
	if strings.TrimSpace(from) != "" {
		v, err := time.Parse("2006-01-02", strings.TrimSpace(from))
		if err != nil {
			return nil, errors.New("from formati noto'g'ri, YYYY-MM-DD bo'lishi kerak")
		}
		v = v.UTC()
		fromPtr = &v
	}
	if strings.TrimSpace(to) != "" {
		v, err := time.Parse("2006-01-02", strings.TrimSpace(to))
		if err != nil {
			return nil, errors.New("to formati noto'g'ri, YYYY-MM-DD bo'lishi kerak")
		}
		v = v.UTC().Add(23*time.Hour + 59*time.Minute + 59*time.Second)
		toPtr = &v
	}
	row, err := s.repo.GetAnalytics(localShopID, fromPtr, toPtr)
	if err != nil {
		return nil, err
	}
	out := &OrderAnalyticsOutput{
		TotalOrders:         row.TotalOrders,
		TotalAmount:         row.TotalAmount,
		DeliveredAmount:     row.DeliveredAmount,
		UndeliveredAmount:   row.UndeliveredAmount,
		TransferredAmount:   row.TransferredAmount,
		UntransferredAmount: row.UntransferredAmount,
	}
	if fromPtr != nil {
		out.From = strings.TrimSpace(from)
	}
	if strings.TrimSpace(to) != "" {
		out.To = strings.TrimSpace(to)
	}
	return out, nil
}

func mapManagedOrder(row *mpDomain.LocalShopOrder, buyer ManagedOrderBuyerOutput) ManagedOrderOutput {
	items := make([]ManagedOrderItemOutput, 0, len(row.Items))
	for _, it := range row.Items {
		items = append(items, ManagedOrderItemOutput{
			ID:                 it.ID,
			LocalShopProductID: it.LocalShopProductID,
			TemplateID:         it.TemplateID,
			ProductName:        it.ProductName,
			UnitPrice:          it.UnitPrice,
			Quantity:           it.Quantity,
			Unit:               it.Unit,
			LineTotal:          it.UnitPrice * it.Quantity,
		})
	}
	out := ManagedOrderOutput{
		ID:               row.ID,
		UserID:           row.UserID,
		Buyer:            buyer,
		LocalShopID:      row.LocalShopID,
		Status:           row.Status,
		CanApprove:       row.Status == mpDomain.LocalShopOrderStatusPending,
		CanCancel:        row.Status == mpDomain.LocalShopOrderStatusPending || row.Status == mpDomain.LocalShopOrderStatusApproved,
		CanAssignCourier: row.Status == mpDomain.LocalShopOrderStatusApproved,
		TotalAmount:      row.TotalAmount,
		ExtraPhone:       row.ExtraPhone,
		AddressNote:      row.AddressNote,
		Items:            items,
		CreatedAt:        row.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:        row.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
	if row.AssignedCourierID != nil {
		id := *row.AssignedCourierID
		out.AssignedCourierID = &id
	}
	if row.CourierAssignedAt != nil {
		out.CourierAssignedAt = row.CourierAssignedAt.Format("2006-01-02T15:04:05Z07:00")
	}
	if row.PaymentTransferredToShopAt != nil {
		out.PaymentTransferredToShopAt = row.PaymentTransferredToShopAt.Format("2006-01-02T15:04:05Z07:00")
	}
	if row.ShopPaymentAcceptedAt != nil {
		out.ShopPaymentAcceptedAt = row.ShopPaymentAcceptedAt.Format("2006-01-02T15:04:05Z07:00")
	}
	return out
}

func (s *orderManagementService) getBuyerMap(rows []mpDomain.LocalShopOrder) (map[uint]ManagedOrderBuyerOutput, error) {
	ids := make([]uint, 0, len(rows))
	seen := map[uint]struct{}{}
	for _, row := range rows {
		if _, ok := seen[row.UserID]; ok {
			continue
		}
		seen[row.UserID] = struct{}{}
		ids = append(ids, row.UserID)
	}
	users, err := s.repo.GetUsersByIDs(ids)
	if err != nil {
		return nil, err
	}
	out := map[uint]ManagedOrderBuyerOutput{}
	for _, u := range users {
		out[u.ID] = mapBuyer(u)
	}
	return out, nil
}

func (s *orderManagementService) getBuyerByID(userID uint) (ManagedOrderBuyerOutput, error) {
	users, err := s.repo.GetUsersByIDs([]uint{userID})
	if err != nil {
		return ManagedOrderBuyerOutput{}, err
	}
	if len(users) == 0 {
		return ManagedOrderBuyerOutput{ID: userID}, nil
	}
	return mapBuyer(users[0]), nil
}

func mapBuyer(u mpDomain.User) ManagedOrderBuyerOutput {
	return ManagedOrderBuyerOutput{
		ID:         u.ID,
		Phone:      u.Phone,
		FirstName:  u.FirstName,
		LastName:   u.LastName,
		Gender:     u.Gender,
		Avatar:     u.Avatar,
		RegionID:   u.RegionID,
		DistrictID: u.DistrictID,
		MFYID:      u.MFYID,
		BirthDate:  u.BirthDate.Format("2006-01-02"),
		Status:     u.Status,
		CreatedAt:  u.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt:  u.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}
}
