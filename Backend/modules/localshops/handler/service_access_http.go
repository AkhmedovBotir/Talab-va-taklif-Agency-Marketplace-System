package handler

import (
	"net/http"
	"strings"

	"backend/internal/pkg/response"
	adminService "backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type ServiceAccessHandler struct {
	billing adminService.NeighborhoodShopBillingService
}

func NewServiceAccessHandler(billing adminService.NeighborhoodShopBillingService) *ServiceAccessHandler {
	return &ServiceAccessHandler{billing: billing}
}

func (h *ServiceAccessHandler) RegisterRoutes(me *gin.RouterGroup) {
	me.GET("/service-access", h.GetServiceAccess)
}

func (h *ServiceAccessHandler) ServiceAccessMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if isServiceAccessPath(c.Request.URL.Path) {
			c.Next()
			return
		}
		shopID, ok := localShopIDFromContext(c)
		if !ok {
			response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
			c.Abort()
			return
		}
		access, err := h.billing.EvaluateServiceAccess(shopID)
		if err != nil {
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
			c.Abort()
			return
		}
		if !access.CanOperate {
			response.JSON(c, http.StatusForbidden, access.Message, access, nil)
			c.Abort()
			return
		}
		c.Next()
	}
}

func (h *ServiceAccessHandler) GetServiceAccess(c *gin.Context) {
	shopID, ok := localShopIDFromContext(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	access, err := h.billing.EvaluateServiceAccess(shopID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	if access.CanOperate {
		response.JSON(c, http.StatusOK, access.Message, access, nil)
		return
	}
	response.JSON(c, http.StatusForbidden, access.Message, access, nil)
}

func isServiceAccessPath(path string) bool {
	path = strings.TrimSuffix(strings.TrimSpace(path), "/")
	return strings.HasSuffix(path, "/service-access")
}
