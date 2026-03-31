package orderembed

import (
	admdomain "backend/modules/admin/domain"
	mpdomain "backend/modules/marketplace/domain"

	"gorm.io/gorm"
)

type Loader struct {
	db *gorm.DB
}

func NewLoader(db *gorm.DB) *Loader {
	return &Loader{db: db}
}

func (l *Loader) PunktsByIDs(ids []uint) (map[uint]PunktBrief, error) {
	ids = UniqueUints(ids)
	if len(ids) == 0 {
		return map[uint]PunktBrief{}, nil
	}
	var rows []admdomain.Punkt
	if err := l.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[uint]PunktBrief, len(rows))
	for i := range rows {
		b := PunktFromModel(&rows[i])
		out[rows[i].ID] = *b
	}
	return out, nil
}

func (l *Loader) AgentsByIDs(ids []uint) (map[uint]AgentBrief, error) {
	ids = UniqueUints(ids)
	if len(ids) == 0 {
		return map[uint]AgentBrief{}, nil
	}
	var rows []admdomain.Agent
	if err := l.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[uint]AgentBrief, len(rows))
	for i := range rows {
		b := AgentFromModel(&rows[i])
		out[rows[i].ID] = *b
	}
	return out, nil
}

func (l *Loader) ContragentsByIDs(ids []uint) (map[uint]ContragentBrief, error) {
	ids = UniqueUints(ids)
	if len(ids) == 0 {
		return map[uint]ContragentBrief{}, nil
	}
	var rows []admdomain.Contragent
	if err := l.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[uint]ContragentBrief, len(rows))
	for i := range rows {
		b := ContragentFromModel(&rows[i])
		out[rows[i].ID] = *b
	}
	return out, nil
}

func (l *Loader) MarketplaceUsersByIDs(ids []uint) (map[uint]MarketplaceUserBrief, error) {
	ids = UniqueUints(ids)
	if len(ids) == 0 {
		return map[uint]MarketplaceUserBrief{}, nil
	}
	var rows []mpdomain.User
	if err := l.db.Where("id IN ?", ids).Find(&rows).Error; err != nil {
		return nil, err
	}
	out := make(map[uint]MarketplaceUserBrief, len(rows))
	for i := range rows {
		b := MarketplaceUserFromModel(&rows[i])
		out[rows[i].ID] = *b
	}
	return out, nil
}
