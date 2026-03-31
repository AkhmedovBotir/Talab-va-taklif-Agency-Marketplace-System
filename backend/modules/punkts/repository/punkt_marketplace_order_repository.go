package repository

import (
	"errors"
	"time"

	adminDomain "backend/modules/admin/domain"
	contrDomain "backend/modules/contragents/domain"
	mpdomain "backend/modules/marketplace/domain"
	punktdomain "backend/modules/punkts/domain"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrPunktOrderNotFound       = errors.New("buyurtma topilmadi")
	ErrPunktOrderWrongPunkt     = errors.New("buyurtma bu punktda emas")
	ErrPunktOrderNotInInbox     = errors.New("buyurtma inbox holatida emas")
	ErrPunktOrderNotPending     = errors.New("buyurtma foydalanuvchi tomonidan bekor qilingan yoki yakunlangan")
	ErrPunktOrderAlreadyHandled = errors.New("buyurtma allaqachon qabul yoki rad qilingan")

	ErrPunktOrderFulfillmentWrongState = errors.New("buyurtma punkt logistikasi uchun mos holatda emas")
	ErrPunktOrderNotCollected          = errors.New("buyurtma hali yig‘ilmagan")
	ErrPunktOrderNotReady              = errors.New("buyurtma hali tayyorlangan deb belgilanmagan")
	ErrPunktOrderPayoutInvalid         = errors.New("kontragent foizi noto‘g‘ri yoki qatorlar to‘liq emas")
	ErrPunktOrderNoMFY                 = errors.New("buyurtmada MFY ko‘rsatilmagan, agent tayinlanmaydi")
	ErrPunktOrderAgentInvalid          = errors.New("agent tanlangan tumanda yoki buyurtma MFY si bilan mos emas")
	ErrPunktOrderAgentAlreadyOther     = errors.New("buyurtmaga boshqa agent allaqachon tayinlangan")
	ErrPunktOrderDistrictMismatch      = errors.New("buyurtma marshrut tumani bu punkt tumani bilan mos emas")
	ErrPunktOrderTransferPending       = errors.New("buyurtmada punktlararo transfer yakunlanmagan")

	ErrPunktOrderNoAgentAssigned             = errors.New("buyurtmaga agent tayinlanmagan")
	ErrPunktOrderAgentPaymentNotDeclared     = errors.New("agent punktga to'lovni hali e'lon qilmagan")
	ErrPunktOrderAgentPaymentNotConfirmed    = errors.New("agent to'lovi punkt tomonidan tasdiqlanmagan")
	ErrPunktOrderPostPaymentDeliveredMissing = errors.New("to'lovdan keyingi yetkazish bosqichi hali bajarilmagan")
)

type PunktMarketplaceOrderRepository interface {
	ListByPunktCreatedInRange(punktID uint, startInclusive, endExclusive *time.Time, page, limit int) ([]mpdomain.Order, int64, error)
	GetByIDForPunktWithItems(orderID, punktID uint) (*mpdomain.Order, error)
	AcceptOrderAndCreateLineRequests(punktID, orderID uint) error
	RejectOrder(punktID, orderID uint) error
	ListLineRequestsByOrderID(orderID uint) ([]punktdomain.PunktContragentLineRequest, error)

	MarkPunktCollected(punktID, orderID uint) error
	MarkPunktReady(punktID, orderID uint) error
	SetPunktLinePayoutPercents(punktID, orderID uint, percents map[uint]float64) error
	AssignOrderToAgent(punktID, orderID, agentID uint) error

	ConfirmAgentPaymentToPunkt(punktID, orderID uint) error
	MarkPunktPostPaymentDelivered(punktID, orderID uint) error
	MarkPunktContragentRemainderHandedOver(punktID, orderID uint) error
}

type punktMarketplaceOrderPostgresRepository struct {
	db *gorm.DB
}

func NewPunktMarketplaceOrderRepository(db *gorm.DB) PunktMarketplaceOrderRepository {
	return &punktMarketplaceOrderPostgresRepository{db: db}
}

func (r *punktMarketplaceOrderPostgresRepository) ListByPunktCreatedInRange(
	punktID uint,
	startInclusive, endExclusive *time.Time,
	page, limit int,
) ([]mpdomain.Order, int64, error) {
	q := r.db.Model(&mpdomain.Order{}).Where("assigned_punkt_id = ?", punktID)
	if startInclusive != nil {
		q = q.Where("created_at >= ?", *startInclusive)
	}
	if endExclusive != nil {
		q = q.Where("created_at < ?", *endExclusive)
	}
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	offset := (page - 1) * limit
	q2 := r.db.Where("assigned_punkt_id = ?", punktID)
	if startInclusive != nil {
		q2 = q2.Where("created_at >= ?", *startInclusive)
	}
	if endExclusive != nil {
		q2 = q2.Where("created_at < ?", *endExclusive)
	}
	var rows []mpdomain.Order
	err := q2.Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	if err != nil {
		return nil, 0, err
	}
	return rows, total, nil
}

