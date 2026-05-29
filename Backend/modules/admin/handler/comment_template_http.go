package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type CommentTemplateHandler struct {
	service service.CommentTemplateService
}

func NewCommentTemplateHandler(s service.CommentTemplateService) *CommentTemplateHandler {
	return &CommentTemplateHandler{service: s}
}

func (h *CommentTemplateHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/comment-templates")
	grp.Use(auth)
	{
		grp.POST("", h.Create)
		grp.GET("", h.GetAll)
		grp.GET("/:id", h.GetByID)
		grp.PUT("/:id", h.Update)
		grp.DELETE("/:id", h.Delete)
		grp.PATCH("/reorder", h.Reorder)
	}
}

func (h *CommentTemplateHandler) Create(c *gin.Context) {
	var req service.CommentTemplateInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Create(req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Kommentariya shabloni yaratildi", row, nil)
}

func (h *CommentTemplateHandler) GetAll(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	paginated, err := h.service.List(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Kommentariya shablonlari ro'yxati olindi", paginated, nil)
}

func (h *CommentTemplateHandler) GetByID(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	row, err := h.service.GetByID(id)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kommentariya shabloni olindi", row, nil)
}

func (h *CommentTemplateHandler) Update(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	var req service.CommentTemplateInput
	if err = c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.service.Update(id, req)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kommentariya shabloni yangilandi", row, nil)
}

func (h *CommentTemplateHandler) Delete(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = h.service.Delete(id); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kommentariya shabloni o'chirildi", nil, nil)
}

func (h *CommentTemplateHandler) Reorder(c *gin.Context) {
	var req service.ReorderCommentTemplateInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.service.Reorder(req); err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Kommentariya shablonlari tartibi yangilandi", nil, nil)
}

func (h *CommentTemplateHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrCommentTemplateNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	case service.ErrCommentTemplateCommentRequired,
		service.ErrCommentTemplateReorderInvalid, service.ErrInvalidStatusField:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
