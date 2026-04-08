package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	adminSvc "backend/modules/admin/service"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
)

type ManagerProductCommentFollowupHandler struct {
	service service.ManagerProductCommentFollowupService
	authSvc service.AuthService
}

func NewManagerProductCommentFollowupHandler(s service.ManagerProductCommentFollowupService, authSvc service.AuthService) *ManagerProductCommentFollowupHandler {
	return &ManagerProductCommentFollowupHandler{service: s, authSvc: authSvc}
}

func (h *ManagerProductCommentFollowupHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/managers/product-comments")
	grp.Use(auth)
	{
		grp.GET("", h.List)
		grp.GET("/:rating_id", h.Get)
		grp.POST("/:rating_id/notes", h.AddNote)
		grp.POST("/:rating_id/calls", h.AddCall)
		grp.POST("/:rating_id/escalate", h.Escalate)
		grp.POST("/:rating_id/resolve", h.Resolve)
	}
}

func (h *ManagerProductCommentFollowupHandler) List(c *gin.Context) {
	manager, managerID, ok := h.currentManager(c)
	if !ok {
		return
	}
	_ = managerID
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
	out, err := h.service.List(manager.RegionID, page, limit, status, escalated)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Viloyatingizdagi kommentlar ro'yxati olindi", out, nil)
}

func (h *ManagerProductCommentFollowupHandler) Get(c *gin.Context) {
	manager, _, ok := h.currentManager(c)
	if !ok {
		return
	}
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.Get(manager.RegionID, ratingID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Komment ma'lumoti olindi", out, nil)
}

func (h *ManagerProductCommentFollowupHandler) AddNote(c *gin.Context) {
	manager, managerID, ok := h.currentManager(c)
	if !ok {
		return
	}
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	var req adminSvc.ProductCommentActionInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err = h.service.AddNote(managerID, manager.RegionID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Note qo'shildi", nil, nil)
}

func (h *ManagerProductCommentFollowupHandler) AddCall(c *gin.Context) {
	manager, managerID, ok := h.currentManager(c)
	if !ok {
		return
	}
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	var req adminSvc.ProductCommentActionInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err = h.service.AddCall(managerID, manager.RegionID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Qo'ng'iroq qaydi saqlandi", nil, nil)
}

func (h *ManagerProductCommentFollowupHandler) Escalate(c *gin.Context) {
	manager, managerID, ok := h.currentManager(c)
	if !ok {
		return
	}
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	var req adminSvc.ProductCommentActionInput
	_ = c.ShouldBindJSON(&req)
	if err = h.service.Escalate(managerID, manager.RegionID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Adminga yuborildi", nil, nil)
}

func (h *ManagerProductCommentFollowupHandler) Resolve(c *gin.Context) {
	manager, managerID, ok := h.currentManager(c)
	if !ok {
		return
	}
	ratingID, err := parseUintID(c.Param("rating_id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "rating_id noto'g'ri", nil, nil)
		return
	}
	var req adminSvc.ProductCommentActionInput
	_ = c.ShouldBindJSON(&req)
	if err = h.service.Resolve(managerID, manager.RegionID, ratingID, req.Note); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Muammo hal qilindi deb belgilandi", nil, nil)
}

func (h *ManagerProductCommentFollowupHandler) currentManager(c *gin.Context) (*managerContext, uint, bool) {
	idVal, ok := c.Get("manager_id")
	managerID, ok2 := idVal.(uint)
	if !ok || !ok2 || managerID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, 0, false
	}
	row, err := h.authSvc.GetProfile(managerID)
	if err != nil || row == nil {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, 0, false
	}
	return &managerContext{RegionID: row.RegionID}, managerID, true
}

func (h *ManagerProductCommentFollowupHandler) handleError(c *gin.Context, err error) {
	switch err {
	case adminSvc.ErrProductCommentNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case adminSvc.ErrFollowupNoteRequired:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}

