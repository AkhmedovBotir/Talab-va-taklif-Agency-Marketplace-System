package handler

import (
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationTransactionKPIHandler struct {
	svc service.IntegrationKPIAllocationService
}

func NewIntegrationTransactionKPIHandler(svc service.IntegrationKPIAllocationService) *IntegrationTransactionKPIHandler {
	return &IntegrationTransactionKPIHandler{svc: svc}
}

type transactionKPIComputeRequest struct {
	Lines []service.TransactionKPILine `json:"lines"`
}

func (h *IntegrationTransactionKPIHandler) Compute(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	var req transactionKPIComputeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	res, err := h.svc.ComputeTransactionKPI(keyID, req.Lines)
	if err != nil {
		switch err {
		case service.ErrTransactionKPIEmptyLines:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case service.ErrTransactionKPIInvalidLine, service.ErrTransactionKPIInvalidKpiBonus:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusOK, "OK", res, nil)
}

type transactionKPIByOrderRequest struct {
	OrderID uint `json:"order_id"`
}

func (h *IntegrationTransactionKPIHandler) ByOrder(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	var req transactionKPIByOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if req.OrderID == 0 {
		response.JSON(c, http.StatusBadRequest, "order_id majburiy", nil, nil)
		return
	}
	res, err := h.svc.ComputeTransactionKPIByOrderID(keyID, req.OrderID)
	if err != nil {
		switch err {
		case service.ErrOrderForKPI:
			response.JSON(c, http.StatusNotFound, "Buyurtma topilmadi", nil, nil)
		case service.ErrTransactionKPIEmptyLines:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case service.ErrTransactionKPIInvalidLine, service.ErrTransactionKPIInvalidKpiBonus:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case service.ErrTransactionKPIOrderNotWired:
			response.JSON(c, http.StatusInternalServerError, err.Error(), nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusOK, "OK", res, nil)
}
