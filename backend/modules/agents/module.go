package agents

import (
	"backend/internal/pkg/orderembed"
	"backend/modules/agents/domain"
	"backend/modules/agents/handler"
	"backend/modules/agents/repository"
	"backend/modules/agents/service"
	"backend/modules/eskiz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}); err != nil {
		return err
	}

	authRepo := repository.NewAgentAuthRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	authSvc := service.NewAgentAuthService(authRepo, eskizService, jwtSecret, jwtExpireHours)
	authHandler := handler.NewAgentAuthHandler(authSvc, jwtSecret)

	orderRepo := repository.NewAgentOrderRepository(db)
	orderSvc := service.NewAgentOrderService(orderRepo, orderembed.NewLoader(db))
	orderHandler := handler.NewAgentOrderHandler(orderSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterPublicAuthRoutes(api)
	me := api.Group("/agents/me")
	me.Use(authHandler.AuthMiddleware())
	authHandler.RegisterMeRoutes(me)
	orderHandler.RegisterMeRoutes(me)
	return nil
}
