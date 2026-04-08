package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/admin/domain"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type ArchiveHandler struct{ service service.ArchiveService }

func NewArchiveHandler(s service.ArchiveService) *ArchiveHandler { return &ArchiveHandler{service: s} }

func (h *ArchiveHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc) {
	base := api.Group("/arxiv")
	base.Use(auth, onlyGeneral)
	h.registerType(base, domain.ArchiveTypeAgent)
	h.registerType(base, domain.ArchiveTypeContragent)
	h.registerType(base, domain.ArchiveTypeLocalShop)
	h.registerType(base, domain.ArchiveTypeMarketplaceUser)
	h.registerType(base, domain.ArchiveTypePunkt)
}

func (h *ArchiveHandler) registerType(base *gin.RouterGroup, entityType string) {
	g := base.Group("/" + entityType)
	g.GET("", func(c *gin.Context) { h.list(c, entityType) })
	g.GET("/:id", func(c *gin.Context) { h.get(c, entityType) })
}

func (h *ArchiveHandler) list(c *gin.Context, entityType string) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	out, err := h.service.List(entityType, page, limit)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Arxiv ro'yxati olindi", out, nil)
}
func (h *ArchiveHandler) get(c *gin.Context, entityType string) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.service.Get(entityType, id)
	if err != nil {
		h.handleErr(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Arxiv ma'lumoti olindi", out, nil)
}
func (h *ArchiveHandler) handleErr(c *gin.Context, err error) {
	switch err {
	case service.ErrArchiveTypeInvalid:
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
	case service.ErrArchiveNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
