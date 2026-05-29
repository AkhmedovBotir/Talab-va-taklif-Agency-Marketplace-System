package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type ProductCommentFollowupHandler struct {
	service service.AdminProductCommentFollowupService
}

func NewProductCommentFollowupHandler(s service.AdminProductCommentFollowupService) *ProductCommentFollowupHandler {
	return &ProductCommentFollowupHandler{service: s}
}

func (h *ProductCommentFollowupHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/product-comments")
	grp.Use(auth)
	{
		grp.GET("", h.List)
		grp.GET("/:rating_id", h.Get)
		grp.POST("/:rating_id/notes", h.AddNote)
		grp.POST("/:rating_id/calls", h.AddCall)
		grp.POST("/:rating_id/resolve", h.Resolve)
	}
}

func (h *ProductCommentFollowupHandler) List(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	var status *string
	if v := strings.TrimSpace(c.Query("status")); v != "" {
		status = &v
	}
	var escalated *bool
	if v := strings.TrimSpace(c.Query("escalated")); v != "" {
		b := strings.ToLower(v) == "true" || v == "1"
		escalated = &b
	}

	out, err := h.service.List(page, limit, status, escalated)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Kommentlar ro'yxati olindi", out, nil)
}

func (h *ProductCommentFollowupHandler) Get(c *gin.Context) {
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.Get(ratingID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Komment ma'lumoti olindi", out, nil)
}

func (h *ProductCommentFollowupHandler) AddNote(c *gin.Context) {
	ratingID, adminID, ok := h.parseIDs(c)
	if !ok {
		return
	}
	var req service.ProductCommentActionInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.AddNote(adminID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Note qo'shildi", nil, nil)
}

func (h *ProductCommentFollowupHandler) AddCall(c *gin.Context) {
	ratingID, adminID, ok := h.parseIDs(c)
	if !ok {
		return
	}
	var req service.ProductCommentActionInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.AddCall(adminID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Qo'ng'iroq qaydi saqlandi", nil, nil)
}

func (h *ProductCommentFollowupHandler) Resolve(c *gin.Context) {
	ratingID, adminID, ok := h.parseIDs(c)
	if !ok {
		return
	}
	var req service.ProductCommentActionInput
	_ = c.ShouldBindJSON(&req)
	if err := h.service.Resolve(adminID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Muammo hal qilindi deb belgilandi", nil, nil)
}

func (h *ProductCommentFollowupHandler) parseIDs(c *gin.Context) (uint, uint, bool) {
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return 0, 0, false
	}
	adminIDRaw, ok := c.Get("admin_id")
	adminID, ok2 := adminIDRaw.(uint)
	if !ok || !ok2 || adminID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return 0, 0, false
	}
	return ratingID, adminID, true
}

func (h *ProductCommentFollowupHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrProductCommentNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrFollowupNoteRequired:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

