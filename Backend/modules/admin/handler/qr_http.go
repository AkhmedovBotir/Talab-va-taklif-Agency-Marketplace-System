package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type QRHandler struct {
	service service.QRService
}

func NewQRHandler(s service.QRService) *QRHandler {
	return &QRHandler{service: s}
}

func (h *QRHandler) RegisterAdminRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/qrs")
	grp.Use(auth)
	{
		grp.POST("", h.Create)
		grp.GET("", h.GetAll)
		grp.GET("/:id", h.GetByID)
		grp.PUT("/:id", h.Update)
		grp.DELETE("/:id", h.Delete)
	}
}

func (h *QRHandler) RegisterPublicRoutes(api *gin.RouterGroup) {
	api.GET("/qr/:code/scan", h.Scan)
}

func (h *QRHandler) Create(c *gin.Context) {
	var req service.QRInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "QR yaratildi", row, nil)
}

func (h *QRHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	out, err := h.service.GetPaginated(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "QR ro'yxati olindi", gin.H{
		"items":       out.Items,
		"total":       out.Total,
		"page":        out.Page,
		"limit":       out.Limit,
		"total_pages": out.TotalPages,
	}, nil)
}

func (h *QRHandler) GetByID(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "QR ma'lumoti olindi", row, nil)
}

func (h *QRHandler) Update(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.QRInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Update(id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "QR yangilandi", row, nil)
}

func (h *QRHandler) Delete(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = h.service.Delete(id); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "QR o'chirildi", nil, nil)
}

func (h *QRHandler) Scan(c *gin.Context) {
	link, err := h.service.ResolveScanLink(c.Param("code"))
	if err != nil {
		h.handleError(c, err)
		return
	}
	c.Redirect(http.StatusFound, link)
}

func (h *QRHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrQRNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrQRNameRequired, service.ErrQRLinkInvalid:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

