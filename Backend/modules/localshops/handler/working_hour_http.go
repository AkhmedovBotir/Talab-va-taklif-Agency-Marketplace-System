package handler

import (
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type WorkingHourHandler struct {
	service service.WorkingHourService
}

type saveWorkingHoursRequest struct {
	WorkingHours []service.WorkingHourInput `json:"working_hours"`
}

func NewWorkingHourHandler(s service.WorkingHourService) *WorkingHourHandler {
	return &WorkingHourHandler{service: s}
}

func (h *WorkingHourHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/working-hours")
	{
		g.GET("", h.Get)
		g.PUT("", h.Save)
	}
}

func (h *WorkingHourHandler) Get(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	rows, err := h.service.List(localShopID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Ish vaqti olindi", gin.H{"working_hours": rows}, nil)
}

func (h *WorkingHourHandler) Save(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	var req saveWorkingHoursRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	rows, err := h.service.Save(localShopID, req.WorkingHours)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Ish vaqti saqlandi", gin.H{"working_hours": rows}, nil)
}

func (h *WorkingHourHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrWorkingHoursPayloadEmpty, service.ErrWorkingHoursWeekday, service.ErrWorkingHoursDuplicateDay,
		service.ErrWorkingHoursTimeFormat, service.ErrWorkingHoursTimeRequired, service.ErrWorkingHoursTimeForbidden,
		service.ErrWorkingHoursRange:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
