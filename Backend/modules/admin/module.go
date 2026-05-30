package admin

import (
	"context"
	"fmt"
	"net/http"

	"backend/internal/pkg/response"
	"backend/internal/pkg/productmedia"
	"backend/modules/admin/domain"
	"backend/modules/admin/handler"
	"backend/modules/admin/repository"
	"backend/modules/admin/service"
	contrDomain "backend/modules/contragents/domain"
	coreHandler "backend/modules/core/handler"
	coreRepo "backend/modules/core/repository"
	"backend/modules/core"
	mpDomain "backend/modules/marketplace/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int, appBaseURL, uploadDir string) error {
	if err := db.AutoMigrate(&domain.Admin{}, &domain.Region{}, &domain.District{}, &domain.MFY{}, &domain.ContragentType{}, &domain.Contragent{}, &domain.NeighborhoodShop{}, &domain.NeighborhoodShopMonthlyConfig{}, &domain.NeighborhoodShopSubscription{}, &domain.NeighborhoodShopSubscriptionReminder{}, &domain.Agent{}, &domain.Punkt{}, &domain.Manager{}, &domain.Category{}, &contrDomain.Product{}, &contrDomain.ProductImage{}, &domain.LocalShopProductTemplate{}, &domain.LocalShopProductTemplateImage{}, &mpDomain.PartnerRequest{}, &domain.CommentTemplate{}, &domain.ArchiveLog{}, &domain.QR{}, &domain.ProductCommentCase{}, &domain.ProductCommentActivity{}, &domain.AdminNotificationRead{}); err != nil {
		return err
	}
	if db.Migrator().HasColumn(&domain.Admin{}, "permissions") {
		_ = db.Exec(`UPDATE admins SET permissions = '[]' WHERE permissions IS NULL`).Error
	}
	// API orqali yaratilgan kategoriyalar external_id='' bilan yozilgan; unique indeks uchun NULL.
	if err := db.Exec(`UPDATE categories SET external_id = NULL WHERE external_id = '' OR TRIM(external_id) = ''`).Error; err != nil {
		return fmt.Errorf("categories external_id tozalash: %w", err)
	}
	// Legacy compatibility: old schema had title/body as NOT NULL in admin_comment_templates.
	// New API uses only `comment`, so inserts must not fail if legacy columns remain.
	if db.Migrator().HasTable("admin_comment_templates") {
		if db.Migrator().HasColumn("admin_comment_templates", "title") {
			if err := db.Exec(`ALTER TABLE admin_comment_templates ALTER COLUMN title DROP NOT NULL`).Error; err != nil {
				return err
			}
		}
		if db.Migrator().HasColumn("admin_comment_templates", "body") {
			if err := db.Exec(`ALTER TABLE admin_comment_templates ALTER COLUMN body DROP NOT NULL`).Error; err != nil {
				return err
			}
		}
	}
	// Eski sxemadan qolgan mfy_id punkt uchun kerak emas; GORM AutoMigrate ustunni o‘chirib tashlamaydi.
	if db.Migrator().HasColumn(&domain.Punkt{}, "mfy_id") {
		if err := db.Migrator().DropColumn(&domain.Punkt{}, "mfy_id"); err != nil {
			return fmt.Errorf("punkts: mfy_id ustunini olib tashlash: %w", err)
		}
	}

	repo := repository.NewAdminPostgresRepository(db)
	svc := service.NewAdminService(repo)
	h := handler.NewAdminHandler(svc, jwtSecret, jwtExpireHours)
	regionRepo := repository.NewRegionRepository(db)
	archiveRepo := repository.NewArchiveRepository(db)
	archiveSvc := service.NewArchiveService(archiveRepo, db)
	archiveHandler := handler.NewArchiveHandler(archiveSvc)
	regionSvc := service.NewRegionService(regionRepo)
	regionHandler := handler.NewRegionHandler(regionSvc)
	contragentTypeRepo := repository.NewContragentTypeRepository(db)
	contragentTypeSvc := service.NewContragentTypeService(contragentTypeRepo)
	contragentTypeHandler := handler.NewContragentTypeHandler(contragentTypeSvc)
	contragentRepo := repository.NewContragentRepository(db)
	contragentSvc := service.NewContragentService(contragentRepo, regionRepo, contragentTypeRepo, db)
	contragentHandler := handler.NewContragentHandler(contragentSvc, archiveSvc)
	commentTemplateRepo := repository.NewCommentTemplateRepository(db)
	commentTemplateSvc := service.NewCommentTemplateService(commentTemplateRepo)
	commentTemplateHandler := handler.NewCommentTemplateHandler(commentTemplateSvc)
	partnerReqRepo := repository.NewPartnerRequestRepository(db)
	partnerReqSvc := service.NewPartnerRequestService(partnerReqRepo, contragentRepo, regionRepo, contragentTypeRepo)
	partnerReqHandler := handler.NewPartnerRequestHandler(partnerReqSvc)
	neighborhoodShopRepo := repository.NewNeighborhoodShopRepository(db)
	neighborhoodShopSvc := service.NewNeighborhoodShopService(neighborhoodShopRepo, regionRepo)
	neighborhoodShopHandler := handler.NewNeighborhoodShopHandler(neighborhoodShopSvc, archiveSvc)
	neighborhoodShopBillingRepo := repository.NewNeighborhoodShopBillingRepository(db)
	neighborhoodShopBillingSvc := service.NewNeighborhoodShopBillingService(neighborhoodShopBillingRepo)
	neighborhoodShopBillingHandler := handler.NewNeighborhoodShopBillingHandler(neighborhoodShopBillingSvc)
	agentRepo := repository.NewAgentRepository(db)
	agentSvc := service.NewAgentService(agentRepo, regionRepo)
	agentHandler := handler.NewAgentHandler(agentSvc, archiveSvc)
	punktRepo := repository.NewPunktRepository(db)
	punktSvc := service.NewPunktService(punktRepo, regionRepo)
	punktHandler := handler.NewPunktHandler(punktSvc, archiveSvc)
	managerRepo := repository.NewManagerRepository(db)
	managerSvc := service.NewManagerService(managerRepo, regionRepo)
	managerHandler := handler.NewManagerHandler(managerSvc)
	marketplaceUserRepo := repository.NewMarketplaceUserRepository(db)
	marketplaceUserSvc := service.NewMarketplaceUserService(marketplaceUserRepo)
	marketplaceUserHandler := handler.NewMarketplaceUserHandler(marketplaceUserSvc, archiveSvc)
	categoryRepo := repository.NewCategoryRepository(db)
	categorySvc := service.NewCategoryService(categoryRepo)
	categoryHandler := handler.NewCategoryHandler(categorySvc)
	subcategoryHandler := handler.NewSubcategoryHandler(categorySvc)
	productMedia := productmedia.NewStore(uploadDir, appBaseURL)
	productRepo := repository.NewAdminProductRepository(db)
	productSvc := service.NewAdminProductService(productRepo, productMedia)
	productHandler := handler.NewProductHandler(productSvc)
	localShopTemplateRepo := repository.NewLocalShopProductTemplateRepository(db)
	localShopTemplateSvc := service.NewLocalShopProductTemplateService(localShopTemplateRepo, productMedia)
	localShopTemplateHandler := handler.NewLocalShopProductTemplateHandler(localShopTemplateSvc)
	localShopProductRepo := repository.NewLocalShopProductRepository(db)
	localShopProductSvc := service.NewLocalShopProductService(localShopProductRepo)
	localShopProductHandler := handler.NewLocalShopProductHandler(localShopProductSvc)
	qrRepo := repository.NewQRRepository(db)
	qrSvc := service.NewQRService(qrRepo, appBaseURL)
	qrHandler := handler.NewQRHandler(qrSvc)
	productCommentFollowupRepo := repository.NewProductCommentFollowupRepository(db)
	productCommentFollowupSvc := service.NewAdminProductCommentFollowupService(productCommentFollowupRepo)
	productCommentFollowupHandler := handler.NewProductCommentFollowupHandler(productCommentFollowupSvc)
	orderPipelineRepo := repository.NewOrderPipelineRepository(db)
	orderPipelineSvc := service.NewOrderPipelineService(orderPipelineRepo, db)
	orderPipelineHandler := handler.NewOrderPipelineHandler(orderPipelineSvc)
	txRepo := repository.NewTransactionReportRepository(db)
	txSvc := service.NewTransactionReportService(txRepo)
	txHandler := handler.NewTransactionReportHandler(txSvc)
	adminNotificationRepo := repository.NewAdminNotificationRepository(db)
	adminNotificationSvc := service.NewAdminNotificationService(adminNotificationRepo)
	adminNotificationHandler := handler.NewAdminNotificationHandler(adminNotificationSvc)
	authMiddleware := h.AuthMiddleware()

	api := router.Group("/api/v1")
	{
		// Deploy tekshiruvi: yangi build da 200 va permissions_enforced=false
		api.GET("/meta/build", func(c *gin.Context) {
			response.JSON(c, http.StatusOK, "Build info", gin.H{
				"auth_check_route":        true,
				"permissions_enforced":    false,
				"admin_permissions_scope": "frontend_only",
				"product_images":          "url_on_disk",
				"admin_product_multipart":      true,
				"contragent_product_multipart":        true,
				"local_shop_template_multipart": true,
			}, nil)
		})

		api.POST("/admins/login", h.Login)
		qrHandler.RegisterPublicRoutes(api)

		adminRoutes := api.Group("/admins")
		adminRoutes.Use(authMiddleware)
		{
			// :id dan oldin — aks holda ba'zi Gin versiyalarida noto'g'ri match bo'lishi mumkin
			adminRoutes.GET("/auth/check", h.CheckAuth)
			adminRoutes.GET("/me", h.GetMe)
			adminRoutes.GET("/permission-names", h.ListPermissionNames)
			adminRoutes.POST("", h.Create)
			adminRoutes.GET("", h.GetAll)
			adminRoutes.GET("/:id", h.GetByID)
			adminRoutes.PUT("/:id", h.Update)
			adminRoutes.PATCH("/:id/status", h.UpdateStatus)
			adminRoutes.DELETE("/:id", h.Delete)
		}

		regionHandler.RegisterRoutes(api, authMiddleware)
		contragentTypeHandler.RegisterRoutes(api, authMiddleware)
		contragentHandler.RegisterRoutes(api, authMiddleware)
		commentTemplateHandler.RegisterRoutes(api, authMiddleware)
		partnerReqHandler.RegisterRoutes(api, authMiddleware)
		neighborhoodShopHandler.RegisterRoutes(api, authMiddleware)
		neighborhoodShopBillingHandler.RegisterRoutes(api, authMiddleware)
		agentHandler.RegisterRoutes(api, authMiddleware)
		punktHandler.RegisterRoutes(api, authMiddleware)
		managerHandler.RegisterRoutes(api, authMiddleware)
		marketplaceUserHandler.RegisterRoutes(api, authMiddleware)
		categoryHandler.RegisterRoutes(api, authMiddleware)
		subcategoryHandler.RegisterRoutes(api, authMiddleware)
		productHandler.RegisterRoutes(api, authMiddleware)
		localShopTemplateHandler.RegisterRoutes(api, authMiddleware)
		localShopProductHandler.RegisterRoutes(api, authMiddleware)
		qrHandler.RegisterAdminRoutes(api, authMiddleware)
		productCommentFollowupHandler.RegisterRoutes(api, authMiddleware)
		orderPipelineHandler.RegisterRoutes(api, authMiddleware)
		txHandler.RegisterRoutes(api, authMiddleware)
		archiveHandler.RegisterRoutes(api, authMiddleware)
		adminNotificationHandler.RegisterRoutes(api, authMiddleware)
		if err := core.RegisterRoutes(api, db, authMiddleware, jwtSecret, jwtExpireHours); err != nil {
			return err
		}
	}

	reminderRepo := repository.NewSubscriptionReminderRepository(db)
	notificationRepo := coreRepo.NewIntegrationNotificationRepository(db)
	reminderScheduler := service.NewSubscriptionReminderScheduler(
		neighborhoodShopBillingRepo,
		reminderRepo,
		notificationRepo,
		coreHandler.IntegrationNotificationHubInstance(),
	)
	go reminderScheduler.Run(context.Background())

	return nil
}
