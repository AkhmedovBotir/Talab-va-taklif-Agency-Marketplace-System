package deliveryproviders

import (
	"backend/modules/deliveryproviders/domain"
	"backend/modules/deliveryproviders/handler"
	"backend/modules/deliveryproviders/repository"
	"backend/modules/deliveryproviders/service"
	"backend/modules/eskiz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.DeliveryProviderNotificationRead{}); err != nil {
		return err
	}
	repo := repository.NewAuthRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	authSvc := service.NewAuthService(repo, eskizService, jwtSecret, jwtExpireHours)
	authHandler := handler.NewAuthHandler(authSvc, jwtSecret)
	orderRepo := repository.NewOrderRepository(db)
	orderSvc := service.NewOrderService(orderRepo)
	orderHandler := handler.NewOrderHandler(orderSvc)

	dpNotifRepo := repository.NewDeliveryProviderNotificationRepository(db)
	dpNotifSvc := service.NewDeliveryProviderNotificationService(dpNotifRepo)
	dpNotifHandler := handler.NewDeliveryProviderNotificationHandler(dpNotifSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterPublicAuthRoutes(api)
	me := api.Group("/delivery-providers/me")
	me.Use(authHandler.AuthMiddleware())
	authHandler.RegisterMeRoutes(me)
	orderHandler.RegisterMeRoutes(me)
	dpNotifHandler.RegisterMeRoutes(me)
	return nil
}
