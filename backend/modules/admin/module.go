package admin

import (
	"fmt"

	"backend/modules/admin/domain"
	"backend/modules/admin/handler"
	"backend/modules/admin/repository"
	"backend/modules/admin/service"
	contrDomain "backend/modules/contragents/domain"
	"backend/modules/core"
	mpDomain "backend/modules/marketplace/domain"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.Admin{}, &domain.Region{}, &domain.District{}, &domain.MFY{}, &domain.ContragentType{}, &domain.Contragent{}, &domain.NeighborhoodShop{}, &domain.Agent{}, &domain.Punkt{}, &domain.Manager{}, &domain.Category{}, &contrDomain.Product{}, &contrDomain.ProductImage{}, &domain.LocalShopProductTemplate{}, &domain.LocalShopProductTemplateImage{}, &mpDomain.PartnerRequest{}, &domain.CommentTemplate{}, &domain.ArchiveLog{}, &domain.QR{}, &domain.ProductCommentCase{}, &domain.ProductCommentActivity{}, &domain.AdminNotificationRead{}); err != nil {
		return err
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
	productRepo := repository.NewAdminProductRepository(db)
	productSvc := service.NewAdminProductService(productRepo)
	productHandler := handler.NewProductHandler(productSvc)
	localShopTemplateRepo := repository.NewLocalShopProductTemplateRepository(db)
	localShopTemplateSvc := service.NewLocalShopProductTemplateService(localShopTemplateRepo)
	localShopTemplateHandler := handler.NewLocalShopProductTemplateHandler(localShopTemplateSvc)
	qrRepo := repository.NewQRRepository(db)
	qrSvc := service.NewQRService(qrRepo)
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
	onlyGeneral := handler.GeneralOnly()

	api := router.Group("/api/v1")
	{
		api.POST("/admins/login", h.Login)
		qrHandler.RegisterPublicRoutes(api)

		adminRoutes := api.Group("/admins")
		adminRoutes.Use(authMiddleware, onlyGeneral)
		{
			adminRoutes.POST("", h.Create)
			adminRoutes.GET("", h.GetAll)
			adminRoutes.GET("/:id", h.GetByID)
			adminRoutes.PUT("/:id", h.Update)
			adminRoutes.PATCH("/:id/status", h.UpdateStatus)
			adminRoutes.DELETE("/:id", h.Delete)
		}

		regionHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		contragentTypeHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		contragentHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		commentTemplateHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		partnerReqHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		neighborhoodShopHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		agentHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		punktHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		managerHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		marketplaceUserHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		categoryHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		subcategoryHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		productHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		localShopTemplateHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		qrHandler.RegisterAdminRoutes(api, authMiddleware, onlyGeneral)
		productCommentFollowupHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		orderPipelineHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		txHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		archiveHandler.RegisterRoutes(api, authMiddleware, onlyGeneral)
		adminNotificationHandler.RegisterRoutes(api, authMiddleware)
		if err := core.RegisterRoutes(api, db, authMiddleware, onlyGeneral, jwtSecret, jwtExpireHours); err != nil {
			return err
		}
	}
	return nil
}
