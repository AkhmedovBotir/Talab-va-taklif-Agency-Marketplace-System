package main

import (
	"log"

	"backend/internal/config"
	"backend/internal/platform/database"
	"backend/internal/platform/httpserver"
	"backend/modules/admin"
	"backend/modules/agents"
	"backend/modules/contragents"
	"backend/modules/deliveryproviders"
	"backend/modules/localshops"
	"backend/modules/managers"
	"backend/modules/marketplace"
	"backend/modules/noauth"
	"backend/modules/punkts"
	"github.com/gin-gonic/gin"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	log.Println("Server ishga tushdi (admin API: permissions middleware yo'q, faqat JWT)")

	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("DB ulanishda xatolik: %v", err)
	}

	router := httpserver.New()
	httpserver.MountUploads(router, cfg.UploadDir)
	if err = admin.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours, cfg.AppBaseURL, cfg.UploadDir); err != nil {
		log.Fatalf("Router ulashda xatolik: %v", err)
	}
	if err = contragents.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours, cfg.AppBaseURL, cfg.UploadDir); err != nil {
		log.Fatalf("Contragent auth router ulashda xatolik: %v", err)
	}
	if err = localshops.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours); err != nil {
		log.Fatalf("Local shop auth router ulashda xatolik: %v", err)
	}
	if err = deliveryproviders.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours); err != nil {
		log.Fatalf("Delivery provider auth router ulashda xatolik: %v", err)
	}
	if err = marketplace.RegisterRoutes(router, db, cfg.JWTSecret, cfg.MarketplaceJWTExpireHours, cfg.AppBaseURL, cfg.UploadDir); err != nil {
		log.Fatalf("Marketplace auth router ulashda xatolik: %v", err)
	}
	if err = punkts.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours); err != nil {
		log.Fatalf("Punkt auth router ulashda xatolik: %v", err)
	}
	if err = agents.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours); err != nil {
		log.Fatalf("Agent auth router ulashda xatolik: %v", err)
	}
	if err = managers.RegisterRoutes(router, db, cfg.JWTSecret, cfg.JWTExpireHours); err != nil {
		log.Fatalf("Manager auth router ulashda xatolik: %v", err)
	}
	if err = noauth.RegisterRoutes(router, db, cfg.AppBaseURL, cfg.UploadDir); err != nil {
		log.Fatalf("NoAuth router ulashda xatolik: %v", err)
	}

	if err = router.Run(":" + cfg.AppPort); err != nil {
		log.Fatalf("Server ishga tushmadi: %v", err)
	}
}
