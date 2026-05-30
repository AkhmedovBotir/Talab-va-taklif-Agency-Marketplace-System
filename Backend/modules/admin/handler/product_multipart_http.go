package handler

import (
	"io"
	"mime/multipart"
	"net/http"
	"strconv"
	"strings"

	"backend/internal/pkg/productmedia"
	"backend/internal/pkg/response"
	"backend/modules/admin/service"
	"github.com/gin-gonic/gin"
)

const multipartMaxMemory = 32 << 20

func (h *ProductHandler) registerMultipartRoutes(grp *gin.RouterGroup) {
	grp.POST("/with-images", h.CreateWithImages)
	grp.PUT("/:id/with-images", h.UpdateWithImages)
	grp.POST("/:id/images", h.AddImages)
	grp.PUT("/:id/images", h.ReplaceAllImages)
	grp.PUT("/:id/images/:imageId", h.ReplaceImage)
	grp.DELETE("/:id/images/:imageId", h.DeleteImage)
}

func (h *ProductHandler) CreateWithImages(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(multipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseAdminProductForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	files, err := readMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.CreateWithFiles(input, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusCreated, "Mahsulot yaratildi", row, nil)
}

func (h *ProductHandler) UpdateWithImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(multipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseAdminProductForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	var files []productmedia.FileInput
	if c.Request.MultipartForm != nil && len(c.Request.MultipartForm.File["images"]) > 0 {
		files, err = readMultipartImages(c, "images")
		if err != nil {
			response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
			return
		}
	}
	row, err := h.service.UpdateWithFiles(id, input, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Mahsulot yangilandi", row, nil)
}

func (h *ProductHandler) AddImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(multipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.AddImages(id, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasmlar qo'shildi", row, nil)
}

func (h *ProductHandler) ReplaceAllImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(multipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readMultipartImages(c, "images")
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	if len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "kamida bitta rasm (images) kerak", nil, nil)
		return
	}
	row, err := h.service.ReplaceAllImages(id, files)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasmlar almashtirildi", row, nil)
}

func (h *ProductHandler) ReplaceImage(c *gin.Context) {
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
	if err = c.Request.ParseMultipartForm(multipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readMultipartImages(c, "image")
	if err != nil || len(files) == 0 {
		files, err = readMultipartImages(c, "images")
	}
	if err != nil || len(files) == 0 {
		response.JSON(c, http.StatusBadRequest, "image fayli majburiy", nil, nil)
		return
	}
	row, err := h.service.ReplaceImage(id, imageID, files[0])
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasm almashtirildi", row, nil)
}

func (h *ProductHandler) DeleteImage(c *gin.Context) {
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
	row, err := h.service.DeleteImage(id, imageID)
	if err != nil {
		h.handleError(c, err)
		return
	}
	response.JSON(c, http.StatusOK, "Rasm o'chirildi", row, nil)
}

func parseAdminProductForm(c *gin.Context) (service.AdminProductInput, error) {
	var out service.AdminProductInput
	var err error

	if out.ContragentID, err = formUint(c, "contragent_id"); err != nil {
		return out, err
	}
	out.Name = strings.TrimSpace(c.PostForm("name"))
	out.Description = strings.TrimSpace(c.PostForm("description"))
	if out.Price, err = formFloat(c, "price"); err != nil {
		return out, err
	}
	if out.OriginalPrice, err = formFloat(c, "original_price"); err != nil {
		return out, err
	}
	if out.CategoryID, err = formUint(c, "category_id"); err != nil {
		return out, err
	}
	if out.SubcategoryID, err = formUint(c, "subcategory_id"); err != nil {
		return out, err
	}
	if out.Quantity, err = formFloat(c, "quantity"); err != nil {
		return out, err
	}
	out.Unit = strings.TrimSpace(c.PostForm("unit"))
	out.UnitSize = strings.TrimSpace(c.PostForm("unit_size"))
	out.Status = strings.TrimSpace(c.PostForm("status"))
	if out.KpiBonusPercent, err = formFloat(c, "kpi_bonus_percent"); err != nil {
		return out, err
	}
	return out, nil
}

func formUint(c *gin.Context, key string) (uint, error) {
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return 0, errFormField(key)
	}
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || v == 0 {
		return 0, errFormField(key)
	}
	return uint(v), nil
}

func formFloat(c *gin.Context, key string) (float64, error) {
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return 0, errFormField(key)
	}
	v, err := strconv.ParseFloat(raw, 64)
	if err != nil {
		return 0, errFormField(key)
	}
	return v, nil
}

func errFormField(key string) error {
	return &formFieldError{field: key}
}

type formFieldError struct {
	field string
}

func (e *formFieldError) Error() string {
	return e.field + " noto'g'ri yoki majburiy"
}

func readMultipartImages(c *gin.Context, field string) ([]productmedia.FileInput, error) {
	if c.Request.MultipartForm == nil {
		return nil, nil
	}
	headers := c.Request.MultipartForm.File[field]
	if len(headers) == 0 {
		return nil, nil
	}
	out := make([]productmedia.FileInput, 0, len(headers))
	for _, fh := range headers {
		f, err := readFileHeader(fh)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func readFileHeader(fh *multipart.FileHeader) (productmedia.FileInput, error) {
	src, err := fh.Open()
	if err != nil {
		return productmedia.FileInput{}, err
	}
	defer src.Close()
	data, err := io.ReadAll(src)
	if err != nil {
		return productmedia.FileInput{}, err
	}
	ct := fh.Header.Get("Content-Type")
	return productmedia.FileInput{
		Data:        data,
		ContentType: ct,
		Filename:    fh.Filename,
	}, nil
}
