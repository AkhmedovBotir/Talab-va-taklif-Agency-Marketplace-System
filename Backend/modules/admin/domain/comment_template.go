package domain

import "time"

type CommentTemplate struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	Comment   string    `gorm:"type:text;not null" json:"comment"`
	SortOrder int       `gorm:"not null;default:0;index" json:"sort_order"`
	Status    string    `gorm:"size:20;not null;default:active;index" json:"status"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (CommentTemplate) TableName() string {
	return "admin_comment_templates"
}
