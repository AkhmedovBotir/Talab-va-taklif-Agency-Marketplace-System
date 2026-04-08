package localshops

import (
	"backend/modules/localshops/domain"
	"backend/modules/localshops/handler"
	"backend/modules/localshops/repository"
	"backend/modules/localshops/service"
	"backend/modules/eskiz"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.VerificationCode{}, &domain.Courier{}, &domain.Product{}, &domain.WorkingHour{}, &domain.ServiceArea{}, &domain.LocalShopNotificationRead{}); err != nil {
		return err
	}

	authRepo := repository.NewLocalShopAuthRepository(db)
	eskizService, err := eskiz.NewFromEnv()
	if err != nil {
		return err
	}
	authSvc := service.NewLocalShopAuthService(authRepo, eskizService, jwtSecret, jwtExpireHours)
	authHandler := handler.NewLocalShopAuthHandler(authSvc, jwtSecret)
	courierRepo := repository.NewCourierRepository(db)
	courierSvc := service.NewCourierService(courierRepo)
	courierHandler := handler.NewCourierHandler(courierSvc)
	templateRepo := repository.NewTemplateBrowseRepository(db)
	templateSvc := service.NewTemplateBrowseService(templateRepo)
	templateHandler := handler.NewTemplateBrowseHandler(templateSvc)
	productRepo := repository.NewProductRepository(db)
	productSvc := service.NewProductService(productRepo)
	productHandler := handler.NewProductHandler(productSvc)
	workingHourRepo := repository.NewWorkingHourRepository(db)
	workingHourSvc := service.NewWorkingHourService(workingHourRepo)
	workingHourHandler := handler.NewWorkingHourHandler(workingHourSvc)
	serviceAreaRepo := repository.NewServiceAreaRepository(db)
	serviceAreaSvc := service.NewServiceAreaService(serviceAreaRepo)
	serviceAreaHandler := handler.NewServiceAreaHandler(serviceAreaSvc)
	orderMgmtRepo := repository.NewOrderManagementRepository(db)
	orderMgmtSvc := service.NewOrderManagementService(orderMgmtRepo)
	orderMgmtHandler := handler.NewOrderManagementHandler(orderMgmtSvc)

	lsNotifRepo := repository.NewLocalShopNotificationRepository(db)
	lsNotifSvc := service.NewLocalShopNotificationService(lsNotifRepo)
	lsNotifHandler := handler.NewLocalShopNotificationHandler(lsNotifSvc)

	api := router.Group("/api/v1")
	authHandler.RegisterPublicAuthRoutes(api)
	me := api.Group("/local-shops/me")
	me.Use(authHandler.AuthMiddleware())
	authHandler.RegisterMeRoutes(me)
	courierHandler.RegisterMeRoutes(me)
	templateHandler.RegisterMeRoutes(me)
	productHandler.RegisterMeRoutes(me)
	workingHourHandler.RegisterMeRoutes(me)
	serviceAreaHandler.RegisterMeRoutes(me)
	orderMgmtHandler.RegisterMeRoutes(me)
	lsNotifHandler.RegisterMeRoutes(me)
	return nil
}
