package domain

import "time"

const (
	NotificationTypeInfo         = "info"
	NotificationTypeWarning      = "warning"
	NotificationTypeSuccess      = "success"
	NotificationTypeError        = "error"
	NotificationTypeUpdate       = "update"
	NotificationTypeAnnouncement = "announcement"
)

const (
	NotificationTargetAll               = "all"
	NotificationTargetAdmins            = "admins"
	NotificationTargetAgents            = "agents"
	NotificationTargetContragents       = "contragents"
	NotificationTargetMarketplace       = "marketplace"
	NotificationTargetManagers          = "managers"
	NotificationTargetPunkts            = "punkts"
	NotificationTargetLocalShops        = "localshops"
	NotificationTargetDeliveryProviders = "deliveryproviders"
)

type IntegrationNotification struct {
	ID                 uint      `gorm:"primaryKey" json:"id"`
	Title              string    `gorm:"size:255;not null" json:"title"`
	Message            string    `gorm:"type:text;not null" json:"message"`
	Type               string    `gorm:"size:24;not null;index" json:"type"`
	TargetType         string    `gorm:"size:32;not null;index" json:"target_type"`
	NeighborhoodShopID *uint     `gorm:"index" json:"neighborhood_shop_id,omitempty"`
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

func (IntegrationNotification) TableName() string {
	return "integration_notifications"
}

