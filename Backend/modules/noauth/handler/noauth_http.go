package handler

import (
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/response"
	mpsvc "backend/modules/marketplace/service"
	"backend/modules/noauth/service"
	"github.com/gin-gonic/gin"
)

type NoAuthHandler struct {
	svc *service.NoAuthService
}

func NewNoAuthHandler(svc *service.NoAuthService) *NoAuthHandler {
	return &NoAuthHandler{svc: svc}
}

func (h *NoAuthHandler) RegisterRoutes(api *gin.RouterGroup) {
	grp := api.Group("/noauth")
	{
		grp.GET("/products", h.ListProducts)
		grp.GET("/products/:id", h.GetProductByID)
		grp.GET("/categories", h.ListCategories)
		grp.GET("/categories/:id", h.GetCategoryByID)
		grp.GET("/subcategories", h.ListSubcategories)
		grp.GET("/subcategories/:id", h.GetSubcategoryByID)
		grp.GET("/contragents", h.ListContragents)
		grp.GET("/regions", h.ListRegions)
		grp.GET("/districts", h.ListDistricts)
		grp.GET("/mfys", h.ListMFYs)
		grp.GET("/punkts", h.ListPunkts)
		grp.GET("/agents", h.ListAgents)
		grp.GET("/managers", h.ListManagers)
		grp.GET("/marketplace-users", h.ListMarketplaceUsers)
		grp.GET("/activity-types", h.ListActivityTypes)
		grp.GET("/local-shops", h.ListLocalShops)
		grp.GET("/local-shop-products", h.ListLocalShopProducts)
		grp.GET("/contragent-banners", h.ListContragentBanners)
		grp.GET("/product-ratings", h.ListProductRatings)
		grp.GET("/comment-templates", h.ListCommentTemplates)
	}
}

func parsePageLimit(c *gin.Context) (int, int) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}
	return page, limit
}

func parseUint(raw string) (uint, error) {
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil {
		return 0, err
	}
	return uint(v), nil
}

func paginated(items interface{}, total int64, page, limit int) gin.H {
	totalPages := int((total + int64(limit) - 1) / int64(limit))
	if totalPages == 0 {
		totalPages = 1
	}
	return gin.H{
		"items":       items,
		"total":       total,
		"page":        page,
		"limit":       limit,
		"total_pages": totalPages,
	}
}

