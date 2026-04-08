package handler

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	"backend/modules/localshops/domain"
	"backend/modules/localshops/service"
	"github.com/gin-gonic/gin"
)

type CourierHandler struct {
	service service.CourierService
}

func NewCourierHandler(s service.CourierService) *CourierHandler {
	return &CourierHandler{service: s}
}

func (h *CourierHandler) RegisterMeRoutes(me *gin.RouterGroup) {
	g := me.Group("/couriers")
	{
		g.POST("", h.Create)
		g.GET("", h.GetAll)
		g.GET("/:id", h.GetByID)
		g.PUT("/:id", h.Update)
		g.DELETE("/:id", h.Delete)
	}
}

func (h *CourierHandler) Create(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	var req service.CourierInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Create(localShopID, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Kuryer yaratildi", sanitizeCourier(row), nil)
}

func (h *CourierHandler) GetAll(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	paginated, err := h.service.GetPaginated(localShopID, page, limit)
	if err != nil {
		h.handleError(c, err)
		return
	}
	items := make([]gin.H, 0, len(paginated.Items))
	for i := range paginated.Items {
		items = append(items, sanitizeCourier(&paginated.Items[i]))
	}
	response.JSON(c, http.StatusOK, "Kuryerlar ro'yxati olindi", gin.H{
		"items":       items,
		"total":       paginated.Total,
		"page":        paginated.Page,
		"limit":       paginated.Limit,
		"total_pages": paginated.TotalPages,
	}, nil)
}

func (h *CourierHandler) GetByID(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	row, err := h.service.GetByID(localShopID, id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kuryer ma'lumoti olindi", sanitizeCourier(row), nil)
}

func (h *CourierHandler) Update(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.CourierInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Update(localShopID, id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kuryer yangilandi", sanitizeCourier(row), nil)
}

func (h *CourierHandler) Delete(c *gin.Context) {
	localShopID, ok := localShopIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = h.service.Delete(localShopID, id); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kuryer o'chirildi", nil, nil)
}

func (h *CourierHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrCourierNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrCourierFirstNameRequired, service.ErrCourierLastNameRequired, service.ErrCourierPhoneInvalid, service.ErrCourierPasswordTooShort:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case service.ErrCourierPhoneExists:
		response.JSON(c, http.StatusConflict, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

func localShopIDFromCtx(c *gin.Context) (uint, bool) {
	v, ok := c.Get("local_shop_id")
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok && id > 0
}

func parseUintID(raw string) (uint, error) {
	v, err := strconv.ParseUint(raw, 10, 32)
	if err != nil {
		return 0, err
	}
	if v == 0 {
		return 0, errors.New("id must be greater than zero")
	}
	return uint(v), nil
}

func sanitizeCourier(row *domain.Courier) gin.H {
	return gin.H{
		"id":                     row.ID,
		"local_shop_id":          row.LocalShopID,
		"first_name":             row.FirstName,
		"last_name":              row.LastName,
		"phone":                  row.Phone,
		"note":                   row.Note,
		"password_setup_allowed": row.PasswordSetupAllowed,
		"has_password":           strings.TrimSpace(row.Password) != "",
		"created_at":             row.CreatedAt,
		"updated_at":             row.UpdatedAt,
	}
}
