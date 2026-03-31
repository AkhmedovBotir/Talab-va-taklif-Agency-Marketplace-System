package handler

import (
	"net/http"
	"strings"

	"backend/internal/pkg/response"
	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
)

type PunktAuthHandler struct {
	service   service.PunktAuthService
	jwtSecret string
}

func NewPunktAuthHandler(s service.PunktAuthService, jwtSecret string) *PunktAuthHandler {
	return &PunktAuthHandler{service: s, jwtSecret: jwtSecret}
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

func (h *PunktAuthHandler) RegisterRoutes(api *gin.RouterGroup) {
	h.RegisterPublicAuthRoutes(api)
}

// RegisterPublicAuthRoutes — /punkts/auth (token talab qilmaydi).
func (h *PunktAuthHandler) RegisterPublicAuthRoutes(api *gin.RouterGroup) {
	auth := api.Group("/punkts/auth")
	{
		auth.POST("/send-code", h.SendCode)
		auth.POST("/verify-code", h.VerifyCode)
		auth.POST("/resend-code", h.ResendCode)
		auth.POST("/set-password", h.SetPassword)
		auth.POST("/login", h.Login)
	}
}

// RegisterMeRoutes — bitta /punkts/me guruhi ichida (middleware tashqarida qo‘llanadi).
func (h *PunktAuthHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/profile", h.Profile)
	me.POST("/change-password", h.ChangePassword)
}

func (h *PunktAuthHandler) SendCode(c *gin.Context) {
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

func (h *PunktAuthHandler) VerifyCode(c *gin.Context) {
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

func (h *PunktAuthHandler) ResendCode(c *gin.Context) {
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

func (h *PunktAuthHandler) SetPassword(c *gin.Context) {
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
		"punkt": sanitizePunkt(result.Punkt),
	}, nil)
}

func (h *PunktAuthHandler) Login(c *gin.Context) {
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
		"punkt": sanitizePunkt(result.Punkt),
	}, nil)
}

func (h *PunktAuthHandler) Profile(c *gin.Context) {
	idVal, _ := c.Get("punkt_id")
	punktID, ok := idVal.(uint)
	if !ok || punktID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	row, err := h.service.GetProfile(punktID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Profil ma'lumoti olindi", sanitizePunkt(row), nil)
}

func (h *PunktAuthHandler) ChangePassword(c *gin.Context) {
	idVal, _ := c.Get("punkt_id")
	punktID, ok := idVal.(uint)
	if !ok || punktID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ChangePassword(punktID, req.OldPassword, req.NewPassword); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Parol muvaffaqiyatli yangilandi", nil, nil)
}

func (h *PunktAuthHandler) AuthMiddleware() gin.HandlerFunc {
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

		claims, err := security.ParsePunktToken(h.jwtSecret, parts[1])
		if err != nil {
			response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
			c.Abort()
			return
		}
		c.Set("punkt_id", claims.PunktID)
		c.Next()
	}
}

func (h *PunktAuthHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrInvalidPhone, service.ErrCodeInvalid, service.ErrCodeNotVerified, service.ErrPasswordTooShort:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case service.ErrInvalidCredentials:
		response.JSON(c, http.StatusUnauthorized, err.Error(), nil, nil)
	case service.ErrPunktNotFound, service.ErrCodeNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrCodeExpired:
		response.JSON(c, http.StatusGone, err.Error(), nil, nil)
	case service.ErrPunktInactive, service.ErrPasswordAlreadySet, service.ErrPasswordNotSet:
		response.JSON(c, http.StatusForbidden, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func sanitizePunkt(row *adminDomain.Punkt) gin.H {
	return gin.H{
		"id":                     row.ID,
		"name":                   row.Name,
		"viloyat_id":             row.RegionID,
		"tuman_id":               row.DistrictID,
		"phone":                  row.Phone,
		"status":                 row.Status,
		"password_setup_allowed": row.PasswordSetupAllowed,
		"has_password":           strings.TrimSpace(row.Password) != "",
		"created_at":             row.CreatedAt,
		"updated_at":             row.UpdatedAt,
	}
}
