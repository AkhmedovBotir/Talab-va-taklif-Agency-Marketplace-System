package handler

import (
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/productmedia"
	"backend/internal/pkg/response"
	"backend/modules/contragents/service"
	"github.com/gin-gonic/gin"
)

const contragentMultipartMaxMemory = 32 << 20

func (h *ContragentProductHandler) registerMultipartRoutes(p *gin.RouterGroup) {
	p.POST("/with-images", h.CreateWithImages)
	p.PUT("/:id/with-images", h.UpdateWithImages)
	p.POST("/:id/images", h.AddImages)
	p.PUT("/:id/images", h.ReplaceAllImages)
	p.PUT("/:id/images/:imageId", h.ReplaceImage)
	p.DELETE("/:id/images/:imageId", h.DeleteImage)
}

func (h *ContragentProductHandler) CreateWithImages(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	if err := c.Request.ParseMultipartForm(contragentMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseContragentProductForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	files, err := readContragentMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.CreateWithFiles(contragentID, input, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Mahsulot yaratildi", row, nil)
}

func (h *ContragentProductHandler) UpdateWithImages(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(contragentMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseContragentProductForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	var files []productmedia.FileInput
	if c.Request.MultipartForm != nil && len(c.Request.MultipartForm.File["images"]) > 0 {
		files, err = readContragentMultipartImages(c, "images")
		if err != nil {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
	}
	row, err := h.service.UpdateWithFiles(contragentID, id, input, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulot yangilandi", row, nil)
}

func (h *ContragentProductHandler) AddImages(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(contragentMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readContragentMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.AddImages(contragentID, id, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasmlar qo'shildi", row, nil)
}

func (h *ContragentProductHandler) ReplaceAllImages(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(contragentMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readContragentMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.ReplaceAllImages(contragentID, id, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasmlar almashtirildi", row, nil)
}

func (h *ContragentProductHandler) ReplaceImage(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	imageID, err := parseUintID(c.Param("imageId"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "imageId noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(contragentMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readContragentMultipartImages(c, "image")
	if err != nil || len(files) == 0 {
		files, err = readContragentMultipartImages(c, "images")
	}
	if err != nil || len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "image fayli majburiy", nil, nil)
		return
	}
	row, err := h.service.ReplaceImage(contragentID, id, imageID, files[0])
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasm almashtirildi", row, nil)
}

func (h *ContragentProductHandler) DeleteImage(c *gin.Context) {
	contragentID, ok := getContragentID(c)
	if !ok {
		response.JSON(c, http.StatusUnauthorized, "Token yaroqsiz", nil, nil)
		return
	}
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	imageID, err := parseUintID(c.Param("imageId"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "imageId noto'g'ri", nil, nil)
		return
	}
	row, err := h.service.DeleteImage(contragentID, id, imageID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasm o'chirildi", row, nil)
}

func parseContragentProductForm(c *gin.Context) (service.ProductInput, error) {
	var out service.ProductInput
	var err error
	out.Name = strings.TrimSpace(c.PostForm("name"))
	out.Description = strings.TrimSpace(c.PostForm("description"))
	if out.Price, err = contragentFormFloat(c, "price"); err != nil {
		return out, err
	}
	if out.OriginalPrice, err = contragentFormFloat(c, "original_price"); err != nil {
		return out, err
	}
	if out.CategoryID, err = contragentFormUint(c, "category_id"); err != nil {
		return out, err
	}
	if out.SubcategoryID, err = contragentFormUint(c, "subcategory_id"); err != nil {
		return out, err
	}
	if out.Quantity, err = contragentFormFloat(c, "quantity"); err != nil {
		return out, err
	}
	out.Unit = strings.TrimSpace(c.PostForm("unit"))
	out.UnitSize = strings.TrimSpace(c.PostForm("unit_size"))
	out.Status = strings.TrimSpace(c.PostForm("status"))
	if out.KpiBonusPercent, err = contragentFormFloat(c, "kpi_bonus_percent"); err != nil {
		return out, err
	}
	return out, nil
}

func contragentFormUint(c *gin.Context, key string) (uint, error) {
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return 0, contragentFormFieldErr(key)
	}
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || v == 0 {
		return 0, contragentFormFieldErr(key)
	}
	return uint(v), nil
}

func contragentFormFloat(c *gin.Context, key string) (float64, error) {
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return 0, contragentFormFieldErr(key)
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, contragentFormFieldErr(key)
	}
	return v, nil
}

type contragentFormFieldError struct{ field string }

func contragentFormFieldErr(key string) error {
	return &contragentFormFieldError{field: key}
}

func (e *contragentFormFieldError) Error() string {
	return e.field + " noto'g'ri yoki majburiy"
}

func readContragentMultipartImages(c *gin.Context, field string) ([]productmedia.FileInput, error) {
	if c.Request.MultipartForm == nil {
		return nil, nil
	}
	headers := c.Request.MultipartForm.File[field]
	if len(headers) == 0 {
		return nil, nil
	}
	out := make([]productmedia.FileInput, 0, len(headers))
	for _, fh := range headers {
		f, err := readContragentFileHeader(fh)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func readContragentFileHeader(fh *multipart.FileHeader) (productmedia.FileInput, error) {
	src, err := fh.Open()
	if err != nil {
		return productmedia.FileInput{}, err
	}
	defer src.Close()
	data, err := io.ReadAll(src)
	if err != nil {
		return productmedia.FileInput{}, err
	}
	return productmedia.FileInput{
		Data:        data,
		ContentType: fh.Header.Get("Content-Type"),
		Filename:    fh.Filename,
	}, nil
}
