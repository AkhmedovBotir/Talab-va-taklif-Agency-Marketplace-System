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

const templateMultipartMaxMemory = 32 << 20

func (h *LocalShopProductTemplateHandler) registerMultipartRoutes(grp *gin.RouterGroup) {
	grp.POST("/with-images", h.CreateWithImages)
	grp.PUT("/:id/with-images", h.UpdateWithImages)
	grp.POST("/:id/images", h.AddImages)
	grp.PUT("/:id/images", h.ReplaceAllImages)
	grp.PUT("/:id/images/:imageId", h.ReplaceImage)
	grp.DELETE("/:id/images/:imageId", h.DeleteImage)
}

func (h *LocalShopProductTemplateHandler) CreateWithImages(c *gin.Context) {
	if err := c.Request.ParseMultipartForm(templateMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseLocalShopTemplateForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	files, err := readTemplateMultipartImages(c, "images")
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
	response.JSON(c, http.StatusCreated, "Shablon yaratildi", row, nil)
}

func (h *LocalShopProductTemplateHandler) UpdateWithImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(templateMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	input, err := parseLocalShopTemplateForm(c)
	if err != nil {
		response.JSON(c, http.StatusBadRequest, err.Error(), nil, nil)
		return
	}
	var files []productmedia.FileInput
	if c.Request.MultipartForm != nil && len(c.Request.MultipartForm.File["images"]) > 0 {
		files, err = readTemplateMultipartImages(c, "images")
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
	response.JSON(c, http.StatusOK, "Shablon yangilandi", row, nil)
}

func (h *LocalShopProductTemplateHandler) AddImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(templateMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readTemplateMultipartImages(c, "images")
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

func (h *LocalShopProductTemplateHandler) ReplaceAllImages(c *gin.Context) {
	id, err := parseUintID(c.Param("id"))
	if err != nil {
		response.JSON(c, http.StatusBadRequest, "ID noto'g'ri", nil, nil)
		return
	}
	if err = c.Request.ParseMultipartForm(templateMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readTemplateMultipartImages(c, "images")
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

func (h *LocalShopProductTemplateHandler) ReplaceImage(c *gin.Context) {
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
	if err = c.Request.ParseMultipartForm(templateMultipartMaxMemory); err != nil {
		response.JSON(c, http.StatusBadRequest, "multipart formati noto'g'ri", nil, err.Error())
		return
	}
	files, err := readTemplateMultipartImages(c, "image")
	if err != nil || len(files) == 0 {
		files, err = readTemplateMultipartImages(c, "images")
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

func (h *LocalShopProductTemplateHandler) DeleteImage(c *gin.Context) {
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

func parseLocalShopTemplateForm(c *gin.Context) (service.LocalShopProductTemplateInput, error) {
	var out service.LocalShopProductTemplateInput
	var err error
	out.Name = strings.TrimSpace(c.PostForm("name"))
	out.Description = strings.TrimSpace(c.PostForm("description"))
	if out.CategoryID, err = templateFormUint(c, "category_id"); err != nil {
		return out, err
	}
	if out.SubcategoryID, err = templateFormUint(c, "subcategory_id"); err != nil {
		return out, err
	}
	out.Unit = strings.TrimSpace(c.PostForm("unit"))
	out.UnitSize = strings.TrimSpace(c.PostForm("unit_size"))
	out.Status = strings.TrimSpace(c.PostForm("status"))
	return out, nil
}

func templateFormUint(c *gin.Context, key string) (uint, error) {
	raw := strings.TrimSpace(c.PostForm(key))
	if raw == "" {
		return 0, templateFormFieldErr(key)
	}
	v, err := strconv.ParseUint(raw, 10, 64)
	if err != nil || v == 0 {
		return 0, templateFormFieldErr(key)
	}
	return uint(v), nil
}

type templateFormFieldError struct{ field string }

func templateFormFieldErr(key string) error {
	return &templateFormFieldError{field: key}
}

func (e *templateFormFieldError) Error() string {
	return e.field + " noto'g'ri yoki majburiy"
}

func readTemplateMultipartImages(c *gin.Context, field string) ([]productmedia.FileInput, error) {
	if c.Request.MultipartForm == nil {
		return nil, nil
	}
	headers := c.Request.MultipartForm.File[field]
	if len(headers) == 0 {
		return nil, nil
	}
	out := make([]productmedia.FileInput, 0, len(headers))
	for _, fh := range headers {
		f, err := readTemplateFileHeader(fh)
		if err != nil {
			return nil, err
		}
		out = append(out, f)
	}
	return out, nil
}

func readTemplateFileHeader(fh *multipart.FileHeader) (productmedia.FileInput, error) {
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
