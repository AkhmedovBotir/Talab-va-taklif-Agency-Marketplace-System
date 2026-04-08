package handler

import (
	"net/http"
	"strconv"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationAPIKeyHandler struct {
	svc service.IntegrationAPIKeyService
}

func NewIntegrationAPIKeyHandler(svc service.IntegrationAPIKeyService) *IntegrationAPIKeyHandler {
	return &IntegrationAPIKeyHandler{svc: svc}
}

func (h *IntegrationAPIKeyHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc) {
	grp := api.Group("/integration-api-keys")
	grp.Use(auth, onlyGeneral)
	{
		grp.POST("", h.Create)
		grp.GET("", h.List)
		grp.PUT("/:id", h.Update)
		grp.DELETE("/:id", h.Delete)
	}
}

func (h *IntegrationAPIKeyHandler) Create(c *gin.Context) {
	var req service.CreateIntegrationKeyInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	row, err := h.svc.Create(req)
	if err != nil {
		if err == service.ErrIntegrationKeyNameRequired {
			response.JSON(c, http.StatusBadRequest, "name majburiy", nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusCreated, "Integratsiya kaliti yaratildi", row, nil)
}

func (h *IntegrationAPIKeyHandler) List(c *gin.Context) {
	rows, err := h.svc.List()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Ro'yxat", rows, nil)
}

func (h *IntegrationAPIKeyHandler) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	var req service.UpdateIntegrationKeyInput
	if err := c.ShouldBindJSON(&req); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	if err := h.svc.Update(uint(id), req); err != nil {
		if err == service.ErrIntegrationKeyNameRequired {
			response.JSON(c, http.StatusBadRequest, "name majburiy", nil, nil)
			return
		}
		if err == service.ErrIntegrationKeyNotFound {
			response.JSON(c, http.StatusNotFound, "Integratsiya kaliti topilmadi", nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Yangilandi", nil, nil)
}

func (h *IntegrationAPIKeyHandler) Delete(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil || id == 0 {
		response.JSON(c, http.StatusBadRequest, "Noto'g'ri id", nil, nil)
		return
	}
	if err := h.svc.Delete(uint(id)); err != nil {
		if err == service.ErrIntegrationKeyNotFound {
			response.JSON(c, http.StatusNotFound, "Integratsiya kaliti topilmadi", nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'chirildi", nil, nil)
}
