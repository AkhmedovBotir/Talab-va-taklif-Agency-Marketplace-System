package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/agents/service"
	coreHandler "backend/modules/core/handler"
	"github.com/gin-gonic/gin"
)

type AgentNotificationHandler struct {
	svc service.AgentNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewAgentNotificationHandler(svc service.AgentNotificationService) *AgentNotificationHandler {
	return &AgentNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

// RegisterMeRoutes — /api/v1/agents/me guruhida chaqiriladi.
func (h *AgentNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *AgentNotificationHandler) List(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, agentID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Agent notificationlar olindi", out, nil)
}

func (h *AgentNotificationHandler) UnreadCount(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(agentID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *AgentNotificationHandler) MarkRead(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(agentID, uint(id64)); err != nil {
		if err == service.ErrAgentNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *AgentNotificationHandler) MarkAllRead(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Agent topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(agentID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *AgentNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "agents")
}
