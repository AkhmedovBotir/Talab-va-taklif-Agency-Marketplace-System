package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type TemplateBrowseHandler struct {
	service service.TemplateBrowseService
}

func NewTemplateBrowseHandler(s service.TemplateBrowseService) *TemplateBrowseHandler {
	return &TemplateBrowseHandler{service: s}
}

func (h *TemplateBrowseHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/product-templates")
	{
		g.GET("", h.List)
		g.GET("/:id", h.GetByID)
	}
}

func (h *TemplateBrowseHandler) List(c *gin.Context) {
	if _, ok := localShopIDFromCtx(c); !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.List(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Shablonlar ro'yxati olindi", gin.H{
		"items":       out.Items,
		"total":       out.Total,
		"page":        out.Page,
		"limit":       out.Limit,
		"total_pages": out.TotalPages,
	}, nil)
}

func (h *TemplateBrowseHandler) GetByID(c *gin.Context) {
	if _, ok := localShopIDFromCtx(c); !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.GetByID(id)
	if err != nil {
		if err == service.ErrTemplateNotFound {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Shablon ma'lumoti olindi", out, nil)
}
