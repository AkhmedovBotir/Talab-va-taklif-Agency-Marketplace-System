package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	coreHandler "backend/modules/core/handler"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type PunktNotificationHandler struct {
	svc service.PunktNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewPunktNotificationHandler(svc service.PunktNotificationService) *PunktNotificationHandler {
	return &PunktNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

// RegisterMeRoutes — /api/v1/punkts/me guruhida chaqiriladi.
func (h *PunktNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *PunktNotificationHandler) List(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, punktID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Punkt notificationlar olindi", out, nil)
}

func (h *PunktNotificationHandler) UnreadCount(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(punktID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *PunktNotificationHandler) MarkRead(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(punktID, uint(id64)); err != nil {
		if err == service.ErrPunktNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *PunktNotificationHandler) MarkAllRead(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(punktID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *PunktNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "punkts")
}
