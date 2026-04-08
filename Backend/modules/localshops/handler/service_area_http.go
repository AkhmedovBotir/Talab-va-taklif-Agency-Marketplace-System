package handler

import (
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type ServiceAreaHandler struct {
	service service.ServiceAreaService
}

type saveServiceAreasRequest struct {
	MFYIDs []uint `json:"mfy_ids"`
}

func NewServiceAreaHandler(s service.ServiceAreaService) *ServiceAreaHandler {
	return &ServiceAreaHandler{service: s}
}

func (h *ServiceAreaHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/service-areas")
	{
		g.GET("/mfys", h.Get)
		g.PUT("/mfys", h.Save)
	}
}

func (h *ServiceAreaHandler) Get(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	out, err := h.service.Get(localShopID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Xizmat hududlari olindi", out, nil)
}

func (h *ServiceAreaHandler) Save(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	var req saveServiceAreasRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.service.Save(localShopID, req.MFYIDs)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Xizmat hududlari saqlandi", out, nil)
}

func (h *ServiceAreaHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrServiceAreaShopNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrServiceAreaInvalidMFY:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
