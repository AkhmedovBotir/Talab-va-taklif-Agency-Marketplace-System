package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
)

type PartnerRequestHandler struct {
	svc service.PartnerRequestService
}

func NewPartnerRequestHandler(svc service.PartnerRequestService) *PartnerRequestHandler {
	return &PartnerRequestHandler{svc: svc}
}

func (h *PartnerRequestHandler) RegisterRoutes(api *gin.RouterGroup, authMiddleware gin.HandlerFunc) {
	me := api.Group("/marketplace/me")
	me.Use(authMiddleware)
	me.GET("/partner-requests", h.List)
	me.POST("/partner-requests", h.Create)
}

func (h *PartnerRequestHandler) List(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Hamkorlik so'rovlari olindi", out, nil)
}

func (h *PartnerRequestHandler) Create(c *gin.Context) {
	userID, ok := getMarketplaceUserIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "token yaroqsiz", nil, nil)
		return
	}
	var req service.CreatePartnerRequestInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.svc.Create(userID, req)
	if err != nil {
		switch {
		case errors.Is(err, service.ErrPartnerCompanyNameRequired),
			errors.Is(err, service.ErrPartnerINNInvalid),
			errors.Is(err, service.ErrPartnerMFORequired),
			errors.Is(err, service.ErrPartnerAccountRequired),
			errors.Is(err, service.ErrPartnerActivityTypeRequired),
			errors.Is(err, service.ErrPartnerLocationRequired),
			errors.Is(err, service.ErrPartnerPhoneInvalid):
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case errors.Is(err, service.ErrPartnerPhoneExists):
			response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusCreated, "Hamkorlik so'rovi yuborildi", row, nil)
}