func (r *punktMarketplaceOrderPostgresRepository) GetByIDForPunktWithItems(orderID, punktID uint) (*mpdomain.Order, error) {
	var row mpdomain.Order
	err := r.db.Where("id = ? AND assigned_punkt_id = ?", orderID, punktID).
		Preload("Items").
		First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *punktMarketplaceOrderPostgresRepository) AcceptOrderAndCreateLineRequests(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var ord mpdomain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND assigned_punkt_id = ?", orderID, punktID).
			First(&ord).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPunktOrderWrongPunkt
		}
		if err != nil {
			return err
		}
		if ord.Status != mpdomain.OrderStatusPending {
			return ErrPunktOrderNotPending
		}
		switch ord.PunktAcceptanceStatus {
		case mpdomain.OrderPunktStatusContragentRequestsCreated:
			return nil
		case mpdomain.OrderPunktStatusInbox:
			// davom etadi
		case mpdomain.OrderPunktStatusRejected:
			return ErrPunktOrderAlreadyHandled
		default:
			return ErrPunktOrderNotInInbox
		}

		var items []mpdomain.OrderItem
		if err := tx.Where("order_id = ?", ord.ID).Find(&items).Error; err != nil {
			return err
		}
		districtID := ord.RoutingDistrictID
		if districtID == 0 {
			return ErrPunktOrderNotInInbox
		}

		for i := range items {
			it := &items[i]
			var n int64
			if err := tx.Model(&contrDomain.ContragentDeliveryDistrict{}).
				Where("contragent_id = ? AND district_id = ?", it.ContragentID, districtID).
				Count(&n).Error; err != nil {
				return err
			}
			if n == 0 {
				continue
			}
			row := &punktdomain.PunktContragentLineRequest{
				OrderID:           ord.ID,
				OrderItemID:       it.ID,
				PunktID:           punktID,
				ContragentID:      it.ContragentID,
				RoutingDistrictID: districtID,
				Status:            punktdomain.LineRequestStatusPending,
			}
			if err := tx.Create(row).Error; err != nil {
				return err
			}
		}

		ord.PunktAcceptanceStatus = mpdomain.OrderPunktStatusContragentRequestsCreated
		return tx.Save(&ord).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) RejectOrder(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var ord mpdomain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND assigned_punkt_id = ?", orderID, punktID).
			First(&ord).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrPunktOrderWrongPunkt
		}
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus == mpdomain.OrderPunktStatusRejected {
			return nil
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusInbox {
			return ErrPunktOrderNotInInbox
		}
		ord.PunktAcceptanceStatus = mpdomain.OrderPunktStatusRejected
		return tx.Save(&ord).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) ListLineRequestsByOrderID(orderID uint) ([]punktdomain.PunktContragentLineRequest, error) {
	var rows []punktdomain.PunktContragentLineRequest
	err := r.db.Where("order_id = ?", orderID).Order("id asc").Find(&rows).Error
	return rows, err
}

func (r *punktMarketplaceOrderPostgresRepository) loadOrderLockedForFulfillment(tx *gorm.DB, punktID, orderID uint) (*mpdomain.Order, error) {
	var ord mpdomain.Order
	err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
		Where("id = ? AND assigned_punkt_id = ?", orderID, punktID).
		First(&ord).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrPunktOrderWrongPunkt
	}
	if err != nil {
		return nil, err
	}
	var punkt adminDomain.Punkt
	if err := tx.First(&punkt, punktID).Error; err != nil {
		return nil, err
	}
	if ord.RoutingDistrictID != punkt.DistrictID {
		return nil, ErrPunktOrderDistrictMismatch
	}
	return &ord, nil
}

