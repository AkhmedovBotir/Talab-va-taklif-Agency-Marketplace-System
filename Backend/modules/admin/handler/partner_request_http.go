package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type PartnerRequestHandler struct {
	svc service.PartnerRequestService
}

func NewPartnerRequestHandler(svc service.PartnerRequestService) *PartnerRequestHandler {
	return &PartnerRequestHandler{svc: svc}
}

func (h *PartnerRequestHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc) {
	grp := api.Group("/admin-partner-requests")
	grp.Use(auth, onlyGeneral)
	{
		grp.GET("", h.List)
		grp.GET("/:id", h.GetByID)
		grp.PATCH("/:id/contacted", h.MarkContacted)
		grp.PATCH("/:id/deal", h.MarkDeal)
		grp.POST("/:id/convert-to-contragent", h.ConvertToContragent)
	}
}

func (h *PartnerRequestHandler) List(c *gin.Context) {
	page, limit := parsePageLimit(c)
	out, err := h.svc.List(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Hamkorlik so'rovlari olindi", out, nil)
}

func parsePageLimit(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func (h *PartnerRequestHandler) GetByID(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetByID(id)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Hamkorlik so'rovi olindi", out, nil)
}

func (h *PartnerRequestHandler) MarkContacted(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.MarkContacted(id)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Aloqaga chiqilgan deb belgilandi", out, nil)
}

type dealMarkRequest struct {
	Signed bool `json:"signed"`
}

func (h *PartnerRequestHandler) MarkDeal(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req dealMarkRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.MarkDeal(id, req.Signed)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Bitim holati yangilandi", out, nil)
}

type convertRequest struct {
	Phone *string `json:"phone"`
}

func (h *PartnerRequestHandler) ConvertToContragent(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req convertRequest
	_ = c.ShouldBindJSON(&req)
	out, err := h.svc.ConvertToContragent(id, service.ConvertPartnerRequestInput{Phone: req.Phone})
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Kontragentga aylantirildi", sanitizeContragent(out), nil)
}

func (h *PartnerRequestHandler) handleErr(c *gin.Context, err error) {
	switch err {
	case service.ErrPartnerRequestNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrPartnerRequestStateInvalid, service.ErrPartnerRequestPhoneRequired,
		service.ErrInvalidPhone, service.ErrContragentHierarchy, service.ErrContragentActivityTypeNotFound,
		service.ErrContragentLocationIDs:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case service.ErrContragentPhoneExists:
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
