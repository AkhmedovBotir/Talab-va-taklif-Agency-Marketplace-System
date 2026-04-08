package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type LocalShopProductTemplateHandler struct {
	service service.LocalShopProductTemplateService
}

type localShopTemplateStatusRequest struct {
	Status string `json:"status"`
}

func NewLocalShopProductTemplateHandler(s service.LocalShopProductTemplateService) *LocalShopProductTemplateHandler {
	return &LocalShopProductTemplateHandler{service: s}
}

func (h *LocalShopProductTemplateHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc) {
	grp := api.Group("/local-shop-product-templates")
	grp.Use(auth, onlyGeneral)
	{
		grp.POST("", h.Create)
		grp.GET("", h.GetAll)
		grp.GET("/:id", h.GetByID)
		grp.PUT("/:id", h.Update)
		grp.PATCH("/:id/status", h.UpdateStatus)
		grp.DELETE("/:id", h.Delete)
	}
}

func (h *LocalShopProductTemplateHandler) Create(c *gin.Context) {
	var req service.LocalShopProductTemplateInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Shablon yaratildi", row, nil)
}

func (h *LocalShopProductTemplateHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	paginated, err := h.service.GetPaginated(page, limit)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Shablonlar ro'yxati olindi", gin.H{
		"items":       paginated.Items,
		"total":       paginated.Total,
		"page":        paginated.Page,
		"limit":       paginated.Limit,
		"total_pages": paginated.TotalPages,
	}, nil)
}

func (h *LocalShopProductTemplateHandler) GetByID(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	row, err := h.service.GetByID(id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Shablon ma'lumoti olindi", row, nil)
}

func (h *LocalShopProductTemplateHandler) Update(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.LocalShopProductTemplateInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Update(id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Shablon yangilandi", row, nil)
}

func (h *LocalShopProductTemplateHandler) UpdateStatus(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req localShopTemplateStatusRequest
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if req.Status == "" {
		response.JSON(c, http.StatusBadRequest, "status majburiy", nil, nil)
		return
	}
	row, err := h.service.UpdateStatus(id, req.Status)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Shablon statusi yangilandi", row, nil)
}

func (h *LocalShopProductTemplateHandler) Delete(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = h.service.Delete(id); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Shablon o'chirildi", nil, nil)
}

func (h *LocalShopProductTemplateHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrLocalShopTemplateNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrLocalShopTemplateNameRequired, service.ErrLocalShopTemplateDescriptionRequired,
		service.ErrLocalShopTemplateCategoryInvalid, service.ErrLocalShopTemplateSubcategoryInvalid,
		service.ErrLocalShopTemplateCategoryRelation, service.ErrLocalShopTemplateUnitInvalid,
		service.ErrLocalShopTemplateUnitSizeRequired, service.ErrLocalShopTemplateImagesInvalid,
		service.ErrLocalShopTemplateImageBase64Invalid, service.ErrLocalShopTemplateStatusInvalid:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
