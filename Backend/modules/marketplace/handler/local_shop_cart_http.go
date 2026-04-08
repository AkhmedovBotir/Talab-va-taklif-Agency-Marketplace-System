package handler

import (
	"errors"
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type LocalShopCartHandler struct {
	svc service.LocalShopCartService
}

func NewLocalShopCartHandler(svc service.LocalShopCartService) *LocalShopCartHandler {
	return &LocalShopCartHandler{svc: svc}
}

func (h *LocalShopCartHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	{
		me.GET("/local-shop-cart", h.GetCart)
		me.DELETE("/local-shop-cart", h.ClearCart)
		me.POST("/local-shop-cart/items", h.AddItem)
		me.PUT("/local-shop-cart/items/:id", h.UpdateItem)
		me.DELETE("/local-shop-cart/items/:id", h.DeleteItem)
	}
}

func (h *LocalShopCartHandler) GetCart(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Maxalla savatchasi olindi", out, nil)
}

type localShopCartAddRequest struct {
	LocalShopProductID uint    `json:"local_shop_product_id" binding:"required"`
	Quantity           float64 `json:"quantity" binding:"required"`
}

func (h *LocalShopCartHandler) AddItem(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	var req localShopCartAddRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "xato so'rov", nil, err.Error())
		return
	}
	out, err := h.svc.AddItem(userID, req.LocalShopProductID, req.Quantity)
	if err != nil {
		h.cartError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla savatchasiga qo'shildi", out, nil)
}

type localShopCartUpdateRequest struct {
	Quantity float64 `json:"quantity" binding:"required"`
}

func (h *LocalShopCartHandler) UpdateItem(c *gin.Context) {
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
	var req localShopCartUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "xato so'rov", nil, err.Error())
		return
	}
	out, err := h.svc.UpdateItemQuantity(userID, lineID, req.Quantity)
	if err != nil {
		h.cartError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla savatchasi yangilandi", out, nil)
}

func (h *LocalShopCartHandler) DeleteItem(c *gin.Context) {
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

func (h *LocalShopCartHandler) ClearCart(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	if err := h.svc.Clear(userID); err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla savatchasi tozalandi", gin.H{"items": []any{}, "total_lines": 0}, nil)
}

func (h *LocalShopCartHandler) cartError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrLocalShopCartInvalidQuantity):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrLocalShopCartProductUnavailable):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrLocalShopCartLineNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
