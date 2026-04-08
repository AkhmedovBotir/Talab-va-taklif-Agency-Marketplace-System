package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationNotificationHandler struct {
	svc service.IntegrationNotificationService
	hub *IntegrationNotificationSocketHub
}

func NewIntegrationNotificationHandler(svc service.IntegrationNotificationService) *IntegrationNotificationHandler {
	return &IntegrationNotificationHandler{
		svc: svc,
		hub: IntegrationNotificationHubInstance(),
	}
}

// RegisterRoutes — guruhda allaqachon IntegrationAuthMiddleware bo‘lishi kerak.
// Masalan: api.Group("/integration-notifications").Use(IntegrationAuthMiddleware(...))
func (h *IntegrationNotificationHandler) RegisterRoutes(g *gin.RouterGroup) {
	g.POST("", h.Create)
	g.GET("", h.List)
	g.GET("/:id", h.GetByID)
	g.PUT("/:id", h.Update)
	g.DELETE("/:id", h.Delete)
	g.GET("/ws", h.Socket)
}

func (h *IntegrationNotificationHandler) Create(c *gin.Context) {
	var req service.IntegrationNotificationInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.svc.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	h.hub.BroadcastCreated(row)
	response.JSON(c, http.StatusCreated, "Notification yaratildi", row, nil)
}

func (h *IntegrationNotificationHandler) Socket(c *gin.Context) {
	h.hub.HandleWS(c)
}

func (h *IntegrationNotificationHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Notificationlar ro'yxati olindi", out, nil)
}

func (h *IntegrationNotificationHandler) GetByID(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	row, err := h.svc.GetByID(uint(id64))
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Notification ma'lumoti olindi", row, nil)
}

func (h *IntegrationNotificationHandler) Update(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	var req service.IntegrationNotificationInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.svc.Update(uint(id64), req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Notification yangilandi", row, nil)
}

func (h *IntegrationNotificationHandler) Delete(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err = h.svc.Delete(uint(id64)); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Notification o'chirildi", nil, nil)
}

func (h *IntegrationNotificationHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrIntegrationNotificationNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrIntegrationNotificationTitle, service.ErrIntegrationNotificationMessage,
		service.ErrIntegrationNotificationTypeInvalid, service.ErrIntegrationNotificationTargetType:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

