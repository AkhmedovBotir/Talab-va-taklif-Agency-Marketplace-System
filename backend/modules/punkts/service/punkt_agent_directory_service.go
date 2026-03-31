package service

import (
	"backend/modules/punkts/repository"
)

type PunktAgentBrief struct {
	ID        uint   `json:"id"`
	Name      string `json:"name"`
	ViloyatID uint   `json:"viloyat_id"`
	TumanID   uint   `json:"tuman_id"`
	MFYID     uint   `json:"mfy_id"`
	Phone     string `json:"phone"`
	Status    string `json:"status"`
}

type PunktAgentDirectoryService struct {
	repo repository.PunktAgentListRepository
}

func NewPunktAgentDirectoryService(repo repository.PunktAgentListRepository) *PunktAgentDirectoryService {
	return &PunktAgentDirectoryService{repo: repo}
}

func (s *PunktAgentDirectoryService) ListForPunkt(punktID, filterMFYID uint) ([]PunktAgentBrief, error) {
	rows, err := s.repo.ListActiveAgentsForPunkt(punktID, filterMFYID)
	if err != nil {
		return nil, err
	}
	out := make([]PunktAgentBrief, 0, len(rows))
	for i := range rows {
		a := &rows[i]
		out = append(out, PunktAgentBrief{
			ID:        a.ID,
			Name:      a.Name,
			ViloyatID: a.RegionID,
			TumanID:   a.DistrictID,
			MFYID:     a.MFYID,
			Phone:     a.Phone,
			Status:    a.Status,
		})
	}
	return out, nil
}
