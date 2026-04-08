package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	coreHandler "backend/modules/core/handler"
	"github.com/gin-gonic/gin"
)

type MarketplaceNotificationHandler struct {
	svc service.MarketplaceNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewMarketplaceNotificationHandler(svc service.MarketplaceNotificationService) *MarketplaceNotificationHandler {
	return &MarketplaceNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

func (h *MarketplaceNotificationHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *MarketplaceNotificationHandler) List(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, userID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Marketplace notificationlar olindi", out, nil)
}

func (h *MarketplaceNotificationHandler) UnreadCount(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(userID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *MarketplaceNotificationHandler) MarkRead(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(userID, uint(id64)); err != nil {
		if err == service.ErrMarketplaceNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *MarketplaceNotificationHandler) MarkAllRead(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(userID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *MarketplaceNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWSForTarget(c, "marketplace")
}
