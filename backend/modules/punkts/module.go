package punkts

import (
	"backend/internal/pkg/orderembed"
	"backend/modules/eskiz"
	"backend/modules/punkts/domain"
	"backend/modules/punkts/handler"
	"backend/modules/punkts/repository"
	"backend/modules/punkts/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.PunktContragentLineRequest{}, &domain.PunktOrderTransfer{}, &domain.PunktOrderTransferItem{}); err != nil {
		return err
	}

	authRepo := repository.NewPunktAuthRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	authSvc := service.NewPunktAuthService(authRepo, eskizService, jwtSecret, jwtExpireHours)
	authHandler := handler.NewPunktAuthHandler(authSvc, jwtSecret)

	punktOrderRepo := repository.NewPunktMarketplaceOrderRepository(db)
	punktOrderSvc := service.NewPunktOrderService(punktOrderRepo, orderembed.NewLoader(db))
	punktOrderHandler := handler.NewPunktOrderHandler(punktOrderSvc)
	transferRepo := repository.NewPunktOrderTransferRepository(db)
	transferSvc := service.NewPunktOrderTransferService(transferRepo)
	transferHandler := handler.NewPunktOrderTransferHandler(transferSvc)

	agentListRepo := repository.NewPunktAgentListRepository(db)
	agentDirSvc := service.NewPunktAgentDirectoryService(agentListRepo)
	punktAgentsHandler := handler.NewPunktAgentsHandler(agentDirSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterRoutes(api)

	me := api.Group("/punkts/me")
	me.Use(authHandler.AuthMiddleware())
	{
		authHandler.RegisterMeRoutes(me)
		punktOrderHandler.RegisterMeRoutes(me)
		transferHandler.RegisterMeRoutes(me)
		punktAgentsHandler.RegisterMeRoutes(me)
	}
	return nil
}
