package handler

import (
	"errors"
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type NeighborhoodShopBillingHandler struct {
	svc service.NeighborhoodShopBillingService
}

func NewNeighborhoodShopBillingHandler(svc service.NeighborhoodShopBillingService) *NeighborhoodShopBillingHandler {
	return &NeighborhoodShopBillingHandler{svc: svc}
}

func (h *NeighborhoodShopBillingHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	cfg := api.Group("/neighborhood-shop-monthly-config")
	cfg.Use(auth)
	{
		cfg.GET("", h.GetMonthlyConfig)
		cfg.PUT("", h.UpdateMonthlyConfig)
	}

	sub := api.Group("/neighborhood_shops/:id/subscription")
	sub.Use(auth)
	{
		sub.GET("", h.GetSubscription)
		sub.PUT("", h.UpsertSubscription)
	}
}

func (h *NeighborhoodShopBillingHandler) GetMonthlyConfig(c *gin.Context) {
	out, err := h.svc.GetMonthlyConfig()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Oylik konfig olindi", out, nil)
}

func (h *NeighborhoodShopBillingHandler) UpdateMonthlyConfig(c *gin.Context) {
	var req service.NeighborhoodShopMonthlyConfigInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.UpdateMonthlyConfig(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Oylik konfig yangilandi", out, nil)
}

func (h *NeighborhoodShopBillingHandler) GetSubscription(c *gin.Context) {
	shopID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetSubscription(shopID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla do'koni obunasi olindi", out, nil)
}

func (h *NeighborhoodShopBillingHandler) UpsertSubscription(c *gin.Context) {
	shopID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.NeighborhoodShopSubscriptionInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.UpsertSubscription(shopID, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla do'koni obunasi saqlandi", out, nil)
}

func (h *NeighborhoodShopBillingHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrNeighborhoodShopBillingShopNotFound),
		errors.Is(err, service.ErrNeighborhoodShopSubscriptionNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrNeighborhoodShopBillingTypeInvalid),
		errors.Is(err, service.ErrNeighborhoodShopFreeMonthsInvalid),
		errors.Is(err, service.ErrNeighborhoodShopMonthlyPriceInvalid),
		errors.Is(err, service.ErrNeighborhoodShopConfigMonthlyPriceInvalid):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
