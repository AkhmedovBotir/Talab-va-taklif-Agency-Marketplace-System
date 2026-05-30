package httpserver

import (
	"net/http"
	"os"
	"strings"
	"time"

	"backend/internal/pkg/response"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func New() *gin.Engine {
	router := gin.New()
	router.Use(gin.Logger(), gin.Recovery())
	router.Use(cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			o := strings.ToLower(strings.TrimSpace(origin))
			if strings.HasSuffix(o, ".ttsa.uz") && strings.HasPrefix(o, "https://") {
				return true
			}
			allowed := map[string]struct{}{
				"https://market.ttsa.uz":     {},
				"https://www.ttsa.uz":        {},
				"https://admin.ttsa.uz":      {},
				"https://delivery.ttsa.uz":   {},
				"https://contragent.ttsa.uz": {},
				"https://agent.ttsa.uz":      {},
				"https://punkt.ttsa.uz":      {},
				"https://store.ttsa.uz":      {},
				"https://manager.ttsa.uz":    {},
				"http://localhost:5173":      {},
				"http://localhost:5174":      {},
				"http://localhost:5175":      {},
				"http://localhost:8082":      {},
				"http://localhost:8083":      {},
				"http://localhost:8084":      {},
				"http://localhost:8085":      {},
				"http://localhost:8086":      {},
				"http://localhost:8087":      {},
			}
			_, ok := allowed[o]
			return ok
		},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	router.GET("/health", func(c *gin.Context) {
		response.JSON(c, http.StatusOK, "Server ishlayapti", gin.H{"status": "ok"}, nil)
	})

	router.NoRoute(func(c *gin.Context) {
		response.JSON(c, http.StatusNotFound, "Bunday endpoint topilmadi", nil, nil)
	})

	router.NoMethod(func(c *gin.Context) {
		response.JSON(c, http.StatusMethodNotAllowed, "Bu HTTP metodiga ruxsat yo'q", nil, nil)
	})

	return router
}

// MountUploads — mahsulot rasmlari (products/...) uchun statik fayllar.
func MountUploads(router *gin.Engine, uploadDir string) {
	dir := strings.TrimSpace(uploadDir)
	if dir == "" {
		dir = "uploads"
	}
	_ = os.MkdirAll(dir, 0o755)
	router.Static("/uploads", dir)
}
