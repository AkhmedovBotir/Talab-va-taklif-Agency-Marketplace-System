package handler

import (
	"errors"
	"net/http"
	"strings"

	"backend/internal/pkg/response"
	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/agents/service"
	"github.com/gin-gonic/gin"
)

type AgentAuthHandler struct {
	service   service.AgentAuthService
	jwtSecret string
}

func NewAgentAuthHandler(s service.AgentAuthService, jwtSecret string) *AgentAuthHandler {
	return &AgentAuthHandler{service: s, jwtSecret: jwtSecret}
}

type phoneRequest struct {
	Phone string `json:"phone"`
}

type verifyCodeRequest struct {
	Phone string `json:"phone"`
	Code  string `json:"code"`
}

type setPasswordRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type loginRequest struct {
	Phone    string `json:"phone"`
	Password string `json:"password"`
}

type changePasswordRequest struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

func (h *AgentAuthHandler) RegisterRoutes(api *gin.RouterGroup) {
	h.RegisterPublicAuthRoutes(api)
}

// RegisterPublicAuthRoutes — /agents/auth (ochiq marshrutlar).
func (h *AgentAuthHandler) RegisterPublicAuthRoutes(api *gin.RouterGroup) {
	auth := api.Group("/agents/auth")
	{
		auth.POST("/send-code", h.SendCode)
		auth.POST("/verify-code", h.VerifyCode)
		auth.POST("/resend-code", h.ResendCode)
		auth.POST("/set-password", h.SetPassword)
		auth.POST("/login", h.Login)
	}
}

// RegisterMeRoutes — yagona /agents/me guruhi ichida (middleware tashqarida).
func (h *AgentAuthHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/profile", h.Profile)
	me.POST("/change-password", h.ChangePassword)
}

func (h *AgentAuthHandler) SendCode(c *gin.Context) {
	var req phoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.SendCode(req.Phone); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "SMS kodi yuborildi", nil, nil)
}

func (h *AgentAuthHandler) VerifyCode(c *gin.Context) {
	var req verifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.VerifyCode(req.Phone, req.Code); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kod tasdiqlandi", nil, nil)
}

func (h *AgentAuthHandler) ResendCode(c *gin.Context) {
	var req phoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ResendCode(req.Phone); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "SMS kodi qayta yuborildi", nil, nil)
}

func (h *AgentAuthHandler) SetPassword(c *gin.Context) {
	var req setPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	result, err := h.service.SetPassword(req.Phone, req.Password)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Parol o'rnatildi", gin.H{
		"token": result.Token,
		"agent": sanitizeAgent(result.Agent),
	}, nil)
}

func (h *AgentAuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	result, err := h.service.Login(req.Phone, req.Password)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Muvaffaqiyatli login qilindi", gin.H{
		"token": result.Token,
		"agent": sanitizeAgent(result.Agent),
	}, nil)
}

func (h *AgentAuthHandler) Profile(c *gin.Context) {
	idVal, _ := c.Get("agent_id")
	agentID, ok := idVal.(uint)
	if !ok || agentID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	row, err := h.service.GetProfile(agentID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Profil ma'lumoti olindi", sanitizeAgent(row), nil)
}

func (h *AgentAuthHandler) ChangePassword(c *gin.Context) {
	idVal, _ := c.Get("agent_id")
	agentID, ok := idVal.(uint)
	if !ok || agentID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ChangePassword(agentID, req.OldPassword, req.NewPassword); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Parol muvaffaqiyatli yangilandi", nil, nil)
}

func (h *AgentAuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.JSON(c, http.StatusUnauthorized, "Authorization header topilmadi", nil, nil)
			c.Abort()
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.JSON(c, http.StatusUnauthorized, "Authorization formati noto'g'ri", nil, nil)
			c.Abort()
			return
		}

		claims, err := security.ParseAgentToken(h.jwtSecret, parts[1])
		if err != nil {
			response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
			c.Abort()
			return
		}
		c.Set("agent_id", claims.AgentID)
		c.Next()
	}
}

func (h *AgentAuthHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrPasswordNotSet):
		// Parol o'rnatilmagan: login/change-password uchun; SMS oqimidan o'tish kerak (403 emas — nofaol akkauntdan ajratish).
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrInvalidPhone), errors.Is(err, service.ErrCodeInvalid),
		errors.Is(err, service.ErrCodeNotVerified), errors.Is(err, service.ErrPasswordTooShort):
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case errors.Is(err, service.ErrInvalidCredentials):
		response.JSON(c, http.StatusUnauthorized, err.Error(), nil, nil)
	case errors.Is(err, service.ErrAgentNotFound), errors.Is(err, service.ErrCodeNotFound):
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case errors.Is(err, service.ErrCodeExpired):
		response.JSON(c, http.StatusGone, err.Error(), nil, nil)
	case errors.Is(err, service.ErrAgentInactive), errors.Is(err, service.ErrPasswordAlreadySet):
		response.JSON(c, http.StatusForbidden, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func sanitizeAgent(row *adminDomain.Agent) gin.H {
	return gin.H{
		"id":                     row.ID,
		"name":                   row.Name,
		"viloyat_id":             row.RegionID,
		"tuman_id":               row.DistrictID,
		"mfy_id":                 row.MFYID,
		"phone":                  row.Phone,
		"status":                 row.Status,
		"password_setup_allowed": row.PasswordSetupAllowed,
		"has_password":           strings.TrimSpace(row.Password) != "",
		"created_at":             row.CreatedAt,
		"updated_at":             row.UpdatedAt,
	}
}
