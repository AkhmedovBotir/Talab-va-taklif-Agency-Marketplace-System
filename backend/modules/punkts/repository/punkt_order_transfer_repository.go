package repository

import (
	"errors"
	"time"

	admdomain "backend/modules/admin/domain"
	mpdomain "backend/modules/marketplace/domain"
	punktdomain "backend/modules/punkts/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var (
	ErrTransferOrderNotFound      = errors.New("buyurtma topilmadi")
	ErrTransferTargetPunktInvalid = errors.New("qabul qiluvchi punkt noto'g'ri")
	ErrTransferOrderStateInvalid  = errors.New("buyurtma holati transfer uchun mos emas")
	ErrTransferItemInvalid        = errors.New("transfer qatorlari noto'g'ri")
	ErrTransferAlreadyActive      = errors.New("buyurtmada tugallanmagan transfer mavjud")
	ErrTransferNotFound           = errors.New("transfer topilmadi")
	ErrTransferAccessDenied       = errors.New("transferga ruxsat yo'q")
	ErrTransferWrongState         = errors.New("transfer holati bu amal uchun mos emas")
	ErrTransferPendingForAssign   = errors.New("transfer yakunlanmagan, agentga topshirib bo'lmaydi")
)

type PunktOrderTransferRepository interface {
	Create(sourcePunktID, orderID, targetPunktID uint, note string, orderItemIDs []uint) (*punktdomain.PunktOrderTransfer, error)
	ListOutgoing(punktID uint, page, limit int) ([]punktdomain.PunktOrderTransfer, int64, error)
	ListIncoming(punktID uint, page, limit int) ([]punktdomain.PunktOrderTransfer, int64, error)
	GetByIDForPunkt(transferID, punktID uint) (*punktdomain.PunktOrderTransfer, error)
	AcceptByTarget(transferID, targetPunktID uint) error
	ReturnByTarget(transferID, targetPunktID uint) error
	ConfirmReceivedBySource(transferID, sourcePunktID uint) error
	HasPendingByOrder(orderID uint) (bool, error)
}

type punktOrderTransferPostgresRepository struct {
	db *gorm.DB
}

func NewPunktOrderTransferRepository(db *gorm.DB) PunktOrderTransferRepository {
	return &punktOrderTransferPostgresRepository{db: db}
}

func (r *punktOrderTransferPostgresRepository) Create(sourcePunktID, orderID, targetPunktID uint, note string, orderItemIDs []uint) (*punktdomain.PunktOrderTransfer, error) {
	var out *punktdomain.PunktOrderTransfer
	err := r.db.Transaction(func(tx *gorm.DB) error {
		if sourcePunktID == targetPunktID {
			return ErrTransferTargetPunktInvalid
		}
		var target admdomain.Punkt
		if err := tx.Where("id = ? AND status = ?", targetPunktID, admdomain.StatusActive).First(&target).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return ErrTransferTargetPunktInvalid
			}
			return err
		}
		var ord mpdomain.Order
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).
			Where("id = ? AND assigned_punkt_id = ?", orderID, sourcePunktID).
			First(&ord).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTransferOrderNotFound
		}
		if err != nil {
			return err
		}
		if ord.PunktAcceptanceStatus != mpdomain.OrderPunktStatusContragentRequestsCreated || ord.AssignedAgentID != nil {
			return ErrTransferOrderStateInvalid
		}
		var n int64
		if err := tx.Model(&punktdomain.PunktOrderTransfer{}).
			Where("order_id = ? AND status IN ?", orderID, []string{
				punktdomain.TransferStatusSent,
				punktdomain.TransferStatusAcceptedByTarget,
				punktdomain.TransferStatusReturnedToSource,
			}).Count(&n).Error; err != nil {
			return err
		}
		if n > 0 {
			return ErrTransferAlreadyActive
		}
		var items []mpdomain.OrderItem
		if err := tx.Where("order_id = ?", orderID).Find(&items).Error; err != nil {
			return err
		}
		if len(items) == 0 {
			return ErrTransferItemInvalid
		}
		allowed := make(map[uint]struct{}, len(items))
		allIDs := make([]uint, 0, len(items))
		for i := range items {
			allowed[items[i].ID] = struct{}{}
			allIDs = append(allIDs, items[i].ID)
		}
		if len(orderItemIDs) == 0 {
			orderItemIDs = allIDs
		}
		uniq := make(map[uint]struct{}, len(orderItemIDs))
		finalIDs := make([]uint, 0, len(orderItemIDs))
		for _, id := range orderItemIDs {
			if _, ok := allowed[id]; !ok {
				return ErrTransferItemInvalid
			}
			if _, ok := uniq[id]; ok {
				continue
			}
			uniq[id] = struct{}{}
			finalIDs = append(finalIDs, id)
		}
		if len(finalIDs) == 0 {
			return ErrTransferItemInvalid
		}
		now := time.Now().UTC()
		row := &punktdomain.PunktOrderTransfer{
			OrderID:       orderID,
			SourcePunktID: sourcePunktID,
			TargetPunktID: targetPunktID,
			Status:        punktdomain.TransferStatusSent,
			Note:          note,
			SentAt:        &now,
		}
		if err := tx.Create(row).Error; err != nil {
			return err
		}
		for _, id := range finalIDs {
			it := &punktdomain.PunktOrderTransferItem{TransferID: row.ID, OrderItemID: id}
			if err := tx.Create(it).Error; err != nil {
				return err
			}
		}
		if err := tx.Preload("Items").First(row, row.ID).Error; err != nil {
			return err
		}
		out = row
		return nil
	})
	return out, err
}

