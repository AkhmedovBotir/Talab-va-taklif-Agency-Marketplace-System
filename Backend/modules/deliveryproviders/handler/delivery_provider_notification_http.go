package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	coreHandler "backend/modules/core/handler"
	"backend/modules/deliveryproviders/service"
	"github.com/gin-gonic/gin"
)

type DeliveryProviderNotificationHandler struct {
	svc service.DeliveryProviderNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewDeliveryProviderNotificationHandler(svc service.DeliveryProviderNotificationService) *DeliveryProviderNotificationHandler {
	return &DeliveryProviderNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

// RegisterMeRoutes — /api/v1/delivery-providers/me guruhida chaqiriladi.
func (h *DeliveryProviderNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *DeliveryProviderNotificationHandler) List(c *gin.Context) {
	dpID, ok := deliveryProviderIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Yetkazuvchi topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, dpID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Yetkazuvchi notificationlar olindi", out, nil)
}

func (h *DeliveryProviderNotificationHandler) UnreadCount(c *gin.Context) {
	dpID, ok := deliveryProviderIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Yetkazuvchi topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(dpID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *DeliveryProviderNotificationHandler) MarkRead(c *gin.Context) {
	dpID, ok := deliveryProviderIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Yetkazuvchi topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(dpID, uint(id64)); err != nil {
		if err == service.ErrDeliveryProviderNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *DeliveryProviderNotificationHandler) MarkAllRead(c *gin.Context) {
	dpID, ok := deliveryProviderIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Yetkazuvchi topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(dpID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *DeliveryProviderNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "deliveryproviders")
}
