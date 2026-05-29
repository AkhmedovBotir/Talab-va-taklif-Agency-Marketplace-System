package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type PunktAgentsHandler struct {
	svc *service.PunktAgentDirectoryService
}

func NewPunktAgentsHandler(svc *service.PunktAgentDirectoryService) *PunktAgentsHandler {
	return &PunktAgentsHandler{svc: svc}
}

func (h *PunktAgentsHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/agents", h.List)
}

func (h *PunktAgentsHandler) List(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	var filterMFY uint
	if raw := c.Query("mfy_id"); raw != "" {
		v, err := strconv.ParseUint(raw, 10, 64)
		if err != nil || v == 0 {
			response.JSON(c, http.StatusBadRequest, "mfy_id noto'g'ri", nil, nil)
			return
		}
		filterMFY = uint(v)
	}
	out, err := h.svc.ListForPunkt(punktID, filterMFY)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Agentlar olindi", out, nil)
}
