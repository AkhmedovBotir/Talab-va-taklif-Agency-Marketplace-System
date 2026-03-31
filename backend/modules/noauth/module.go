package noauth

import (
	"backend/modules/marketplace/repository"
	mpsvc "backend/modules/marketplace/service"
	"backend/modules/noauth/handler"
	"backend/modules/noauth/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB) error {
	productRepo := repository.NewMarketplaceProductRepository(db)
	productSvc := mpsvc.NewMarketplaceProductService(productRepo)

	categoryRepo := repository.NewMarketplaceCategoryRepository(db)
	categorySvc := mpsvc.NewMarketplaceCategoryService(categoryRepo)

	contragentBrowseRepo := repository.NewMarketplaceContragentBrowseRepository(db)
	contragentSvc := mpsvc.NewMarketplaceContragentBrowseService(contragentBrowseRepo, productRepo)

	regionRepo := repository.NewRegionRepository(db)
	regionSvc := mpsvc.NewRegionService(regionRepo)

	noAuthSvc := service.NewNoAuthService(productSvc, categorySvc, contragentSvc, regionSvc, db)
	noAuthHandler := handler.NewNoAuthHandler(noAuthSvc)

	api := router.Group("/api/v1")
	noAuthHandler.RegisterRoutes(api)
	return nil
}
