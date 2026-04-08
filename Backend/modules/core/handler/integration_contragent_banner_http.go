package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationContragentBannerHandler struct {
	svc service.IntegrationContragentBannerService
}

func NewIntegrationContragentBannerHandler(svc service.IntegrationContragentBannerService) *IntegrationContragentBannerHandler {
	return &IntegrationContragentBannerHandler{svc: svc}
}

func (h *IntegrationContragentBannerHandler) RegisterRoutes(g *gin.RouterGroup) {
	g.POST("/contragent-banners", h.Create)
	g.GET("/contragent-banners", h.List)
	g.PUT("/contragent-banners/:id", h.Update)
	g.DELETE("/contragent-banners/:id", h.Delete)
}

func (h *IntegrationContragentBannerHandler) Create(c *gin.Context) {
	var req service.CreateIntegrationContragentBannerInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.svc.Create(req)
	if err != nil {
		h.err(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Reklama yaratildi", row, nil)
}
func (h *IntegrationContragentBannerHandler) List(c *gin.Context) {
	rows, err := h.svc.List()
	if err != nil {
		response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, 200, "Ro'yxat olindi", rows, nil)
}
func (h *IntegrationContragentBannerHandler) Update(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, 400, "Noto'g'ri id", nil, nil)
		return
	}
	var req service.UpdateIntegrationContragentBannerInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.svc.Update(uint(id64), req); err != nil {
		h.err(c, err)
		return
	}
	response.JSON(c, 200, "Yangilandi", nil, nil)
}
func (h *IntegrationContragentBannerHandler) Delete(c *gin.Context) {
	id64, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id64 == 0 {
		response.JSON(c, 400, "Noto'g'ri id", nil, nil)
		return
	}
	if err := h.svc.Delete(uint(id64)); err != nil {
		h.err(c, err)
		return
	}
	response.JSON(c, 200, "O'chirildi", nil, nil)
}

func (h *IntegrationContragentBannerHandler) err(c *gin.Context, err error) {
	switch err {
	case service.ErrBannerContragentRequired, service.ErrBannerTimeInvalid, service.ErrBannerStatusInvalid:
		response.JSON(c, 400, err.Error(), nil, nil)
	case service.ErrBannerNotFound:
		response.JSON(c, 404, err.Error(), nil, nil)
	default:
		response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
