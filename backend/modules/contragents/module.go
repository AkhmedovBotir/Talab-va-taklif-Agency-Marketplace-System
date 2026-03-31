package contragents

import (
	"backend/internal/pkg/orderembed"
	"backend/modules/contragents/domain"
	"backend/modules/contragents/handler"
	"backend/modules/contragents/repository"
	"backend/modules/contragents/service"
	"backend/modules/eskiz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.ContragentDeliveryRegion{}, &domain.ContragentDeliveryDistrict{}, &domain.Product{}, &domain.ProductImage{}); err != nil {
		return err
	}

	authRepo := repository.NewContragentAuthRepository(db)
	categoryRepo := repository.NewContragentCategoryRepository(db)
	regionDeliveryRepo := repository.NewContragentRegionDeliveryRepository(db)
	productRepo := repository.NewContragentProductRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	authSvc := service.NewContragentAuthService(authRepo, eskizService, jwtSecret, jwtExpireHours)
	categorySvc := service.NewContragentCategoryService(categoryRepo)
	regionDeliverySvc := service.NewContragentRegionDeliveryService(regionDeliveryRepo)
	productSvc := service.NewContragentProductService(productRepo)
	punktLineRepo := repository.NewContragentPunktLineRequestRepository(db)
	punktLineSvc := service.NewContragentPunktLineRequestService(punktLineRepo, orderembed.NewLoader(db))

	authHandler := handler.NewContragentAuthHandler(authSvc, jwtSecret)
	categoryHandler := handler.NewContragentCategoryHandler(categorySvc)
	regionDeliveryHandler := handler.NewContragentRegionDeliveryHandler(regionDeliverySvc)
	productHandler := handler.NewContragentProductHandler(productSvc)
	punktLineHandler := handler.NewContragentPunktLineRequestHandler(punktLineSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterPublicAuthRoutes(api)
	me := api.Group("/contragents/me")
	me.Use(authHandler.AuthMiddleware())
	authHandler.RegisterMeRoutes(me)
	categoryHandler.RegisterMeRoutes(me)
	regionDeliveryHandler.RegisterMeRoutes(me)
	productHandler.RegisterMeRoutes(me)
	punktLineHandler.RegisterMeRoutes(me)
	return nil
}
