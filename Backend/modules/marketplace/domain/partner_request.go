package domain

import "time"

const (
	PartnerRequestStatusNew           = "new"
	PartnerRequestStatusContacted     = "contacted"
	PartnerRequestStatusDealSigned    = "deal_signed"
	PartnerRequestStatusDealNotSigned = "deal_not_signed"
	PartnerRequestStatusConverted     = "converted"
)

type PartnerRequest struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	MarketplaceUserID     uint       `gorm:"not null;index" json:"marketplace_user_id"`
	CompanyName           string     `gorm:"size:200;not null" json:"company_name"`
	INN                   string     `gorm:"size:12;not null;index" json:"inn"`
	MFO                   string     `gorm:"size:20;not null" json:"mfo"`
	AccountNumber         string     `gorm:"size:64;not null" json:"account_number"`
	ActivityTypeID        uint       `gorm:"not null;index" json:"activity_type_id"`
	RegionID              uint       `gorm:"not null;index" json:"region_id"`
	DistrictID            uint       `gorm:"not null;index" json:"district_id"`
	MFYID                 uint       `gorm:"not null;index" json:"mfy_id"`
	Phone                 string     `gorm:"size:13;not null;index" json:"phone"`
	Status                string     `gorm:"size:30;not null;default:new;index" json:"status"`
	ContactedAt           *time.Time `gorm:"index" json:"contacted_at,omitempty"`
	DealMarkedAt          *time.Time `gorm:"index" json:"deal_marked_at,omitempty"`
	ConvertedAt           *time.Time `gorm:"index" json:"converted_at,omitempty"`
	ConvertedContragentID *uint      `gorm:"index" json:"converted_contragent_id,omitempty"`
	CreatedAt             time.Time  `json:"created_at"`
	UpdatedAt             time.Time  `json:"updated_at"`
}

func (PartnerRequest) TableName() string {
	return "marketplace_partner_requests"
}
