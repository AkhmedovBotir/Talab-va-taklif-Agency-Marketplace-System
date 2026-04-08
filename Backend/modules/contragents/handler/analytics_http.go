package handler

import (
	"errors"
	"net/http"
	"strconv"
	"time"

	"backend/internal/pkg/response"
	"backend/modules/contragents/service"
	"github.com/gin-gonic/gin"
)

type ContragentAnalyticsHandler struct {
	service service.ContragentAnalyticsService
}

func NewContragentAnalyticsHandler(s service.ContragentAnalyticsService) *ContragentAnalyticsHandler {
	return &ContragentAnalyticsHandler{service: s}
}

func (h *ContragentAnalyticsHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/analytics")
	{
		g.GET("/stats", h.Stats)
		g.GET("/sales/orders", h.OrderSales)
	}
}

func (h *ContragentAnalyticsHandler) Stats(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	start, end, err := parseDateRange(c.Query("from"), c.Query("to"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "from/to noto'g'ri formatda", nil, nil)
		return
	}
	out, err := h.service.Stats(contragentID, start, end)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Statistika olindi", out, nil)
}

func (h *ContragentAnalyticsHandler) OrderSales(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page := parseIntDefault(c.Query("page"), 1)
	limit := parseIntDefault(c.Query("limit"), 10)
	start, end, err := parseDateRange(c.Query("from"), c.Query("to"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "from/to noto'g'ri formatda", nil, nil)
		return
	}
	out, err := h.service.OrderSales(contragentID, start, end, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Buyurtma savdosi olindi", gin.H{
		"items":       out.Items,
		"total":       out.Total,
		"page":        out.Page,
		"limit":       out.Limit,
		"total_pages": out.TotalPages,
	}, nil)
}

func parseDateRange(fromRaw, toRaw string) (*time.Time, *time.Time, error) {
	rangeErr := errors.New("invalid date range")
	if fromRaw == "" && toRaw == "" {
		return nil, nil, nil
	}
	if fromRaw == "" || toRaw == "" {
		return nil, nil, rangeErr
	}
	from, err := time.ParseInLocation("2006-01-02", fromRaw, time.UTC)
	if err != nil {
		return nil, nil, err
	}
	to, err := time.ParseInLocation("2006-01-02", toRaw, time.UTC)
	if err != nil {
		return nil, nil, err
	}
	if to.Before(from) {
		return nil, nil, rangeErr
	}
	end := to.Add(24 * time.Hour)
	return &from, &end, nil
}

func parseIntDefault(raw string, fallback int) int {
	v, err := strconv.Atoi(raw)
	if err != nil || v <= 0 {
		return fallback
	}
	return v
}
