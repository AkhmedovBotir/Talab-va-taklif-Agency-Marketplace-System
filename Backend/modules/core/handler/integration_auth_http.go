package handler

import (
	"net/http"
	"strings"

	"backend/internal/pkg/response"
	"backend/internal/pkg/security"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

// GinIntegrationKeyID — integratsiya JWT dan keyin c.Get(GinIntegrationKeyID).(uint)
const GinIntegrationKeyID = "integration_key_id"

// IntegrationAuthMiddleware — faqat integratsiya login JWT (`token_use: integration`).
func IntegrationAuthMiddleware(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := strings.TrimSpace(c.GetHeader("Authorization"))
		if auth == "" {
			// WebSocket klientlar ko'pincha custom header bera olmaydi.
			if q := strings.TrimSpace(c.Query("token")); q != "" {
				auth = "Bearer " + q
			}
		}
		if auth == "" {
			response.JSON(c, http.StatusUnauthorized, "Authorization: Bearer <token> kerak", nil, nil)
			c.Abort()
			return
		}
		parts := strings.SplitN(auth, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			response.JSON(c, http.StatusUnauthorized, "Authorization: Bearer <token> kerak", nil, nil)
			c.Abort()
			return
		}
		token := strings.TrimSpace(parts[1])
		if token == "" {
			response.JSON(c, http.StatusUnauthorized, "Token bo'sh", nil, nil)
			c.Abort()
			return
		}
		claims, err := security.ParseIntegrationToken(jwtSecret, token)
		if err != nil {
			response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz yoki muddati tugagan", nil, nil)
			c.Abort()
			return
		}
		c.Set(GinIntegrationKeyID, claims.IntegrationKeyID)
		c.Next()
	}
}

type IntegrationAuthHandler struct {
	svc service.IntegrationAPIKeyService
}

func NewIntegrationAuthHandler(svc service.IntegrationAPIKeyService) *IntegrationAuthHandler {
	return &IntegrationAuthHandler{svc: svc}
}

type integrationLoginRequest struct {
	APIKey string `json:"api_key"`
}

func (h *IntegrationAuthHandler) Login(c *gin.Context) {
	var req integrationLoginRequest
	_ = c.ShouldBindJSON(&req)
	key := strings.TrimSpace(req.APIKey)
	if key == "" {
		key = strings.TrimSpace(c.GetHeader("X-Integration-Api-Key"))
	}
	if key == "" {
		key = strings.TrimSpace(c.GetHeader("X-Api-Key"))
	}
	if key == "" {
		response.JSON(c, http.StatusBadRequest, "api_key majburiy: JSON {\"api_key\":\"...\"} yoki sarlavha X-Integration-Api-Key", nil, nil)
		return
	}
	res, err := h.svc.Login(key)
	if err != nil {
		switch err {
		case service.ErrIntegrationKeyAPIKeyRequired:
			response.JSON(c, http.StatusBadRequest, "api_key majburiy", nil, nil)
		case service.ErrInvalidIntegrationAPIKey:
			response.JSON(c, http.StatusUnauthorized, "Noto'g'ri api_key", nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusOK, "Muvaffaqiyatli", res, nil)
}

func (h *IntegrationAuthHandler) Me(c *gin.Context) {
	v, ok := c.Get(GinIntegrationKeyID)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni topilmadi", nil, nil)
		return
	}
	id, ok := v.(uint)
	if !ok || id == 0 {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni topilmadi", nil, nil)
		return
	}
	prof, err := h.svc.Profile(id)
	if err != nil {
		if err == service.ErrIntegrationKeyNotFound {
			response.JSON(c, http.StatusNotFound, "Kalit o'chirilgan yoki topilmadi", nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", prof, nil)
}
