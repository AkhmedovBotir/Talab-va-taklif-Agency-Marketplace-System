package handler

import (
	"errors"
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type ProductRatingHandler struct {
	svc service.ProductRatingService
}

func NewProductRatingHandler(svc service.ProductRatingService) *ProductRatingHandler {
	return &ProductRatingHandler{svc: svc}
}

func (h *ProductRatingHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	me.POST("/orders/:id/ratings", h.SubmitOrderRatings)
}

func (h *ProductRatingHandler) SubmitOrderRatings(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	orderID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.SubmitProductRatingsInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.svc.SubmitForOrder(userID, orderID, req); err != nil {
		switch {
		case errors.Is(err, service.ErrProductRatingItemsRequired),
			errors.Is(err, service.ErrProductRatingItemNotInOrder),
			errors.Is(err, service.ErrProductRatingScoreInvalid),
			errors.Is(err, service.ErrProductRatingTemplateNotFound):
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case errors.Is(err, service.ErrProductRatingOrderNotDelivered):
			response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusOK, "Baholar saqlandi", nil, nil)
}
