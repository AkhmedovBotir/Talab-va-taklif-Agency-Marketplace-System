package handler

import (
	"errors"
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/deliveryproviders/service"
	"github.com/gin-gonic/gin"
)

type OrderHandler struct{ svc service.OrderService }

func NewOrderHandler(svc service.OrderService) *OrderHandler { return &OrderHandler{svc: svc} }

func (h *OrderHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/orders")
	{
		g.GET("/today", h.ListToday)
		g.GET("/history", h.ListHistory)
		g.GET("/:id", h.GetByID)
		g.PATCH("/:id/accept", h.Accept)
		g.PATCH("/:id/deliver", h.Deliver)
		g.PATCH("/:id/collect-payment", h.CollectPayment)
		g.PATCH("/:id/transfer-payment-to-shop", h.TransferPaymentToShop)
	}
}

func (h *OrderHandler) ListToday(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.ListToday(courierID, page, limit); if err != nil { response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error()); return }
	response.JSON(c, 200, "Bugungi buyurtmalar olindi", out, nil)
}

func (h *OrderHandler) ListHistory(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.svc.ListHistory(courierID, page, limit); if err != nil { response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error()); return }
	response.JSON(c, 200, "Buyurtmalar tarixi olindi", out, nil)
}

func (h *OrderHandler) GetByID(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	id, err := parseUintID(c.Param("id")); if err != nil { response.JSON(c, 400, "ID noto'g'ri", nil, nil); return }
	out, err := h.svc.GetByID(courierID, id); if err != nil { h.handleErr(c, err); return }
	response.JSON(c, 200, "Buyurtma ma'lumoti olindi", out, nil)
}

func (h *OrderHandler) Accept(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	id, err := parseUintID(c.Param("id")); if err != nil { response.JSON(c, 400, "ID noto'g'ri", nil, nil); return }
	out, err := h.svc.Accept(courierID, id); if err != nil { h.handleErr(c, err); return }
	response.JSON(c, 200, "Buyurtma qabul qilindi", out, nil)
}

func (h *OrderHandler) Deliver(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	id, err := parseUintID(c.Param("id")); if err != nil { response.JSON(c, 400, "ID noto'g'ri", nil, nil); return }
	out, err := h.svc.MarkDelivered(courierID, id); if err != nil { h.handleErr(c, err); return }
	response.JSON(c, 200, "Buyurtma yetkazildi deb belgilandi", out, nil)
}

func (h *OrderHandler) CollectPayment(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	id, err := parseUintID(c.Param("id")); if err != nil { response.JSON(c, 400, "ID noto'g'ri", nil, nil); return }
	out, err := h.svc.CollectPayment(courierID, id); if err != nil { h.handleErr(c, err); return }
	response.JSON(c, 200, "Buyurtma bo'yicha to'lov qabul qilindi", out, nil)
}

func (h *OrderHandler) TransferPaymentToShop(c *gin.Context) {
	courierID, ok := deliveryProviderIDFromCtx(c); if !ok { response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil); return }
	id, err := parseUintID(c.Param("id")); if err != nil { response.JSON(c, 400, "ID noto'g'ri", nil, nil); return }
	out, err := h.svc.TransferPaymentToShop(courierID, id); if err != nil { h.handleErr(c, err); return }
	response.JSON(c, 200, "To'lov do'konga yuborildi", out, nil)
}

func (h *OrderHandler) handleErr(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrOrderNotFound):
		response.JSON(c, 404, err.Error(), nil, nil)
	case errors.Is(err, service.ErrOrderCannotAccept), errors.Is(err, service.ErrOrderCannotDeliver), errors.Is(err, service.ErrOrderCannotCollectPayment), errors.Is(err, service.ErrOrderCannotTransferPayment):
		response.JSON(c, 409, err.Error(), nil, nil)
	default:
		response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func deliveryProviderIDFromCtx(c *gin.Context) (uint, bool) {
	v, ok := c.Get("delivery_provider_id")
	if !ok { return 0, false }
	id, ok := v.(uint)
	return id, ok && id > 0
}
