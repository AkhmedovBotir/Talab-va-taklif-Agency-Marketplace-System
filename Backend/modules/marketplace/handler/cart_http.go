package handler

import (
	"errors"
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type CartHandler struct {
	svc service.MarketplaceCartService
}

func NewCartHandler(svc service.MarketplaceCartService) *CartHandler {
	return &CartHandler{svc: svc}
}

func (h *CartHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	{
		me.GET("/cart", h.GetCart)
		me.DELETE("/cart", h.ClearCart)
		me.POST("/cart/items", h.AddItem)
		me.PUT("/cart/items/:id", h.UpdateItem)
		me.DELETE("/cart/items/:id", h.DeleteItem)
	}
}

func (h *CartHandler) GetCart(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	out, err := h.svc.GetCart(userID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Korzinka olindi", out, nil)
}

type cartAddRequest struct {
	ProductID uint    `json:"product_id" binding:"required"`
	Quantity  float64 `json:"quantity" binding:"required"`
}

func (h *CartHandler) AddItem(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	var req cartAddRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "xato so'rov", nil, err.Error())
		return
	}
	out, err := h.svc.AddItem(userID, req.ProductID, req.Quantity)
	if err != nil {
		h.cartError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Korzinkaga qo'shildi", out, nil)
}

type cartUpdateRequest struct {
	Quantity float64 `json:"quantity" binding:"required"`
}

func (h *CartHandler) UpdateItem(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	lineID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "id noto'g'ri", nil, nil)
		return
	}
	var req cartUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "xato so'rov", nil, err.Error())
		return
	}
	out, err := h.svc.UpdateItemQuantity(userID, lineID, req.Quantity)
	if err != nil {
		h.cartError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Korzinka yangilandi", out, nil)
}

func (h *CartHandler) DeleteItem(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	lineID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "id noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.RemoveItem(userID, lineID)
	if err != nil {
		h.cartError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "O'chirildi", out, nil)
}

func (h *CartHandler) ClearCart(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	if err := h.svc.Clear(userID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Korzinka tozalandi", gin.H{"items": []any{}, "total_lines": 0}, nil)
}

func (h *CartHandler) cartError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrCartInvalidQuantity):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrCartProductUnavailable):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrCartLineNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
