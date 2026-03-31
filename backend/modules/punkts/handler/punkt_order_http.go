package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type contragentPayoutsBody struct {
	Items []struct {
		OrderItemID             uint    `json:"order_item_id"`
		ContragentPayoutPercent float64 `json:"contragent_payout_percent"`
	} `json:"items"`
}

type assignAgentBody struct {
	AgentID uint `json:"agent_id"`
}

type PunktOrderHandler struct {
	svc service.PunktOrderService
}

func NewPunktOrderHandler(svc service.PunktOrderService) *PunktOrderHandler {
	return &PunktOrderHandler{svc: svc}
}

// RegisterMeRoutes — /punkts/me guruhiga qo‘shiladi (ikkinchi Group yaratmaslik — 404 oldini olish).
func (h *PunktOrderHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/orders/today", h.ListToday)
	me.GET("/orders/history", h.ListHistory)
	me.POST("/orders/:id/punkt-collected", h.MarkPunktCollected)
	me.POST("/orders/:id/punkt-ready", h.MarkPunktReady)
	me.PUT("/orders/:id/contragent-payouts", h.SetContragentPayouts)
	me.POST("/orders/:id/assign-agent", h.AssignAgent)
	me.POST("/orders/:id/confirm-agent-payment", h.ConfirmAgentPayment)
	me.POST("/orders/:id/post-payment-delivered", h.MarkPostPaymentDelivered)
	me.POST("/orders/:id/handover-remainder-to-contragents", h.HandoverRemainderToContragents)
	me.GET("/orders/:id", h.GetByID)
	me.POST("/orders/:id/accept", h.Accept)
	me.PUT("/orders/:id/accept", h.Accept)
	me.PATCH("/orders/:id/reject", h.Reject)
}

func (h *PunktOrderHandler) ListToday(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.ListToday(punktID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Bugungi buyurtmalar olindi", out, nil)
}

func (h *PunktOrderHandler) ListHistory(c *gin.Context) {
	punktID, ok := punktIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.ListHistory(punktID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Tarix buyurtmalari olindi", out, nil)
}

func (h *PunktOrderHandler) GetByID(c *gin.Context) {
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
	out, err := h.svc.GetByID(punktID, orderID)
	if err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma olindi", out, nil)
}

func (h *PunktOrderHandler) Accept(c *gin.Context) {
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
	if err := h.svc.Accept(punktID, orderID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma qabul qilindi, kontragent so'rovlari yaratildi", nil, nil)
}

func (h *PunktOrderHandler) Reject(c *gin.Context) {
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
	if err := h.svc.Reject(punktID, orderID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma rad etildi", nil, nil)
}

func (h *PunktOrderHandler) MarkPunktCollected(c *gin.Context) {
	h.simpleOrderAction(c, h.svc.MarkPunktCollected, "Buyurtma yig‘ildi deb belgilandi")
}

func (h *PunktOrderHandler) MarkPunktReady(c *gin.Context) {
	h.simpleOrderAction(c, h.svc.MarkPunktReady, "Buyurtma tayyorlandi deb belgilandi")
}

func (h *PunktOrderHandler) simpleOrderAction(c *gin.Context, fn func(uint, uint) error, okMsg string) {
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
	if err := fn(punktID, orderID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, okMsg, nil, nil)
}

func (h *PunktOrderHandler) SetContragentPayouts(c *gin.Context) {
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
	var body contragentPayoutsBody
	if err := c.ShouldBindJSON(&body); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if len(body.Items) == 0 {
		response.JSON(c, http.StatusBadRequest, "Qatorlar ro'yxati bo'sh", nil, nil)
		return
	}
	m := make(map[uint]float64, len(body.Items))
	for _, it := range body.Items {
		if it.OrderItemID == 0 {
			response.JSON(c, http.StatusBadRequest, "order_item_id majburiy", nil, nil)
			return
		}
		m[it.OrderItemID] = it.ContragentPayoutPercent
	}
	if err := h.svc.SetContragentPayoutPercents(punktID, orderID, m); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kontragent foizlari saqlandi", nil, nil)
}

func (h *PunktOrderHandler) AssignAgent(c *gin.Context) {
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
	var body assignAgentBody
	if err := c.ShouldBindJSON(&body); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if body.AgentID == 0 {
		response.JSON(c, http.StatusBadRequest, "agent_id majburiy", nil, nil)
		return
	}
	if err := h.svc.AssignAgent(punktID, orderID, body.AgentID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma agentga topshirildi", nil, nil)
}

func (h *PunktOrderHandler) ConfirmAgentPayment(c *gin.Context) {
	h.simpleOrderAction(c, h.svc.ConfirmAgentPaymentToPunkt, "Agent to'lovi tasdiqlandi")
}

func (h *PunktOrderHandler) MarkPostPaymentDelivered(c *gin.Context) {
	h.simpleOrderAction(c, h.svc.MarkPunktPostPaymentDelivered, "To'lovdan keyingi yetkazish bajarildi")
}

func (h *PunktOrderHandler) HandoverRemainderToContragents(c *gin.Context) {
	h.simpleOrderAction(c, h.svc.MarkPunktContragentRemainderHandedOver, "Kontragentlarga qolgan qism topshirildi")
}

func (h *PunktOrderHandler) mapErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrPunktOrderNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrPunktOrderNotInInbox):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrPunktOrderNotPending):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrPunktOrderAlreadyHandled):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrPunktOrderFulfillmentWrongState),
		errors.Is(err, service.ErrPunktOrderNotCollected),
		errors.Is(err, service.ErrPunktOrderNotReady),
		errors.Is(err, service.ErrPunktOrderPayoutInvalid),
		errors.Is(err, service.ErrPunktOrderNoMFY),
		errors.Is(err, service.ErrPunktOrderAgentInvalid),
		errors.Is(err, service.ErrPunktOrderAgentAlreadyOther),
		errors.Is(err, service.ErrPunktOrderTransferPending),
		errors.Is(err, service.ErrPunktOrderDistrictMismatch),
		errors.Is(err, service.ErrPunktOrderNoAgentAssigned),
		errors.Is(err, service.ErrPunktOrderAgentPaymentNotDeclared),
		errors.Is(err, service.ErrPunktOrderAgentPaymentNotConfirmed),
		errors.Is(err, service.ErrPunktOrderPostPaymentDeliveredMissing):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
