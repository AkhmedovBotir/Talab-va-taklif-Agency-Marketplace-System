package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/contragents/service"
	"github.com/gin-gonic/gin"
)

type ContragentPunktLineRequestHandler struct {
	svc *service.ContragentPunktLineRequestService
}

func NewContragentPunktLineRequestHandler(svc *service.ContragentPunktLineRequestService) *ContragentPunktLineRequestHandler {
	return &ContragentPunktLineRequestHandler{svc: svc}
}

func (h *ContragentPunktLineRequestHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/punkt-line-requests", h.List)
	me.GET("/punkt-line-requests/:id", h.GetByID)
	me.POST("/punkt-line-requests/:id/accept", h.Accept)
	me.POST("/punkt-line-requests/:id/preparing", h.Preparing)
	me.POST("/punkt-line-requests/:id/deliver", h.Deliver)
}

func contragentIDFromContext(c *gin.Context) (uint, bool) {
	raw, ok := c.Get("contragent_id")
	if !ok {
		return 0, false
	}
	id, ok := raw.(uint)
	if !ok || id == 0 {
		return 0, false
	}
	return id, true
}

func (h *ContragentPunktLineRequestHandler) List(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	status := c.Query("status")
	out, err := h.svc.List(cid, page, limit, status)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "So'rovlar olindi", out, nil)
}

func (h *ContragentPunktLineRequestHandler) GetByID(c *gin.Context) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetByID(cid, id)
	if err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "So'rov olindi", out, nil)
}

func (h *ContragentPunktLineRequestHandler) Accept(c *gin.Context) {
	h.transition(c, h.svc.Accept, "Qabul qilindi")
}

func (h *ContragentPunktLineRequestHandler) Preparing(c *gin.Context) {
	h.transition(c, h.svc.Preparing, "Tayyorlanmoqda")
}

func (h *ContragentPunktLineRequestHandler) Deliver(c *gin.Context) {
	h.transition(c, h.svc.Deliver, "Yetkazib berildi")
}

func (h *ContragentPunktLineRequestHandler) transition(c *gin.Context, fn func(uint, uint) error, okMsg string) {
	cid, ok := contragentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err := fn(cid, id); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, okMsg, nil, nil)
}

func (h *ContragentPunktLineRequestHandler) mapErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrContragentLineRequestNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrContragentLineInvalidTransition):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
