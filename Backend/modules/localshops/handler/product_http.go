package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type ProductHandler struct {
	service service.ProductService
}

func NewProductHandler(s service.ProductService) *ProductHandler {
	return &ProductHandler{service: s}
}

func (h *ProductHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/products")
	{
		g.POST("", h.Create)
		g.GET("", h.GetAll)
		g.GET("/:id", h.GetByID)
		g.PUT("/:id", h.Update)
		g.DELETE("/:id", h.Delete)
	}
}

func (h *ProductHandler) Create(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	var req service.ProductInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Create(localShopID, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Mahsulot yaratildi", row, nil)
}

func (h *ProductHandler) GetAll(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.GetPaginated(localShopID, page, limit)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulotlar ro'yxati olindi", gin.H{
		"items":       out.Items,
		"total":       out.Total,
		"page":        out.Page,
		"limit":       out.Limit,
		"total_pages": out.TotalPages,
	}, nil)
}

func (h *ProductHandler) GetByID(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	row, err := h.service.GetByID(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulot ma'lumoti olindi", row, nil)
}

func (h *ProductHandler) Update(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.ProductInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Update(localShopID, id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulot yangilandi", row, nil)
}

func (h *ProductHandler) Delete(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = h.service.Delete(localShopID, id); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulot o'chirildi", nil, nil)
}

func (h *ProductHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrProductNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrTemplateInvalid, service.ErrQuantityInvalid, service.ErrPriceInvalid, service.ErrOriginalPriceInvalid:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
