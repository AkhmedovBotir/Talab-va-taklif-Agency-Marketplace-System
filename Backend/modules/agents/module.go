package agents

import (
	"backend/internal/pkg/orderembed"
	coreRepo "backend/modules/core/repository"
	"backend/modules/agents/domain"
	"backend/modules/agents/handler"
	"backend/modules/agents/repository"
	"backend/modules/agents/service"
	"backend/modules/eskiz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.AgentKPIPayout{}, &domain.AgentNotificationRead{}); err != nil {
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

	orderKPIRepo := coreRepo.NewMarketplaceOrderKPIRepository(db)
	agentPayoutRepo := repository.NewAgentKPIPayoutRepository(db)
	agentKPISvc := service.NewAgentKPIService(orderKPIRepo, agentPayoutRepo)
	agentKPIHandler := handler.NewAgentKPIHandler(agentKPISvc)

	agentNotifRepo := repository.NewAgentNotificationRepository(db)
	agentNotifSvc := service.NewAgentNotificationService(agentNotifRepo)
	agentNotifHandler := handler.NewAgentNotificationHandler(agentNotifSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterPublicAuthRoutes(api)
	me := api.Group("/agents/me")
	me.Use(authHandler.AuthMiddleware())
	authHandler.RegisterMeRoutes(me)
	orderHandler.RegisterMeRoutes(me)
	agentKPIHandler.RegisterMeRoutes(me)
	agentNotifHandler.RegisterMeRoutes(me)
	return nil
}
