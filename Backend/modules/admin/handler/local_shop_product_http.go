package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	"backend/modules/admin/domain"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

type LocalShopProductHandler struct {
	service service.LocalShopProductService
}

func NewLocalShopProductHandler(s service.LocalShopProductService) *LocalShopProductHandler {
	return &LocalShopProductHandler{service: s}
}

func (h *LocalShopProductHandler) RegisterRoutes(api *gin.RouterGroup, auth gin.HandlerFunc) {
	grp := api.Group("/local-shop-products")
	grp.Use(auth)
	{
		grp.GET("", h.GetAll)
		grp.GET("/:id", h.GetByID)
	}
}

func (h *LocalShopProductHandler) GetAll(c *gin.Context) {
	filter, err := parseLocalShopProductListFilter(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	paginated, err := h.service.GetPaginated(filter)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "Maxalla do'koni mahsulotlari ro'yxati olindi", gin.H{
		"items":       paginated.Items,
		"total":       paginated.Total,
		"page":        paginated.Page,
		"limit":       paginated.Limit,
		"total_pages": paginated.TotalPages,
	}, nil)
}

func (h *LocalShopProductHandler) GetByID(c *gin.Context) {
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
	response.JSON(c, http.StatusOK, "Maxalla do'koni mahsuloti olindi", row, nil)
}

func parseLocalShopProductListFilter(c *gin.Context) (service.LocalShopProductListFilter, error) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	filter := service.LocalShopProductListFilter{
		Page:           page,
		Limit:          limit,
		Q:              c.Query("q"),
		ShopStatus:     c.Query("shop_status"),
		TemplateStatus: c.Query("template_status"),
	}

	optionalFields := []struct {
		name string
		dest **uint
	}{
		{"local_shop_id", &filter.LocalShopID},
		{"template_id", &filter.TemplateID},
		{"region_id", &filter.RegionID},
		{"district_id", &filter.DistrictID},
		{"mfy_id", &filter.MFYID},
	}
	for _, field := range optionalFields {
		v := strings.TrimSpace(c.Query(field.name))
		if v == "" {
			continue
		}
		id, err := parseUintID(v)
		if err != nil {
			return filter, errInvalidQueryParam(field.name)
		}
		*field.dest = &id
	}

	if filter.ShopStatus != "" && filter.ShopStatus != domain.StatusActive && filter.ShopStatus != domain.StatusInactive {
		return filter, errInvalidQueryParam("shop_status")
	}
	if filter.TemplateStatus != "" && filter.TemplateStatus != domain.StatusActive && filter.TemplateStatus != domain.StatusInactive {
		return filter, errInvalidQueryParam("template_status")
	}
	return filter, nil
}

type invalidQueryParamError struct {
	param string
}

func errInvalidQueryParam(param string) invalidQueryParamError {
	return invalidQueryParamError{param: param}
}

func (e invalidQueryParamError) Error() string {
	return e.param + " noto'g'ri"
}

func (h *LocalShopProductHandler) handleError(c *gin.Context, err error) {
	switch err {
	case service.ErrLocalShopProductNotFound:
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
	default:
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
	}
}