func (h *NoAuthHandler) ListProducts(c *gin.Context) {
	page, limit := parsePageLimit(c)
	filter := mpsvc.MarketplaceProductFilter{}

	if v := strings.TrimSpace(c.Query("category_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "category_id noto'g'ri", nil, nil)
			return
		}
		filter.CategoryID = &id
	}
	if v := strings.TrimSpace(c.Query("subcategory_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "subcategory_id noto'g'ri", nil, nil)
			return
		}
		filter.SubcategoryID = &id
	}
	if v := strings.TrimSpace(c.Query("contragent_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "contragent_id noto'g'ri", nil, nil)
			return
		}
		filter.ContragentID = &id
	}
	if q := strings.TrimSpace(c.Query("q")); q != "" {
		filter.Query = &q
	}

	out, err := h.svc.Products(filter, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth mahsulotlar ro'yxati olindi", out, nil)
}

func (h *NoAuthHandler) GetProductByID(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "id noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.ProductByID(id)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	if out == nil {
		response.JSON(c, http.StatusNotFound, "Mahsulot topilmadi", nil, nil)
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth mahsulot ma'lumoti olindi", out, nil)
}

func (h *NoAuthHandler) ListCategories(c *gin.Context) {
	page, limit := parsePageLimit(c)
	out, err := h.svc.Categories(page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth kategoriyalar ro'yxati olindi", out, nil)
}

func (h *NoAuthHandler) GetCategoryByID(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.CategoryByID(id)
	if err != nil {
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth kategoriya ma'lumoti olindi", out, nil)
}

func (h *NoAuthHandler) ListSubcategories(c *gin.Context) {
	page, limit := parsePageLimit(c)
	var parentID *uint
	if v := strings.TrimSpace(c.Query("parent_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "parent_id noto'g'ri", nil, nil)
			return
		}
		parentID = &id
	}
	out, err := h.svc.Subcategories(page, limit, parentID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth subkategoriyalar ro'yxati olindi", out, nil)
}

func (h *NoAuthHandler) GetSubcategoryByID(c *gin.Context) {
	id, err := parseUint(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	out, err := h.svc.SubcategoryByID(id)
	if err != nil {
		response.JSON(c, http.StatusNotFound, err.Error(), nil, nil)
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth subkategoriya ma'lumoti olindi", out, nil)
}

func (h *NoAuthHandler) ListContragents(c *gin.Context) {
	page, limit := parsePageLimit(c)
	nestedLimit, _ := strconv.Atoi(c.DefaultQuery("nested_limit", "30"))
	inc := mpsvc.ParseContragentInclude(c.Query("include"))
	var q *string
	if s := strings.TrimSpace(c.Query("q")); s != "" {
		q = &s
	}
	out, err := h.svc.Contragents(q, page, limit, nestedLimit, inc)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth kontragentlar ro'yxati olindi", out, nil)
}

func (h *NoAuthHandler) ListRegions(c *gin.Context) {
	rows, err := h.svc.Regions()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth viloyatlar ro'yxati olindi", rows, nil)
}

func (h *NoAuthHandler) ListDistricts(c *gin.Context) {
	var regionID *uint
	if v := strings.TrimSpace(c.Query("region_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "region_id noto'g'ri", nil, nil)
			return
		}
		regionID = &id
	}
	rows, err := h.svc.Districts(regionID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth tumanlar ro'yxati olindi", rows, nil)
}

func (h *NoAuthHandler) ListMFYs(c *gin.Context) {
	var districtID *uint
	if v := strings.TrimSpace(c.Query("district_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "district_id noto'g'ri", nil, nil)
			return
		}
		districtID = &id
	}
	rows, err := h.svc.MFYs(districtID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth MFYlar ro'yxati olindi", rows, nil)
}

func (h *NoAuthHandler) ListPunkts(c *gin.Context) {
	page, limit := parsePageLimit(c)
	items, total, err := h.svc.Punkts(page, limit, c.Query("q"))
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth punktlar ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListAgents(c *gin.Context) {
	page, limit := parsePageLimit(c)
	items, total, err := h.svc.Agents(page, limit, c.Query("q"))
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth agentlar ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListMarketplaceUsers(c *gin.Context) {
	page, limit := parsePageLimit(c)
	items, total, err := h.svc.MarketplaceUsers(page, limit, c.Query("q"))
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth marketplace foydalanuvchilari ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListManagers(c *gin.Context) {
	page, limit := parsePageLimit(c)
	items, total, err := h.svc.Managers(page, limit, c.Query("q"))
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth menejerlar ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListActivityTypes(c *gin.Context) {
	rows, err := h.svc.ActivityTypes()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth faoliyat turlari ro'yxati olindi", rows, nil)
}

func (h *NoAuthHandler) ListLocalShops(c *gin.Context) {
	page, limit := parsePageLimit(c)
	var districtID *uint
	if v := strings.TrimSpace(c.Query("district_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "district_id noto'g'ri", nil, nil)
			return
		}
		districtID = &id
	}
	var mfyID *uint
	if v := strings.TrimSpace(c.Query("mfy_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "mfy_id noto'g'ri", nil, nil)
			return
		}
		mfyID = &id
	}
	items, total, err := h.svc.LocalShops(page, limit, c.Query("q"), districtID, mfyID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth maxalla do'konlari ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListLocalShopProducts(c *gin.Context) {
	page, limit := parsePageLimit(c)
	var districtID *uint
	if v := strings.TrimSpace(c.Query("district_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "district_id noto'g'ri", nil, nil)
			return
		}
		districtID = &id
	}
	var mfyID *uint
	if v := strings.TrimSpace(c.Query("mfy_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "mfy_id noto'g'ri", nil, nil)
			return
		}
		mfyID = &id
	}
	var localShopID *uint
	if v := strings.TrimSpace(c.Query("local_shop_id")); v != "" {
		id, err := parseUint(v)
		if err != nil {
			response.JSON(c, http.StatusBadRequest, "local_shop_id noto'g'ri", nil, nil)
			return
		}
		localShopID = &id
	}
	items, total, err := h.svc.LocalShopProducts(page, limit, c.Query("q"), districtID, mfyID, localShopID)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth maxalla do'koni mahsulotlari ro'yxati olindi", paginated(items, total, page, limit), nil)
}

func (h *NoAuthHandler) ListContragentBanners(c *gin.Context) {
	items, err := h.svc.ActiveContragentBanners()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth contragent bannerlar ro'yxati olindi", items, nil)
}

func (h *NoAuthHandler) ListProductRatings(c *gin.Context) {
	v := strings.TrimSpace(c.Query("product_id"))
	if v == "" {
		response.JSON(c, http.StatusBadRequest, "product_id majburiy", nil, nil)
		return
	}
	productID, err := parseUint(v)
	if err != nil || productID == 0 {
		response.JSON(c, http.StatusBadRequest, "product_id noto'g'ri", nil, nil)
		return
	}
	page, limit := parsePageLimit(c)
	out, err := h.svc.ProductRatings(productID, page, limit)
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth mahsulot baholari olindi", out, nil)
}

func (h *NoAuthHandler) ListCommentTemplates(c *gin.Context) {
	rows, err := h.svc.CommentTemplates()
	if err != nil {
		response.JSON(c, http.StatusInternalServerError, "Serverda xatolik yuz berdi", nil, err.Error())
		return
	}
	response.JSON(c, http.StatusOK, "NoAuth kommentariya shablonlari olindi", rows, nil)
}
