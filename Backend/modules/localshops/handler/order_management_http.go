package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type OrderManagementHandler struct {
	service service.OrderManagementService
}

func NewOrderManagementHandler(s service.OrderManagementService) *OrderManagementHandler {
	return &OrderManagementHandler{service: s}
}

func (h *OrderManagementHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/orders")
	{
		g.GET("", h.List)
		g.GET("/analytics", h.Analytics)
		g.GET("/:id", h.GetByID)
		g.PATCH("/:id/approve", h.Approve)
		g.PATCH("/:id/cancel", h.Cancel)
		g.PATCH("/:id/assign-courier", h.AssignCourier)
		g.PATCH("/:id/accept-payment", h.AcceptPayment)
	}
}

func (h *OrderManagementHandler) List(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.List(localShopID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtmalar ro'yxati olindi", out, nil)
}

func (h *OrderManagementHandler) GetByID(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.GetByID(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma ma'lumoti olindi", out, nil)
}

func (h *OrderManagementHandler) Approve(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.Approve(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma tasdiqlandi", out, nil)
}

func (h *OrderManagementHandler) Cancel(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.Cancel(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma bekor qilindi", out, nil)
}

type assignCourierRequest struct {
	CourierID uint `json:"courier_id" binding:"required"`
}

func (h *OrderManagementHandler) AssignCourier(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req assignCourierRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.CourierID == 0 {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.AssignCourier(localShopID, id, req.CourierID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kuryer biriktirildi", out, nil)
}

func (h *OrderManagementHandler) AcceptPayment(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.AcceptPayment(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "To'lov qabul qilindi", out, nil)
}

func (h *OrderManagementHandler) Analytics(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	out, err := h.service.Analytics(localShopID, c.Query("from"), c.Query("to"))
	if err != nil {
		if strings.Contains(err.Error(), "formati noto'g'ri") {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Statistika olindi", out, nil)
}

func (h *OrderManagementHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrOrderNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderCannotApprove),
		errors.Is(err, service.ErrOrderCannotCancel),
		errors.Is(err, service.ErrOrderCannotAssignCourier),
		errors.Is(err, service.ErrOrderCannotAcceptPayment):
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderCourierNotFound):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
