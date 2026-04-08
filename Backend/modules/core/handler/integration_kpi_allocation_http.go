package handler

import (
	"net/http"

	"backend/internal/pkg/response"
	"backend/modules/core/service"
	"github.com/gin-gonic/gin"
)

type IntegrationKPIAllocationHandler struct {
	svc service.IntegrationKPIAllocationService
}

func NewIntegrationKPIAllocationHandler(svc service.IntegrationKPIAllocationService) *IntegrationKPIAllocationHandler {
	return &IntegrationKPIAllocationHandler{svc: svc}
}

func integrationKeyIDFromCtx(c *gin.Context) (uint, bool) {
	v, ok := c.Get(GinIntegrationKeyID)
	if !ok {
		return 0, false
	}
	id, ok := v.(uint)
	return id, ok && id > 0
}

func (h *IntegrationKPIAllocationHandler) Get(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	res, err := h.svc.Get(keyID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "OK", res, nil)
}

func (h *IntegrationKPIAllocationHandler) Create(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	var body service.KPIAllocationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.Create(keyID, body)
	if err != nil {
		switch err {
		case service.ErrKPIAllocationInvalidSum, service.ErrKPIAllocationInvalidRange:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case service.ErrKPIAllocationAlreadyExists:
			response.JSON(c, http.StatusConflict, "KPI ajratish allaqachon mavjud", nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusCreated, "Yaratildi", out, nil)
}

func (h *IntegrationKPIAllocationHandler) Update(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	var body service.KPIAllocationBody
	if err := c.ShouldBindJSON(&body); err != nil {
		response.JSON(c, http.StatusBadRequest, "So'rov formati noto'g'ri", nil, err.Error())
		return
	}
	out, err := h.svc.Update(keyID, body)
	if err != nil {
		switch err {
		case service.ErrKPIAllocationInvalidSum, service.ErrKPIAllocationInvalidRange:
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		case service.ErrKPIAllocationNotFound:
			response.JSON(c, http.StatusNotFound, "KPI ajratish topilmadi", nil, nil)
		default:
			response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		}
		return
	}
	response.JSON(c, http.StatusOK, "Yangilandi", out, nil)
}

func (h *IntegrationKPIAllocationHandler) Delete(c *gin.Context) {
	keyID, ok := integrationKeyIDFromCtx(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Integratsiya tokeni kerak", nil, nil)
		return
	}
	if err := h.svc.Delete(keyID); err != nil {
		if err == service.ErrKPIAllocationNotFound {
			response.JSON(c, http.StatusNotFound, "KPI ajratish topilmadi", nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "O'chirildi", nil, nil)
}
