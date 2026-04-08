package handler

import (
	"net/http"
	"strings"

	"backend/internal/pkg/response"
	"backend/internal/pkg/security"
	adminDomain "backend/modules/admin/domain"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type LocalShopAuthHandler struct {
	service   service.LocalShopAuthService
	jwtSecret string
}

func NewLocalShopAuthHandler(s service.LocalShopAuthService, jwtSecret string) *LocalShopAuthHandler {
	return &LocalShopAuthHandler{service: s, jwtSecret: jwtSecret}
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

type updateLogoRequest struct {
	Logo string `json:"logo"`
}

func (h *LocalShopAuthHandler) RegisterPublicAuthRoutes(api *gin.RouterGroup) {
	auth := api.Group("/local-shops/auth")
	{
		auth.POST("/send-code", h.SendCode)
		auth.POST("/verify-code", h.VerifyCode)
		auth.POST("/resend-code", h.ResendCode)
		auth.POST("/set-password", h.SetPassword)
		auth.POST("/login", h.Login)
	}
}

func (h *LocalShopAuthHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	me.GET("/profile", h.Profile)
	me.POST("/change-password", h.ChangePassword)
	me.PATCH("/logo", h.UpdateLogo)
}

func (h *LocalShopAuthHandler) SendCode(c *gin.Context) {
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

func (h *LocalShopAuthHandler) VerifyCode(c *gin.Context) {
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

func (h *LocalShopAuthHandler) ResendCode(c *gin.Context) {
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

func (h *LocalShopAuthHandler) SetPassword(c *gin.Context) {
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
		"shop":  sanitizeLocalShop(result.Shop),
	}, nil)
}

func (h *LocalShopAuthHandler) Login(c *gin.Context) {
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
		"shop":  sanitizeLocalShop(result.Shop),
	}, nil)
}

func (h *LocalShopAuthHandler) Profile(c *gin.Context) {
	idVal, _ := c.Get("local_shop_id")
	localShopID, ok := idVal.(uint)
	if !ok || localShopID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	row, err := h.service.GetProfile(localShopID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Profil ma'lumoti olindi", sanitizeLocalShop(row), nil)
}

func (h *LocalShopAuthHandler) ChangePassword(c *gin.Context) {
	idVal, _ := c.Get("local_shop_id")
	localShopID, ok := idVal.(uint)
	if !ok || localShopID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}

	var req changePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.ChangePassword(localShopID, req.OldPassword, req.NewPassword); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Parol muvaffaqiyatli yangilandi", nil, nil)
}

func (h *LocalShopAuthHandler) UpdateLogo(c *gin.Context) {
	idVal, _ := c.Get("local_shop_id")
	localShopID, ok := idVal.(uint)
	if !ok || localShopID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}

	var req updateLogoRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.UpdateLogo(localShopID, req.Logo)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Logo yangilandi", sanitizeLocalShop(row), nil)
}

func (h *LocalShopAuthHandler) AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			if q := strings.TrimSpace(c.Query("token")); q != "" {
				authHeader = "Bearer " + q
			}
		}
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

		claims, err := security.ParseLocalShopToken(h.jwtSecret, parts[1])
		if err != nil {
			response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
			c.Abort()
			return
		}
		c.Set("local_shop_id", claims.LocalShopID)
		c.Next()
	}
}

func (h *LocalShopAuthHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrInvalidPhone, service.ErrCodeInvalid, service.ErrCodeNotVerified, service.ErrPasswordTooShort, service.ErrInvalidLogoBase64:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case service.ErrInvalidCredentials:
		response.JSON(c, http.StatusUnauthorized, err.Error(), nil, nil)
	case service.ErrLocalShopNotFound, service.ErrCodeNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrCodeExpired:
		response.JSON(c, http.StatusGone, err.Error(), nil, nil)
	case service.ErrLocalShopInactive, service.ErrPasswordAlreadySet, service.ErrPasswordNotSet:
		response.JSON(c, http.StatusForbidden, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func sanitizeLocalShop(row *adminDomain.NeighborhoodShop) gin.H {
	return gin.H{
		"id":                     row.ID,
		"name":                   row.Name,
		"inn":                    row.INN,
		"region_id":              row.RegionID,
		"district_id":            row.DistrictID,
		"mfy_id":                 row.MFYID,
		"phone":                  row.Phone,
		"logo":                   row.Logo,
		"has_logo":               strings.TrimSpace(row.Logo) != "",
		"status":                 row.Status,
		"password_setup_allowed": row.PasswordSetupAllowed,
		"has_password":           strings.TrimSpace(row.Password) != "",
		"created_at":             row.CreatedAt,
		"updated_at":             row.UpdatedAt,
	}
}
