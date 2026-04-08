package domain

import "time"

type WorkingHour struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	LocalShopID uint      `gorm:"not null;index:idx_local_shop_weekday,unique" json:"local_shop_id"`
	Weekday     int       `gorm:"not null;index:idx_local_shop_weekday,unique" json:"weekday"` // 1..7 (Mon..Sun)
	IsOff       bool      `gorm:"not null;default:false" json:"is_off"`
	OpenTime    string    `gorm:"size:5" json:"open_time,omitempty"`  // HH:MM
	CloseTime   string    `gorm:"size:5" json:"close_time,omitempty"` // HH:MM
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (WorkingHour) TableName() string {
	return "local_shop_working_hours"
}
