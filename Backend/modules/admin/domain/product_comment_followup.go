package domain

import "time"

const (
	ProductCommentCaseStatusOpen      = "open"
	ProductCommentCaseStatusEscalated = "escalated_to_admin"
	ProductCommentCaseStatusResolved  = "resolved"
)

const (
	ProductCommentActionNote     = "note"
	ProductCommentActionCall     = "call"
	ProductCommentActionEscalate = "escalate_to_admin"
	ProductCommentActionResolve  = "resolve"
)

type ProductCommentCase struct {
	ID               uint       `gorm:"primaryKey" json:"id"`
	RatingID         uint       `gorm:"not null;uniqueIndex" json:"rating_id"`
	Status           string     `gorm:"size:40;not null;default:open;index" json:"status"`
	EscalatedToAdmin bool       `gorm:"not null;default:false;index" json:"escalated_to_admin"`
	LastContactAt    *time.Time `json:"last_contact_at,omitempty"`
	ResolvedAt       *time.Time `json:"resolved_at,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

func (ProductCommentCase) TableName() string {
	return "admin_product_comment_cases"
}

type ProductCommentActivity struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	CaseID    uint      `gorm:"not null;index" json:"case_id"`
	ActorRole string    `gorm:"size:16;not null" json:"actor_role"` // admin | manager
	ActorID   uint      `gorm:"not null;index" json:"actor_id"`
	Action    string    `gorm:"size:40;not null;index" json:"action"`
	Note      string    `gorm:"type:text" json:"note,omitempty"`
	CreatedAt time.Time `json:"created_at"`
}

func (ProductCommentActivity) TableName() string {
	return "admin_product_comment_activities"
}

