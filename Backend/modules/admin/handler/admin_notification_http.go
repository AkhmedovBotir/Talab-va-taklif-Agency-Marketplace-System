package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	coreHandler "backend/modules/core/handler"

	"github.com/gin-gonic/gin"
)

type AdminNotificationHandler struct {
	svc service.AdminNotificationService
	hub *coreHandler.IntegrationNotificationSocketHub
}

func NewAdminNotificationHandler(svc service.AdminNotificationService) *AdminNotificationHandler {
	return &AdminNotificationHandler{
		svc: svc,
		hub: coreHandler.IntegrationNotificationHubInstance(),
	}
}

func (h *AdminNotificationHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/admin-notifications")
	grp.Use(auth)
	{
		grp.GET("", h.List)
		grp.GET("/unread-count", h.UnreadCount)
		grp.PATCH("/:id/read", h.MarkRead)
		grp.PATCH("/read-all", h.MarkAllRead)
		grp.GET("/ws", h.Socket)
	}
}

func (h *AdminNotificationHandler) List(c *gin.Context) {
	adminID, ok := getAdminIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Admin topilmadi", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit, adminID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Admin notificationlar olindi", out, nil)
}

func (h *AdminNotificationHandler) UnreadCount(c *gin.Context) {
	adminID, ok := getAdminIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Admin topilmadi", nil, nil)
		return
	}
	n, err := h.svc.UnreadCount(adminID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'qilmagan soni", gin.H{"unread_count": n}, nil)
}

func (h *AdminNotificationHandler) MarkRead(c *gin.Context) {
	adminID, ok := getAdminIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Admin topilmadi", nil, nil)
		return
	}
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.MarkRead(adminID, uint(id64)); err != nil {
		if err == service.ErrAdminNotificationNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'qildi deb belgilandi", nil, nil)
}

func (h *AdminNotificationHandler) MarkAllRead(c *gin.Context) {
	adminID, ok := getAdminIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Admin topilmadi", nil, nil)
		return
	}
	if err := h.svc.MarkAllRead(adminID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha notificationlar o'qildi deb belgilandi", nil, nil)
}

func (h *AdminNotificationHandler) Socket(c *gin.Context) {
	// Admin faqat admins/all nishonli xabarlarni oladi.
	h.hub.HandleWSForTarget(c, "admins")
}

func getAdminIDFromCtx(c *gin.Context) (uint, bool) {
	raw, ok := c.Get("admin_id")
	if !ok {
		return 0, false
	}
	id, ok := raw.(uint)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}
