package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/agents/service"
	"github.com/gin-gonic/gin"
)

type AgentOrderHandler struct {
	svc *service.AgentOrderService
}

func NewAgentOrderHandler(svc *service.AgentOrderService) *AgentOrderHandler {
	return &AgentOrderHandler{svc: svc}
}

func (h *AgentOrderHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/orders/active", h.ListActive)
	me.GET("/orders/history", h.ListHistory)
	me.GET("/orders/:id", h.GetByID)
	me.POST("/orders/:id/payment-to-punkt", h.DeclarePaymentToPunkt)
	me.POST("/orders/:id/deliver", h.Deliver)
}

func (h *AgentOrderHandler) ListActive(c *gin.Context) {
	h.list(c, h.svc.ListActive, "Faol buyurtmalar olindi")
}

func (h *AgentOrderHandler) ListHistory(c *gin.Context) {
	h.list(c, h.svc.ListHistory, "Tarix buyurtmalari olindi")
}

func (h *AgentOrderHandler) list(c *gin.Context, fn func(uint, int, int) (*service.PaginatedAgentOrders, error), okMsg string) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := fn(agentID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, okMsg, out, nil)
}

func (h *AgentOrderHandler) GetByID(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	orderID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.GetByID(agentID, orderID)
	if err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma olindi", out, nil)
}

func (h *AgentOrderHandler) DeclarePaymentToPunkt(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	orderID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err := h.svc.DeclarePaymentToPunkt(agentID, orderID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Punktga to'lov e'lon qilindi", nil, nil)
}

func (h *AgentOrderHandler) Deliver(c *gin.Context) {
	agentID, ok := agentIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	orderID, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err := h.svc.MarkDelivered(agentID, orderID); err != nil {
		h.mapErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma yetkazildi deb belgilandi", nil, nil)
}

func (h *AgentOrderHandler) mapErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrAgentOrderNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrAgentOrderNotDeliverable),
		errors.Is(err, service.ErrAgentOrderSettlementWrongState),
		errors.Is(err, service.ErrAgentOrderSettlementIncomplete):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
