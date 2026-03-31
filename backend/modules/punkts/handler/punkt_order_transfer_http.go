package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type PunktOrderTransferHandler struct {
	svc service.PunktOrderTransferService
}

func NewPunktOrderTransferHandler(svc service.PunktOrderTransferService) *PunktOrderTransferHandler {
	return &PunktOrderTransferHandler{svc: svc}
}

func (h *PunktOrderTransferHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.POST("/orders/:id/transfers", h.Create)
	me.GET("/transfers/outgoing", h.ListOutgoing)
	me.GET("/transfers/incoming", h.ListIncoming)
	me.GET("/transfers/:transfer_id", h.GetByID)
	me.POST("/transfers/:transfer_id/accept", h.AcceptByTarget)
	me.POST("/transfers/:transfer_id/return", h.ReturnByTarget)
	me.POST("/transfers/:transfer_id/confirm-received", h.ConfirmReceivedBySource)
}

func (h *PunktOrderTransferHandler) Create(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	orderID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var body service.CreateTransferInput
	if err := c.ShouldBindJSON(&body); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if body.TargetPunktID == 0 {
		response.JSON(c, http.StatusBadRequest, "target_punkt_id majburiy", nil, nil)
		return
	}
	out, err := h.svc.Create(punktID, orderID, body)
	if err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Punktlararo transfer yaratildi", out, nil)
}

func (h *PunktOrderTransferHandler) list(c *gin.Context, incoming bool) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	var (
		out *service.PaginatedTransfers
		err error
	)
	if incoming {
		out, err = h.svc.ListIncoming(punktID, page, limit)
	} else {
		out, err = h.svc.ListOutgoing(punktID, page, limit)
	}
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Transferlar olindi", out, nil)
}

func (h *PunktOrderTransferHandler) ListOutgoing(c *gin.Context) { h.list(c, false) }
func (h *PunktOrderTransferHandler) ListIncoming(c *gin.Context) { h.list(c, true) }

func (h *PunktOrderTransferHandler) GetByID(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("transfer_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetByIDForPunkt(id, punktID)
	if err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Transfer olindi", out, nil)
}

func (h *PunktOrderTransferHandler) AcceptByTarget(c *gin.Context) {
	h.targetAction(c, h.svc.AcceptByTarget, "Transfer qabul qilindi")
}

func (h *PunktOrderTransferHandler) ReturnByTarget(c *gin.Context) {
	h.targetAction(c, h.svc.ReturnByTarget, "Transfer birinchi punktga qaytarildi")
}

func (h *PunktOrderTransferHandler) targetAction(c *gin.Context, fn func(uint, uint) error, msg string) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("transfer_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err := fn(id, punktID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, msg, nil, nil)
}

func (h *PunktOrderTransferHandler) ConfirmReceivedBySource(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("transfer_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err := h.svc.ConfirmReceivedBySource(id, punktID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Transfer qabul qilindi va yakunlandi", nil, nil)
}

func (h *PunktOrderTransferHandler) mapErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrTransferOrderNotFound), errors.Is(err, service.ErrTransferNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrTransferTargetPunktInvalid), errors.Is(err, service.ErrTransferItemInvalid):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrTransferOrderStateInvalid),
		errors.Is(err, service.ErrTransferAlreadyActive),
		errors.Is(err, service.ErrTransferAccessDenied),
		errors.Is(err, service.ErrTransferWrongState):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
