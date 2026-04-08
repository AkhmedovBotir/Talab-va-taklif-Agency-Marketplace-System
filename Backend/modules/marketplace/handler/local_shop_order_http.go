package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type LocalShopOrderHandler struct {
	svc service.LocalShopOrderService
}

func NewLocalShopOrderHandler(svc service.LocalShopOrderService) *LocalShopOrderHandler {
	return &LocalShopOrderHandler{svc: svc}
}

func (h *LocalShopOrderHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	{
		me.GET("/local-shop-orders", h.List)
		me.POST("/local-shop-orders", h.Create)
		me.GET("/local-shop-orders/:id", h.GetByID)
		me.PATCH("/local-shop-orders/:id/cancel", h.Cancel)
	}
}

func (h *LocalShopOrderHandler) Create(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	var req service.CreateLocalShopOrderInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.Create(userID, req)
	if err != nil {
		h.orderErr(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Maxalla buyurtmasi qabul qilindi", out, nil)
}

func (h *LocalShopOrderHandler) List(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.List(userID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla buyurtmalari olindi", out, nil)
}

func (h *LocalShopOrderHandler) GetByID(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetByID(userID, id)
	if err != nil {
		h.orderErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla buyurtmasi olindi", out, nil)
}

func (h *LocalShopOrderHandler) Cancel(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.Cancel(userID, id)
	if err != nil {
		h.orderErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla buyurtmasi bekor qilindi", out, nil)
}

func (h *LocalShopOrderHandler) orderErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrLocalShopOrderNoDefaultAddress),
		errors.Is(err, service.ErrLocalShopOrderInvalidAddress),
		errors.Is(err, service.ErrLocalShopOrderShopRequired),
		errors.Is(err, service.ErrLocalShopOrderEmptyItems),
		errors.Is(err, service.ErrLocalShopOrderProductUnavailable),
		errors.Is(err, service.ErrLocalShopOrderInvalidQuantity),
		errors.Is(err, service.ErrLocalShopOrderExtraPhoneInvalid):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrLocalShopOrderInsufficientStock),
		errors.Is(err, service.ErrLocalShopOrderCannotCancel):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrLocalShopOrderNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
