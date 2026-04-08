package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
)

type ManagerOrderPipelineHandler struct {
	service service.ManagerOrderPipelineService
	authSvc service.AuthService
}

func NewManagerOrderPipelineHandler(s service.ManagerOrderPipelineService, authSvc service.AuthService) *ManagerOrderPipelineHandler {
	return &ManagerOrderPipelineHandler{service: s, authSvc: authSvc}
}

func (h *ManagerOrderPipelineHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/managers/order-pipeline")
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

func (h *ManagerOrderPipelineHandler) All(c *gin.Context) {
	manager, ok := h.currentManager(c)
	if !ok {
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.ListByStage(manager.RegionID, "", page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Viloyatingizdagi barcha jarayon buyurtmalari olindi", out, nil)
}

func (h *ManagerOrderPipelineHandler) Overview(c *gin.Context) {
	manager, ok := h.currentManager(c)
	if !ok {
		return
	}
	out, err := h.service.Overview(manager.RegionID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Viloyatingiz bo'yicha jarayon overview olindi", out, nil)
}

func (h *ManagerOrderPipelineHandler) stage(stage, msg string) gin.HandlerFunc {
	return func(c *gin.Context) {
		manager, ok := h.currentManager(c)
		if !ok {
			return
		}
		page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
		limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
		out, err := h.service.ListByStage(manager.RegionID, stage, page, limit)
		if err != nil {
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
			return
		}
		response.JSON(c, http.StatusOK, msg+" buyurtmalar olindi", out, nil)
	}
}

func (h *ManagerOrderPipelineHandler) currentManager(c *gin.Context) (*managerContext, bool) {
	idVal, ok := c.Get("manager_id")
	managerID, ok2 := idVal.(uint)
	if !ok || !ok2 || managerID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, false
	}
	row, err := h.authSvc.GetProfile(managerID)
	if err != nil || row == nil {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, false
	}
	return &managerContext{RegionID: row.RegionID}, true
}

