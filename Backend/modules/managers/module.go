package managers

import (
	adminRepo "backend/modules/admin/repository"
	"backend/modules/eskiz"
	"backend/modules/managers/domain"
	"backend/modules/managers/handler"
	"backend/modules/managers/repository"
	"backend/modules/managers/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.ManagerNotificationRead{}); err != nil {
		return err
	}
	repo := repository.NewAuthRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	svc := service.NewAuthService(repo, eskizService, jwtSecret, jwtExpireHours)
	h := handler.NewAuthHandler(svc, jwtSecret)
	managerMarketplaceUserRepo := repository.NewManagerMarketplaceUserRepository(db)
	managerMarketplaceUserSvc := service.NewManagerMarketplaceUserService(managerMarketplaceUserRepo)
	managerMarketplaceUserHandler := handler.NewManagerMarketplaceUserHandler(managerMarketplaceUserSvc, svc)
	managerOrderPipelineRepo := repository.NewManagerOrderPipelineRepository(db)
	managerOrderPipelineSvc := service.NewManagerOrderPipelineService(managerOrderPipelineRepo, db)
	managerOrderPipelineHandler := handler.NewManagerOrderPipelineHandler(managerOrderPipelineSvc, svc)
	productCommentFollowupRepo := adminRepo.NewProductCommentFollowupRepository(db)
	managerProductCommentFollowupSvc := service.NewManagerProductCommentFollowupService(productCommentFollowupRepo)
	managerProductCommentFollowupHandler := handler.NewManagerProductCommentFollowupHandler(managerProductCommentFollowupSvc, svc)
	managerNotifRepo := repository.NewManagerNotificationRepository(db)
	managerNotifSvc := service.NewManagerNotificationService(managerNotifRepo)
	managerNotifHandler := handler.NewManagerNotificationHandler(managerNotifSvc)

	api := router.Group("/api/v1")
	h.RegisterPublicAuthRoutes(api)
	me := api.Group("/managers/me")
	me.Use(h.AuthMiddleware())
	h.RegisterMeRoutes(me)
	managerNotifHandler.RegisterMeRoutes(me)
	managerMarketplaceUserHandler.RegisterRoutes(api, h.AuthMiddleware())
	managerOrderPipelineHandler.RegisterRoutes(api, h.AuthMiddleware())
	managerProductCommentFollowupHandler.RegisterRoutes(api, h.AuthMiddleware())
	return nil
}
