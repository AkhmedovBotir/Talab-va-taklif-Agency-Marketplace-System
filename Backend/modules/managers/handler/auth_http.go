package handler

import (
	"errors"
	"strings"

	"backend/internal/pkg/response"
	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	service   service.AuthService
	jwtSecret string
}

func NewAuthHandler(s service.AuthService, jwtSecret string) *AuthHandler {
	return &AuthHandler{service: s, jwtSecret: jwtSecret}
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

func (h *AuthHandler) RegisterPublicAuthRoutes(api *gin.RouterGroup) {
	auth := api.Group("/managers/auth")
	auth.POST("/send-code", h.SendCode)
	auth.POST("/verify-code", h.VerifyCode)
	auth.POST("/resend-code", h.ResendCode)
	auth.POST("/set-password", h.SetPassword)
	auth.POST("/login", h.Login)
}
func (h *AuthHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/profile", h.Profile)
	me.POST("/change-password", h.ChangePassword)
}

func (h *AuthHandler) SendCode(c *gin.Context) {
	var req phoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.SendCode(req.Phone); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "SMS kodi yuborildi", nil, nil)
}
func (h *AuthHandler) VerifyCode(c *gin.Context) {
	var req verifyCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.VerifyCode(req.Phone, req.Code); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "Kod tasdiqlandi", nil, nil)
}
func (h *AuthHandler) ResendCode(c *gin.Context) {
	var req phoneRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ResendCode(req.Phone); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "SMS kodi qayta yuborildi", nil, nil)
}
func (h *AuthHandler) SetPassword(c *gin.Context) {
	var req setPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	result, err := h.service.SetPassword(req.Phone, req.Password)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "Parol o'rnatildi", gin.H{"token": result.Token, "manager": sanitizeManager(result.Manager)}, nil)
}
func (h *AuthHandler) Login(c *gin.Context) {
	var req loginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	result, err := h.service.Login(req.Phone, req.Password)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "Muvaffaqiyatli login qilindi", gin.H{"token": result.Token, "manager": sanitizeManager(result.Manager)}, nil)
}
func (h *AuthHandler) Profile(c *gin.Context) {
	id, ok := c.Get("manager_id")
	managerID, ok2 := id.(uint)
	if !ok || !ok2 || managerID == 0 {
		response.JSON(c, 401, "Token yaroqsiz", nil, nil)
		return
	}
	row, err := h.service.GetProfile(managerID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "Profil ma'lumoti olindi", sanitizeManager(row), nil)
}
func (h *AuthHandler) ChangePassword(c *gin.Context) {
	id, ok := c.Get("manager_id")
	managerID, ok2 := id.(uint)
	if !ok || !ok2 || managerID == 0 {
		response.JSON(c, 401, "Token yaroqsiz", nil, nil)
		return
	}
	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, 400, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ChangePassword(managerID, req.OldPassword, req.NewPassword); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, 200, "Parol muvaffaqiyatli yangilandi", nil, nil)
}

func (h *AuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			if q := strings.TrimSpace(c.Query("token")); q != "" {
				authHeader = "Bearer " + q
			}
		}
		if authHeader == "" {
			response.JSON(c, 401, "Authorization header topilmadi", nil, nil)
			c.Abort()
			return
		}
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.JSON(c, 401, "Authorization formati noto'g'ri", nil, nil)
			c.Abort()
			return
		}
		claims, err := security.ParseManagerToken(h.jwtSecret, parts[1])
		if err != nil {
			response.JSON(c, 401, "Token yaroqsiz", nil, nil)
			c.Abort()
			return
		}
		c.Set("manager_id", claims.ManagerID)
		c.Next()
	}
}

func (h *AuthHandler) handleError(c *gin.Context, err error) {
	switch {
	case errors.Is(err, service.ErrPasswordNotSet), errors.Is(err, service.ErrInvalidPhone), errors.Is(err, service.ErrCodeInvalid), errors.Is(err, service.ErrCodeNotVerified), errors.Is(err, service.ErrPasswordTooShort):
		response.JSON(c, 400, err.Error(), nil, nil)
	case errors.Is(err, service.ErrInvalidCredentials):
		response.JSON(c, 401, err.Error(), nil, nil)
	case errors.Is(err, service.ErrManagerNotFound), errors.Is(err, service.ErrCodeNotFound):
		response.JSON(c, 404, err.Error(), nil, nil)
	case errors.Is(err, service.ErrCodeExpired):
		response.JSON(c, 410, err.Error(), nil, nil)
	case errors.Is(err, service.ErrManagerInactive), errors.Is(err, service.ErrPasswordAlreadySet):
		response.JSON(c, 403, err.Error(), nil, nil)
	default:
		response.JSON(c, 500, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func sanitizeManager(row *adminDomain.Manager) gin.H {
	return gin.H{
		"id":                     row.ID,
		"name":                   row.Name,
		"viloyat_id":             row.RegionID,
		"phone":                  row.Phone,
		"status":                 row.Status,
		"password_setup_allowed": row.PasswordSetupAllowed,
		"has_password":           strings.TrimSpace(row.Password) != "",
		"created_at":             row.CreatedAt,
		"updated_at":             row.UpdatedAt,
	}
}
