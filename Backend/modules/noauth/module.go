package noauth

import (
	"backend/internal/pkg/productmedia"
	"backend/modules/marketplace/repository"
	mpsvc "backend/modules/marketplace/service"
	"backend/modules/noauth/handler"
	"backend/modules/noauth/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, appBaseURL, uploadDir string) error {
	productRepo := repository.NewMarketplaceProductRepository(db)
	productMedia := productmedia.NewStore(uploadDir, appBaseURL)
	productSvc := mpsvc.NewMarketplaceProductService(productRepo, productMedia)

	categoryRepo := repository.NewMarketplaceCategoryRepository(db)
	categorySvc := mpsvc.NewMarketplaceCategoryService(categoryRepo)

	contragentBrowseRepo := repository.NewMarketplaceContragentBrowseRepository(db)
	contragentSvc := mpsvc.NewMarketplaceContragentBrowseService(contragentBrowseRepo, productRepo, productMedia)

	regionRepo := repository.NewRegionRepository(db)
	regionSvc := mpsvc.NewRegionService(regionRepo)

	noAuthSvc := service.NewNoAuthService(productSvc, categorySvc, contragentSvc, regionSvc, db)
	noAuthHandler := handler.NewNoAuthHandler(noAuthSvc)

	api := router.Group("/api/v1")
	noAuthHandler.RegisterRoutes(api)
	return nil
}
