package domain

import "time"

const (
	LineRequestStatusPending    = "pending"
	LineRequestStatusAccepted   = "accepted"
	LineRequestStatusPreparing  = "preparing"
	LineRequestStatusDelivered  = "delivered"
	LineRequestStatusRejected   = "rejected"
)

// PunktContragentLineRequest — bitta buyurtma qatori uchun bitta kontragentga yuboriladigan so'rov.
type PunktContragentLineRequest struct {
	ID                uint `gorm:"primaryKey"`
	OrderID           uint `gorm:"not null;index"`
	OrderItemID       uint `gorm:"not null;uniqueIndex"`
	PunktID           uint `gorm:"not null;index"`
	ContragentID      uint `gorm:"not null;index"`
	RoutingDistrictID uint `gorm:"not null;index"`
	Status            string `gorm:"size:32;not null;default:pending;index"`
	CreatedAt         time.Time
	UpdatedAt         time.Time
}

func (PunktContragentLineRequest) TableName() string {
	return "punkt_contragent_line_requests"
}