func (r *punktOrderTransferPostgresRepository) listByRole(col string, punktID uint, page, limit int) ([]punktdomain.PunktOrderTransfer, int64, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	q := r.db.Model(&punktdomain.PunktOrderTransfer{}).Where(col+" = ?", punktID)
	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}
	offset := (page - 1) * limit
	var rows []punktdomain.PunktOrderTransfer
	err := r.db.Where(col+" = ?", punktID).Preload("Items").Order("id desc").Offset(offset).Limit(limit).Find(&rows).Error
	return rows, total, err
}

func (r *punktOrderTransferPostgresRepository) ListOutgoing(punktID uint, page, limit int) ([]punktdomain.PunktOrderTransfer, int64, error) {
	return r.listByRole("source_punkt_id", punktID, page, limit)
}

func (r *punktOrderTransferPostgresRepository) ListIncoming(punktID uint, page, limit int) ([]punktdomain.PunktOrderTransfer, int64, error) {
	return r.listByRole("target_punkt_id", punktID, page, limit)
}

func (r *punktOrderTransferPostgresRepository) GetByIDForPunkt(transferID, punktID uint) (*punktdomain.PunktOrderTransfer, error) {
	var row punktdomain.PunktOrderTransfer
	err := r.db.Where("id = ? AND (source_punkt_id = ? OR target_punkt_id = ?)", transferID, punktID, punktID).
		Preload("Items").First(&row).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrTransferNotFound
	}
	if err != nil {
		return nil, err
	}
	return &row, nil
}

func (r *punktOrderTransferPostgresRepository) AcceptByTarget(transferID, targetPunktID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var row punktdomain.PunktOrderTransfer
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transferID).First(&row).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTransferNotFound
		}
		if err != nil {
			return err
		}
		if row.TargetPunktID != targetPunktID {
			return ErrTransferAccessDenied
		}
		if row.Status == punktdomain.TransferStatusAcceptedByTarget {
			return nil
		}
		if row.Status != punktdomain.TransferStatusSent {
			return ErrTransferWrongState
		}
		now := time.Now().UTC()
		return tx.Model(&punktdomain.PunktOrderTransfer{}).Where("id = ?", row.ID).Updates(map[string]interface{}{
			"status":             punktdomain.TransferStatusAcceptedByTarget,
			"target_accepted_at": now,
		}).Error
	})
}

func (r *punktOrderTransferPostgresRepository) ReturnByTarget(transferID, targetPunktID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var row punktdomain.PunktOrderTransfer
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transferID).First(&row).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTransferNotFound
		}
		if err != nil {
			return err
		}
		if row.TargetPunktID != targetPunktID {
			return ErrTransferAccessDenied
		}
		if row.Status == punktdomain.TransferStatusReturnedToSource {
			return nil
		}
		if row.Status != punktdomain.TransferStatusAcceptedByTarget {
			return ErrTransferWrongState
		}
		now := time.Now().UTC()
		return tx.Model(&punktdomain.PunktOrderTransfer{}).Where("id = ?", row.ID).Updates(map[string]interface{}{
			"status":             punktdomain.TransferStatusReturnedToSource,
			"target_returned_at": now,
		}).Error
	})
}

func (r *punktOrderTransferPostgresRepository) ConfirmReceivedBySource(transferID, sourcePunktID uint) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		var row punktdomain.PunktOrderTransfer
		err := tx.Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", transferID).First(&row).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return ErrTransferNotFound
		}
		if err != nil {
			return err
		}
		if row.SourcePunktID != sourcePunktID {
			return ErrTransferAccessDenied
		}
		if row.Status == punktdomain.TransferStatusReceivedBySource {
			return nil
		}
		if row.Status != punktdomain.TransferStatusReturnedToSource {
			return ErrTransferWrongState
		}
		now := time.Now().UTC()
		return tx.Model(&punktdomain.PunktOrderTransfer{}).Where("id = ?", row.ID).Updates(map[string]interface{}{
			"status":             punktdomain.TransferStatusReceivedBySource,
			"source_received_at": now,
		}).Error
	})
}

func (r *punktOrderTransferPostgresRepository) HasPendingByOrder(orderID uint) (bool, error) {
	var n int64
	err := r.db.Model(&punktdomain.PunktOrderTransfer{}).
		Where("order_id = ? AND status IN ?", orderID, []string{
			punktdomain.TransferStatusSent,
			punktdomain.TransferStatusAcceptedByTarget,
			punktdomain.TransferStatusReturnedToSource,
		}).Count(&n).Error
	return n > 0, err
}
