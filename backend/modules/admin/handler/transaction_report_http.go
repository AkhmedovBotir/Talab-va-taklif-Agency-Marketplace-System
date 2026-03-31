package handler

import (
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type TransactionReportHandler struct {
	service service.TransactionReportService
}

func NewTransactionReportHandler(s service.TransactionReportService) *TransactionReportHandler {
	return &TransactionReportHandler{service: s}
}

func (h *TransactionReportHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc) {
	grp := api.Group("/transactions")
	grp.Use(auth, onlyGeneral)
	{
		grp.GET("/by-area", h.ByArea)
	}
}

func (h *TransactionReportHandler) ByArea(c *gin.Context) {
	level := c.DefaultQuery("level", "region")
	status := c.Query("status")
	from := c.Query("from")
	to := c.Query("to")
	out, err := h.service.ByArea(level, status, from, to)
	if err != nil {
		if err == service.ErrInvalidAreaLevel {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusBadRequest, "Sana formati noto'g'ri (RFC3339)", nil, nil)
		return
	}
	response.JSON(c, http.StatusOK, "Hududlar kesimida tranzaksiyalar olindi", out, nil)
}
