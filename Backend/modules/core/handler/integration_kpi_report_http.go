package handler

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationKPIReportHandler struct {
	svc *service.IntegrationKPIReportService
}

func NewIntegrationKPIReportHandler(svc *service.IntegrationKPIReportService) *IntegrationKPIReportHandler {
	return &IntegrationKPIReportHandler{svc: svc}
}

func (h *IntegrationKPIReportHandler) RegisterRoutes(g *gin.RouterGroup) {
	g.GET("/kpi/reports/accrual", h.Accrual)
	g.GET("/kpi/reports/punkt", h.role(service.KPICategoryPunkt))
	g.GET("/kpi/reports/agent", h.role(service.KPICategoryAgent))
	g.GET("/kpi/reports/manager", h.role(service.KPICategoryManager))
	g.GET("/kpi/reports/finance", h.role(service.KPICategoryFinance))
	g.GET("/kpi/reports/delivery", h.role(service.KPICategoryDelivery))
	g.POST("/kpi/reports/settle", h.Settle)
}

func parseOptionalUintQuery(c *gin.Context, key string) *uint {
	s := strings.TrimSpace(c.Query(key))
	if s == "" {
		return nil
	}
	v, err := strconv.ParseUint(s, 10, 32)
	if err != nil || v == 0 {
		return nil
	}
	u := uint(v)
	return &u
}

func defaultIntegrationKPIRangeUTC() (start, end time.Time, err error) {
	now := time.Now().UTC()
	y, m, d := now.Date()
	end = time.Date(y, m, d, 0, 0, 0, 0, time.UTC).Add(24 * time.Hour)
	start = end.Add(-7 * 24 * time.Hour)
	return start, end, nil
}

func parseIntegrationKPIRange(fromStr, toStr string) (start, end time.Time, err error) {
	if fromStr == "" && toStr == "" {
		return defaultIntegrationKPIRangeUTC()
	}
	if fromStr == "" || toStr == "" {
		return time.Time{}, time.Time{}, service.ErrIntegrationKPIReportRange
	}
	fromDay, e1 := time.ParseInLocation("2006-01-02", fromStr, time.UTC)
	if e1 != nil {
		return time.Time{}, time.Time{}, service.ErrIntegrationKPIReportRange
	}
	toDay, e2 := time.ParseInLocation("2006-01-02", toStr, time.UTC)
	if e2 != nil {
		return time.Time{}, time.Time{}, service.ErrIntegrationKPIReportRange
	}
	if toDay.Before(fromDay) {
		return time.Time{}, time.Time{}, service.ErrIntegrationKPIReportRange
	}
	span := int(toDay.Sub(fromDay).Hours()/24) + 1
	if span < 1 || span > 366 {
		return time.Time{}, time.Time{}, service.ErrIntegrationKPIReportRange
	}
	start = time.Date(fromDay.Year(), fromDay.Month(), fromDay.Day(), 0, 0, 0, 0, time.UTC)
	end = time.Date(toDay.Year(), toDay.Month(), toDay.Day(), 0, 0, 0, 0, time.UTC).Add(24 * time.Hour)
	return start, end, nil
}

func integrationKeyID(c *gin.Context) (uint, bool) {
	v, ok := c.Get(GinIntegrationKeyID)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok && id > 0
}

func (h *IntegrationKPIReportHandler) Accrual(c *gin.Context) {
	keyID, ok := integrationKeyID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	start, end, err := parseIntegrationKPIRange(c.Query("from"), c.Query("to"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	punktID := parseOptionalUintQuery(c, "punkt_id")
	agentID := parseOptionalUintQuery(c, "agent_id")
	managerID := parseOptionalUintQuery(c, "manager_id")
	out, err := h.svc.AccrualReport(keyID, start, end, punktID, agentID, managerID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", out, nil)
}

func (h *IntegrationKPIReportHandler) role(category string) gin.HandlerFunc {
	return func(c *gin.Context) {
		keyID, ok := integrationKeyID(c)
		if !ok {
			response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
			return
		}
		start, end, err := parseIntegrationKPIRange(c.Query("from"), c.Query("to"))
		if err != nil {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
		punktID := parseOptionalUintQuery(c, "punkt_id")
		agentID := parseOptionalUintQuery(c, "agent_id")
		managerID := parseOptionalUintQuery(c, "manager_id")
		out, err := h.svc.RoleReport(keyID, category, start, end, punktID, agentID, managerID)
		if err != nil {
			if err == service.ErrIntegrationKPIPayoutCategory {
				response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
				return
			}
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
			return
		}
		response.JSON(c, http.StatusOK, "OK", out, nil)
	}
}

func (h *IntegrationKPIReportHandler) Settle(c *gin.Context) {
	keyID, ok := integrationKeyID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	start, end, err := parseIntegrationKPIRange(c.Query("from"), c.Query("to"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	var req service.SettleIntegrationKPIPayoutInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.SettleUnpaid(keyID, start, end, req)
	if err != nil {
		switch err {
		case service.ErrIntegrationKPIPayoutCategory, service.ErrIntegrationKPIPayoutTargetRequired, service.ErrIntegrationKPIPayoutTargetForbidden:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusCreated, "To'lovlar belgilandi", out, nil)
}
