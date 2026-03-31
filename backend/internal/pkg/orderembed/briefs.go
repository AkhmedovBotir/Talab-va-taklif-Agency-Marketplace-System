package orderembed

import (
	"time"

	admdomain "backend/modules/admin/domain"
	mpdomain "backend/modules/marketplace/domain"
)

type PunktBrief struct {
	ID                   uint   `json:"id"`
	Name                 string `json:"name"`
	ViloyatID            uint   `json:"viloyat_id"`
	TumanID              uint   `json:"tuman_id"`
	Phone                string `json:"phone"`
	Status               string `json:"status"`
	PasswordSetupAllowed bool   `json:"password_setup_allowed"`
	CreatedAt            string `json:"created_at,omitempty"`
	UpdatedAt            string `json:"updated_at,omitempty"`
}

type AgentBrief struct {
	ID                   uint   `json:"id"`
	Name                 string `json:"name"`
	ViloyatID            uint   `json:"viloyat_id"`
	TumanID              uint   `json:"tuman_id"`
	MFYID                uint   `json:"mfy_id"`
	Phone                string `json:"phone"`
	Status               string `json:"status"`
	PasswordSetupAllowed bool   `json:"password_setup_allowed"`
	CreatedAt            string `json:"created_at,omitempty"`
	UpdatedAt            string `json:"updated_at,omitempty"`
}

type ContragentBrief struct {
	ID                   uint   `json:"id"`
	Name                 string `json:"name"`
	INN                  string `json:"inn"`
	RegionID             uint   `json:"region_id"`
	DistrictID           uint   `json:"district_id"`
	MFYID                uint   `json:"mfy_id"`
	Phone                string `json:"phone"`
	Logo                 string `json:"logo,omitempty"`
	ActivityTypeID       uint   `json:"activity_type_id"`
	Status               string `json:"status"`
	PasswordSetupAllowed bool   `json:"password_setup_allowed"`
	CreatedAt            string `json:"created_at,omitempty"`
	UpdatedAt            string `json:"updated_at,omitempty"`
}

type MarketplaceUserBrief struct {
	ID        uint   `json:"id"`
	Phone     string `json:"phone"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func formatTime(t time.Time) string {
	return t.UTC().Format("2006-01-02T15:04:05Z07:00")
}

func PunktFromModel(p *admdomain.Punkt) *PunktBrief {
	if p == nil {
		return nil
	}
	return &PunktBrief{
		ID:                   p.ID,
		Name:                 p.Name,
		ViloyatID:            p.RegionID,
		TumanID:              p.DistrictID,
		Phone:                p.Phone,
		Status:               p.Status,
		PasswordSetupAllowed: p.PasswordSetupAllowed,
		CreatedAt:            formatTime(p.CreatedAt),
		UpdatedAt:            formatTime(p.UpdatedAt),
	}
}

func AgentFromModel(a *admdomain.Agent) *AgentBrief {
	if a == nil {
		return nil
	}
	return &AgentBrief{
		ID:                   a.ID,
		Name:                 a.Name,
		ViloyatID:            a.RegionID,
		TumanID:              a.DistrictID,
		MFYID:                a.MFYID,
		Phone:                a.Phone,
		Status:               a.Status,
		PasswordSetupAllowed: a.PasswordSetupAllowed,
		CreatedAt:            formatTime(a.CreatedAt),
		UpdatedAt:            formatTime(a.UpdatedAt),
	}
}

func ContragentFromModel(c *admdomain.Contragent) *ContragentBrief {
	if c == nil {
		return nil
	}
	return &ContragentBrief{
		ID:                   c.ID,
		Name:                 c.Name,
		INN:                  c.INN,
		RegionID:             c.RegionID,
		DistrictID:           c.DistrictID,
		MFYID:                c.MFYID,
		Phone:                c.Phone,
		Logo:                 c.Logo,
		ActivityTypeID:       c.ActivityTypeID,
		Status:               c.Status,
		PasswordSetupAllowed: c.PasswordSetupAllowed,
		CreatedAt:            formatTime(c.CreatedAt),
		UpdatedAt:            formatTime(c.UpdatedAt),
	}
}

func MarketplaceUserFromModel(u *mpdomain.User) *MarketplaceUserBrief {
	if u == nil {
		return nil
	}
	return &MarketplaceUserBrief{
		ID:        u.ID,
		Phone:     u.Phone,
		FirstName: u.FirstName,
		LastName:  u.LastName,
	}
}

func PunktPtr(m map[uint]PunktBrief, id uint) *PunktBrief {
	if b, ok := m[id]; ok {
		cp := b
		return &cp
	}
	return nil
}

func AgentPtr(m map[uint]AgentBrief, id uint) *AgentBrief {
	if b, ok := m[id]; ok {
		cp := b
		return &cp
	}
	return nil
}

func ContragentPtr(m map[uint]ContragentBrief, id uint) *ContragentBrief {
	if b, ok := m[id]; ok {
		cp := b
		return &cp
	}
	return nil
}

func MarketplaceUserPtr(m map[uint]MarketplaceUserBrief, id uint) *MarketplaceUserBrief {
	if b, ok := m[id]; ok {
		cp := b
		return &cp
	}
	return nil
}

func UniqueUints(ids []uint) []uint {
	if len(ids) == 0 {
		return nil
	}
	seen := make(map[uint]struct{}, len(ids))
	out := make([]uint, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, ok := seen[id]; ok {
			continue
		}
		seen[id] = struct{}{}
		out = append(out, id)
	}
	return out
}