func (r *punktMarketplaceOrderPostgresRepository) MarkPunktCollected(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusContragentRequestsCreated {
			return ErrPunktOrderFulfillmentWrongState
		}
		if ord.PunktCollectedAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("punkt_collected_at", now).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) MarkPunktReady(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusContragentRequestsCreated {
			return ErrPunktOrderFulfillmentWrongState
		}
		if ord.PunktCollectedAt == nil {
			return ErrPunktOrderNotCollected
		}
		if ord.PunktReadyAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("punkt_ready_at", now).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) SetPunktLinePayoutPercents(punktID, orderID uint, percents map[uint]float64) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusContragentRequestsCreated {
			return ErrPunktOrderFulfillmentWrongState
		}
		if ord.PunktReadyAt == nil {
			return ErrPunktOrderNotReady
		}
		if ord.AssignedAgentID != nil {
			return ErrPunktOrderFulfillmentWrongState
		}
		var items []mpdomain.OrderItem
		if err := tx.Where("order_id = ?", ord.ID).Find(&items).Error; err != nil {
			return err
		}
		if len(items) == 0 || len(percents) != len(items) {
			return ErrPunktOrderPayoutInvalid
		}
		want := make(map[uint]struct{}, len(items))
		for i := range items {
			want[items[i].ID] = struct{}{}
		}
		for id := range percents {
			if _, ok := want[id]; !ok {
				return ErrPunktOrderPayoutInvalid
			}
		}
		for i := range items {
			p := percents[items[i].ID]
			if p < 0 || p > 100 {
				return ErrPunktOrderPayoutInvalid
			}
			pc := p
			if err := tx.Model(&mpdomain.OrderItem{}).
				Where("id = ? AND order_id = ?", items[i].ID, ord.ID).
				Update("punkt_contragent_payout_percent", pc).Error; err != nil {
				return err
			}
		}
		return nil
	})
}

func (r *punktMarketplaceOrderPostgresRepository) AssignOrderToAgent(punktID, orderID, agentID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusContragentRequestsCreated {
			return ErrPunktOrderFulfillmentWrongState
		}
		if ord.SnapMFYID == 0 {
			return ErrPunktOrderNoMFY
		}
		if ord.AssignedAgentID != nil {
			if *ord.AssignedAgentID == agentID {
				return nil
			}
			return ErrPunktOrderAgentAlreadyOther
		}
		var transferN int64
		if err := tx.Model(&punktdomain.PunktOrderTransfer{}).
			Where("order_id = ? AND status IN ?", ord.ID, []string{
				punktdomain.TransferStatusSent,
				punktdomain.TransferStatusAcceptedByTarget,
				punktdomain.TransferStatusReturnedToSource,
			}).Count(&transferN).Error; err != nil {
			return err
		}
		if transferN > 0 {
			return ErrPunktOrderTransferPending
		}
		var items []mpdomain.OrderItem
		if err := tx.Where("order_id = ?", ord.ID).Find(&items).Error; err != nil {
			return err
		}
		for i := range items {
			if items[i].PunktContragentPayoutPercent == nil {
				return ErrPunktOrderPayoutInvalid
			}
		}
		var ag adminDomain.Agent
		if err := tx.First(&ag, agentID).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrPunktOrderAgentInvalid
			}
			return err
		}
		var punkt adminDomain.Punkt
		if err := tx.First(&punkt, punktID).Error; err != nil {
			return err
		}
		if ag.DistrictID != punkt.DistrictID || ag.MFYID != ord.SnapMFYID || ag.Status != adminDomain.StatusActive {
			return ErrPunktOrderAgentInvalid
		}
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("assigned_agent_id", agentID).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) ConfirmAgentPaymentToPunkt(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.AssignedAgentID == nil {
			return ErrPunktOrderNoAgentAssigned
		}
		if ord.AgentDeclaredPaymentToPunktAt == nil {
			return ErrPunktOrderAgentPaymentNotDeclared
		}
		if ord.PunktConfirmedAgentPaymentAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("punkt_confirmed_agent_payment_at", now).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) MarkPunktPostPaymentDelivered(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktConfirmedAgentPaymentAt == nil {
			return ErrPunktOrderAgentPaymentNotConfirmed
		}
		if ord.PunktPostPaymentDeliveredAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("punkt_post_payment_delivered_at", now).Error
	})
}

func (r *punktMarketplaceOrderPostgresRepository) MarkPunktContragentRemainderHandedOver(punktID, orderID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		ord, err := r.loadOrderLockedForFulfillment(tx, punktID, orderID)
		if err != nil {
			return err
		}
		if ord.PunktPostPaymentDeliveredAt == nil {
			return ErrPunktOrderPostPaymentDeliveredMissing
		}
		if ord.PunktContragentRemainderHandedOverAt != nil {
			return nil
		}
		now := time.Now().UTC()
		return tx.Model(&mpdomain.Order{}).Where("id = ?", ord.ID).Update("punkt_contragent_remainder_handed_over_at", now).Error
	})
}
