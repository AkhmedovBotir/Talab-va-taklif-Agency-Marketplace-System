package handler

import (
	"net/http"
	"time"

	"backend/internal/pkg/response"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type PunktKPIHandler struct {
	svc *service.PunktKPIService
}

func NewPunktKPIHandler(svc *service.PunktKPIService) *PunktKPIHandler {
	return &PunktKPIHandler{svc: svc}
}

func (h *PunktKPIHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/kpi/today", h.Today)
	me.GET("/kpi/history", h.History)
}

func (h *PunktKPIHandler) Today(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt autentifikatsiyasi kerak", nil, nil)
		return
	}
	out, err := h.svc.Today(punktID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", out, nil)
}

func (h *PunktKPIHandler) History(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Punkt autentifikatsiyasi kerak", nil, nil)
		return
	}
	from := c.Query("from")
	to := c.Query("to")
	if from == "" || to == "" {
		now := time.Now().UTC()
		to = now.Format("2006-01-02")
		from = now.AddDate(0, 0, -29).Format("2006-01-02")
	}
	out, err := h.svc.History(punktID, from, to)
	if err != nil {
		if err == service.ErrPunktKPIHistoryRange {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", out, nil)
}
