package domain

import "time"

const (
	TransferStatusSent             = "sent"
	TransferStatusAcceptedByTarget = "accepted_by_target"
	TransferStatusReturnedToSource = "returned_to_source"
	TransferStatusReceivedBySource = "received_by_source"
)

type PunktOrderTransfer struct {
	ID               uint   `gorm:"primaryKey"`
	OrderID          uint   `gorm:"not null;index"`
	SourcePunktID    uint   `gorm:"not null;index"`
	TargetPunktID    uint   `gorm:"not null;index"`
	Status           string `gorm:"size:40;not null;default:sent;index"`
	Note             string `gorm:"type:text"`
	SentAt           *time.Time
	TargetAcceptedAt *time.Time
	TargetReturnedAt *time.Time
	SourceReceivedAt *time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
	Items            []PunktOrderTransferItem `gorm:"foreignKey:TransferID;constraint:OnDelete:CASCADE"`
}

func (PunktOrderTransfer) TableName() string {
	return "punkt_order_transfers"
}

type PunktOrderTransferItem struct {
	ID          uint `gorm:"primaryKey"`
	TransferID  uint `gorm:"not null;index"`
	OrderItemID uint `gorm:"not null;index"`
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

func (PunktOrderTransferItem) TableName() string {
	return "punkt_order_transfer_items"
}
