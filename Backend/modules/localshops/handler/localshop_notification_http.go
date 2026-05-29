package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	coreHandler "backend/modules/core/handler"
	"github.com/gin-gonic/gin"
)

type LocalShopNotificationHandler struct {
	svc service.LocalShopNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewLocalShopNotificationHandler(svc service.LocalShopNotificationService) *LocalShopNotificationHandler {
	return &LocalShopNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

func (h *LocalShopNotificationHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	n := me.Group("/notifications")
	{
		n.GET("", h.List)
		n.GET("/unread-count", h.UnreadCount)
		n.PATCH("/:id/read", h.MarkRead)
		n.PATCH("/read-all", h.MarkAllRead)
		n.GET("/ws", h.Socket)
	}
}

func (h *LocalShopNotificationHandler) List(c *gin.Context) {
	lsID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Mahalla do'kon topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, lsID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Mahalla do'kon notificationlar olindi", out, nil)
}

func (h *LocalShopNotificationHandler) UnreadCount(c *gin.Context) {
	lsID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Mahalla do'kon topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(lsID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *LocalShopNotificationHandler) MarkRead(c *gin.Context) {
	lsID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Mahalla do'kon topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(lsID, uint(id64)); err != nil {
		if err == service.ErrLocalShopNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *LocalShopNotificationHandler) MarkAllRead(c *gin.Context) {
	lsID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Mahalla do'kon topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(lsID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *LocalShopNotificationHandler) Socket(c *gin.Context) {
	shopID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Mahalla do'kon topilmadi", nil, nil)
		return
	}
	h.hub.HandleWSForLocalShop(c, shopID)
}

func localShopIDFromContext(c *gin.Context) (uint, bool) {
	raw, ok := c.Get("local_shop_id")
	if !ok {
		return 0, false
	}
	id, ok := raw.(uint)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}
