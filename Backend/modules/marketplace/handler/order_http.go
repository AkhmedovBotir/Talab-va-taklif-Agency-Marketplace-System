package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct {
	svc service.MarketplaceOrderService
}

func NewOrderHandler(svc service.MarketplaceOrderService) *OrderHandler {
	return &OrderHandler{svc: svc}
}

func (h *OrderHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	{
		me.GET("/orders", h.List)
		me.POST("/orders", h.Create)
		me.GET("/orders/:id", h.GetByID)
		me.PATCH("/orders/:id/cancel", h.Cancel)
	}
}

func (h *OrderHandler) Create(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	var req service.CreateOrderInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.Create(userID, req)
	if err != nil {
		h.orderErr(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Buyurtma qabul qilindi", out, nil)
}

func (h *OrderHandler) List(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Buyurtmalar olindi", out, nil)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Buyurtma olindi", out, nil)
}

func (h *OrderHandler) Cancel(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Buyurtma bekor qilindi", out, nil)
}

func (h *OrderHandler) orderErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrOrderNoDefaultAddress),
		errors.Is(err, service.ErrOrderInvalidAddress),
		errors.Is(err, service.ErrOrderEmptyItems),
		errors.Is(err, service.ErrOrderProductUnavailable),
		errors.Is(err, service.ErrOrderInvalidQuantity),
		errors.Is(err, service.ErrOrderExtraPhoneInvalid):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderInsufficientStock):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderCannotCancel):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderRestoreProductMissing):
		response.JSON(c, http.StatusInternalServerError, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
