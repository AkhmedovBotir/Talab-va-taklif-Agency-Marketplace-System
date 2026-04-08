package handler

import (
	"net/http"
	"time"

	"backend/internal/pkg/response"
	"backend/modules/agents/service"
	"github.com/gin-gonic/gin"
)

type AgentKPIHandler struct {
	svc *service.AgentKPIService
}

func NewAgentKPIHandler(svc *service.AgentKPIService) *AgentKPIHandler {
	return &AgentKPIHandler{svc: svc}
}

func (h *AgentKPIHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/kpi/today", h.Today)
	me.GET("/kpi/history", h.History)
}

func (h *AgentKPIHandler) Today(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent autentifikatsiyasi kerak", nil, nil)
		return
	}
	out, err := h.svc.Today(agentID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", out, nil)
}

func (h *AgentKPIHandler) History(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent autentifikatsiyasi kerak", nil, nil)
		return
	}
	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		now := time.Now().UTC()
		to = now.Format("2006-01-02")
		from = now.AddDate(0, 0, -29).Format("2006-01-02")
	}
	out, err := h.svc.History(agentID, from, to)
	if err != nil {
		if err == service.ErrAgentKPIHistoryRange {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", out, nil)
}
