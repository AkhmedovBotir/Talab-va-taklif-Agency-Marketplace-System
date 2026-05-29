package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type OrderPipelineHandler struct {
	service service.OrderPipelineService
}

func NewOrderPipelineHandler(s service.OrderPipelineService) *OrderPipelineHandler {
	return &OrderPipelineHandler{service: s}
}

func (h *OrderPipelineHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/order-pipeline")
	grp.Use(auth)
	{
		grp.GET("/overview", h.Overview)
		grp.GET("/all", h.All)
		grp.GET("/marketplace-created", h.stage("marketplace_created", "Marketplacedan buyurilgan"))
		grp.GET("/punkt-inbox", h.stage("punkt_inbox", "Punkt qabulini kutayotgan"))
		grp.GET("/contragent-requests-created", h.stage("contragent_requests_created", "Kontragent so'rovlari yaratilgan"))
		grp.GET("/punkt-collected-pending", h.stage("punkt_collected_pending", "Punkt yig'ishni kutayotgan"))
		grp.GET("/punkt-ready-pending", h.stage("punkt_ready_pending", "Punkt tayyorlashni kutayotgan"))
		grp.GET("/agent-assign-pending", h.stage("agent_assign_pending", "Agentga topshirishni kutayotgan"))
		grp.GET("/agent-payment-pending", h.stage("agent_payment_pending", "Agent to'lov e'lonini kutayotgan"))
		grp.GET("/payment-confirm-pending", h.stage("payment_confirm_pending", "Punkt to'lov tasdig'ini kutayotgan"))
		grp.GET("/post-payment-delivery-pending", h.stage("post_payment_delivery_pending", "To'lovdan keyingi yetkazishni kutayotgan"))
		grp.GET("/remainder-handover-pending", h.stage("remainder_handover_pending", "Qolgan qism topshirilishini kutayotgan"))
		grp.GET("/ready-for-agent-deliver", h.stage("ready_for_agent_deliver", "Agent yetkazishini kutayotgan"))
		grp.GET("/delivered", h.stage("delivered", "Yetkazib berilgan"))
	}
}

func (h *OrderPipelineHandler) All(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.ListByStage("", page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Barcha jarayon buyurtmalari olindi", out, nil)
}

func (h *OrderPipelineHandler) Overview(c *gin.Context) {
	out, err := h.service.Overview()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Jarayon overview olindi", out, nil)
}

func (h *OrderPipelineHandler) stage(stage, msg string) gin.HandlerFunc {
	return func(c *gin.Context) {
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		out, err := h.service.ListByStage(stage, page, limit)
		if err != nil {
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
			return
		}
		response.JSON(c, http.StatusOK, msg+" buyurtmalar olindi", out, nil)
	}
}
