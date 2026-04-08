package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	"backend/modules/managers/repository"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
)

type ManagerMarketplaceUserHandler struct {
	service service.ManagerMarketplaceUserService
	authSvc service.AuthService
}

type managerContext struct {
	RegionID uint
}

func NewManagerMarketplaceUserHandler(s service.ManagerMarketplaceUserService, authSvc service.AuthService) *ManagerMarketplaceUserHandler {
	return &ManagerMarketplaceUserHandler{service: s, authSvc: authSvc}
}

func (h *ManagerMarketplaceUserHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/managers/marketplace-users")
	grp.Use(auth)
	{
		grp.GET("", h.GetAll)
		grp.GET("/:id", h.GetByID)
	}
}

func (h *ManagerMarketplaceUserHandler) GetAll(c *gin.Context) {
	manager, ok := h.currentManager(c)
	if !ok {
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))

	filter := repository.ManagerMarketplaceUserFilter{}
	if v := strings.TrimSpace(c.Query("status")); v != "" {
		filter.Status = &v
	}
	if v := strings.TrimSpace(c.Query("district_id")); v != "" {
		id, err := parseUintID(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "district_id noto'g'ri", nil, nil)
			return
		}
		filter.DistrictID = &id
	}
	if v := strings.TrimSpace(c.Query("mfy_id")); v != "" {
		id, err := parseUintID(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "mfy_id noto'g'ri", nil, nil)
			return
		}
		filter.MFYID = &id
	}
	if v := strings.TrimSpace(c.Query("phone")); v != "" {
		filter.Phone = &v
	}
	if v := strings.TrimSpace(c.Query("q")); v != "" {
		filter.Query = &v
	}

	out, err := h.service.GetPaginatedByRegion(manager.RegionID, page, limit, filter)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}

	response.JSON(c, http.StatusOK, "Viloyatingizdagi marketplace userlar ro'yxati olindi", gin.H{
		"items":       out.Items,
		"total":       out.Total,
		"page":        out.Page,
		"limit":       out.Limit,
		"total_pages": out.TotalPages,
	}, nil)
}

func (h *ManagerMarketplaceUserHandler) GetByID(c *gin.Context) {
	manager, ok := h.currentManager(c)
	if !ok {
		return
	}

	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}

	row, err := h.service.GetByIDInRegion(id, manager.RegionID)
	if err != nil {
		if errorsIsMarketplaceNotFound(err) {
			response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
			return
		}
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Marketplace user ma'lumoti olindi", row, nil)
}

func (h *ManagerMarketplaceUserHandler) currentManager(c *gin.Context) (*managerContext, bool) {
	idVal, ok := c.Get("manager_id")
	managerID, ok2 := idVal.(uint)
	if !ok || !ok2 || managerID == 0 {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, false
	}
	row, err := h.authSvc.GetProfile(managerID)
	if err != nil || row == nil {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return nil, false
	}
	return &managerContext{RegionID: row.RegionID}, true
}

func parseUintID(v string) (uint, error) {
	id64, err := strconv.ParseUint(v, 10, 32)
	if err != nil {
		return 0, err
	}
	return uint(id64), nil
}

func errorsIsMarketplaceNotFound(err error) bool {
	return err == service.ErrMarketplaceUserNotFound
}

