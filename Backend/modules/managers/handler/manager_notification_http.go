package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	coreHandler "backend/modules/core/handler"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
)

type ManagerNotificationHandler struct {
	svc service.ManagerNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewManagerNotificationHandler(svc service.ManagerNotificationService) *ManagerNotificationHandler {
	return &ManagerNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

// RegisterMeRoutes — /api/v1/managers/me guruhida chaqiriladi.
func (h *ManagerNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *ManagerNotificationHandler) List(c *gin.Context) {
	managerID, ok := managerIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Menejer topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, managerID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Menejer notificationlar olindi", out, nil)
}

func (h *ManagerNotificationHandler) UnreadCount(c *gin.Context) {
	managerID, ok := managerIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Menejer topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(managerID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *ManagerNotificationHandler) MarkRead(c *gin.Context) {
	managerID, ok := managerIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Menejer topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(managerID, uint(id64)); err != nil {
		if err == service.ErrManagerNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *ManagerNotificationHandler) MarkAllRead(c *gin.Context) {
	managerID, ok := managerIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Menejer topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(managerID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *ManagerNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "managers")
}
