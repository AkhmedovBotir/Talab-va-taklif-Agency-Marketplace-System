package core

import (
	agentRepo "backend/modules/agents/repository"
	"backend/modules/core/domain"
	"backend/modules/core/handler"
	"backend/modules/core/repository"
	"backend/modules/core/service"
	punktRepo "backend/modules/punkts/repository"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// RegisterRoutes — integratsiya: ochiq login + admin kalitlar CRUD.
// jwtSecret — JWT imzo va integratsiya kalitini AES-GCM da saqlash uchun.
// jwtExpireHours — integratsiya JWT muddati (admin JWT bilan bir xil sozlamadan).
func RegisterRoutes(api *gin.RouterGroup, db *gorm.DB, auth gin.HandlerFunc, onlyGeneral gin.HandlerFunc, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.IntegrationAPIKey{}, &domain.IntegrationKPIAllocation{}, &domain.IntegrationKPIPayout{}, &domain.IntegrationKPIPayoutTarget{}, &domain.IntegrationContragentBanner{}, &domain.IntegrationNotification{}); err != nil {
		return err
	}
	repo := repository.NewIntegrationAPIKeyRepository(db)
	svc := service.NewIntegrationAPIKeyService(repo, jwtSecret, jwtExpireHours)

	kpiRepo := repository.NewIntegrationKPIAllocationRepository(db)
	orderKPIRepo := repository.NewMarketplaceOrderKPIRepository(db)
	kpiSvc := service.NewIntegrationKPIAllocationService(kpiRepo, orderKPIRepo)
	kpiH := handler.NewIntegrationKPIAllocationHandler(kpiSvc)
	kpiTxH := handler.NewIntegrationTransactionKPIHandler(kpiSvc)
	kpiPayoutRepo := repository.NewIntegrationKPIPayoutRepository(db)
	agentKPIPayoutRepo := agentRepo.NewAgentKPIPayoutRepository(db)
	punktKPIPayoutRepo := punktRepo.NewPunktKPIPayoutRepository(db)
	kpiReportSvc := service.NewIntegrationKPIReportService(orderKPIRepo, kpiPayoutRepo, agentKPIPayoutRepo, punktKPIPayoutRepo, kpiSvc)
	kpiReportH := handler.NewIntegrationKPIReportHandler(kpiReportSvc)
	bannerRepo := repository.NewIntegrationContragentBannerRepository(db)
	bannerSvc := service.NewIntegrationContragentBannerService(bannerRepo, db)
	bannerH := handler.NewIntegrationContragentBannerHandler(bannerSvc)
	notificationRepo := repository.NewIntegrationNotificationRepository(db)
	notificationSvc := service.NewIntegrationNotificationService(notificationRepo)
	notificationH := handler.NewIntegrationNotificationHandler(notificationSvc)

	authH := handler.NewIntegrationAuthHandler(svc)
	// Asosiy prefiks (klientlar kutilgan URL)
	api.POST("/integration-auth/login", authH.Login)
	authGrp := api.Group("/integration-auth")
	authGrp.Use(handler.IntegrationAuthMiddleware(jwtSecret))
	authGrp.GET("/me", authH.Me)
	registerIntegrationKPIRoutes(authGrp, kpiH, kpiTxH)
	kpiReportH.RegisterRoutes(authGrp)
	bannerH.RegisterRoutes(authGrp)
	// Eski yo‘l (moslik)
	api.POST("/integration/login", authH.Login)
	integrationGrp := api.Group("/integration")
	integrationGrp.Use(handler.IntegrationAuthMiddleware(jwtSecret))
	integrationGrp.GET("/me", authH.Me)
	registerIntegrationKPIRoutes(integrationGrp, kpiH, kpiTxH)
	kpiReportH.RegisterRoutes(integrationGrp)
	bannerH.RegisterRoutes(integrationGrp)

	// Notification CRUD — integratsiya JWT (api_key login), admin emas
	notifGrp := api.Group("/integration-notifications")
	notifGrp.Use(handler.IntegrationAuthMiddleware(jwtSecret))
	notificationH.RegisterRoutes(notifGrp)

	keyH := handler.NewIntegrationAPIKeyHandler(svc)
	keyH.RegisterRoutes(api, auth, onlyGeneral)
	return nil
}

func registerIntegrationKPIRoutes(g *gin.RouterGroup, h *handler.IntegrationKPIAllocationHandler, tx *handler.IntegrationTransactionKPIHandler) {
	g.GET("/kpi-allocation", h.Get)
	g.POST("/kpi-allocation", h.Create)
	g.PUT("/kpi-allocation", h.Update)
	g.DELETE("/kpi-allocation", h.Delete)
	g.POST("/transaction-kpi/compute", tx.Compute)
	g.POST("/transaction-kpi/by-order", tx.ByOrder)
}
