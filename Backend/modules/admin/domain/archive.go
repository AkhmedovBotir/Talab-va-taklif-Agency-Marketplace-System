package domain

import "time"

const (
	ArchiveTypeAgent           = "agent"
	ArchiveTypeContragent      = "contragent"
	ArchiveTypeLocalShop       = "local-shop"
	ArchiveTypeMarketplaceUser = "marketplace-user"
	ArchiveTypePunkt           = "punkt"
)

type ArchiveLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	EntityType  string    `gorm:"size:40;not null;index" json:"entity_type"`
	EntityID    uint      `gorm:"not null;index" json:"entity_id"`
	DeletedByID uint      `gorm:"not null;index" json:"deleted_by_id"`
	Payload     string    `gorm:"type:text;not null" json:"payload"`
	ArchivedAt  time.Time `gorm:"not null;index" json:"archived_at"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (ArchiveLog) TableName() string {
	return "admin_archive_logs"
}
