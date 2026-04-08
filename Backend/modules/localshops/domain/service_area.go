package domain

import "time"

type ServiceArea struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	LocalShopID uint      `gorm:"not null;index:idx_local_shop_mfy,unique" json:"local_shop_id"`
	MFYID       uint      `gorm:"not null;index:idx_local_shop_mfy,unique;index" json:"mfy_id"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (ServiceArea) TableName() string {
	return "local_shop_service_areas"
}
