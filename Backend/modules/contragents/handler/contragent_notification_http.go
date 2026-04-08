package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/contragents/service"
	coreHandler "backend/modules/core/handler"
	"github.com/gin-gonic/gin"
)

type ContragentNotificationHandler struct {
	svc service.ContragentNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewContragentNotificationHandler(svc service.ContragentNotificationService) *ContragentNotificationHandler {
	return &ContragentNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

// RegisterMeRoutes — /api/v1/contragents/me guruhida chaqiriladi.
func (h *ContragentNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *ContragentNotificationHandler) List(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Kontragent topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, cid)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Kontragent notificationlar olindi", out, nil)
}

func (h *ContragentNotificationHandler) UnreadCount(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Kontragent topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(cid)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *ContragentNotificationHandler) MarkRead(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Kontragent topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(cid, uint(id64)); err != nil {
		if err == service.ErrContragentNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *ContragentNotificationHandler) MarkAllRead(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Kontragent topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(cid); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *ContragentNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "contragents")
}
