package marketplace

import (
	"strings"

	"backend/internal/pkg/security"
	"backend/modules/eskiz"
	"backend/modules/marketplace/domain"
	"backend/modules/marketplace/handler"
	"backend/modules/marketplace/repository"
	"backend/modules/marketplace/service"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func RegisterRoutes(router *gin.Engine, db *gorm.DB, jwtSecret string, jwtExpireHours int) error {
	if err := db.AutoMigrate(&domain.User{}, &domain.VerificationCode{}, &domain.DeliveryArea{}, &domain.CartItem{}, &domain.LocalShopCartItem{}, &domain.Order{}, &domain.OrderItem{}, &domain.LocalShopOrder{}, &domain.LocalShopOrderItem{}, &domain.PartnerRequest{}, &domain.ProductRating{}, &domain.MarketplaceNotificationRead{}); err != nil {
		return err
	}
	// Legacy schema compatibility: old versions had password NOT NULL.
	// Marketplace auth is SMS-only now, so this column must not block inserts.
	if db.Migrator().HasColumn(&domain.User{}, "password") {
		if err := db.Exec(`ALTER TABLE marketplace_users ALTER COLUMN password DROP NOT NULL`).Error; err != nil {
			return err
		}
	}

	repo := repository.NewAuthRepository(db)
	eskizSvc, _ := eskiz.NewFromEnv()
	authSvc := service.NewAuthService(repo, eskizSvc, jwtSecret, jwtExpireHours)
	authHandler := handler.NewAuthHandler(authSvc)
	deliveryRepo := repository.NewDeliveryAreaRepository(db)
	deliverySvc := service.NewDeliveryAreaService(deliveryRepo)
	deliveryHandler := handler.NewDeliveryAreaHandler(deliverySvc)
	productRepo := repository.NewMarketplaceProductRepository(db)
	cartRepo := repository.NewMarketplaceCartRepository(db)
	cartSvc := service.NewMarketplaceCartService(cartRepo, productRepo)
	cartHandler := handler.NewCartHandler(cartSvc)
	localShopCartRepo := repository.NewLocalShopCartRepository(db)
	localShopCartSvc := service.NewLocalShopCartService(localShopCartRepo)
	localShopCartHandler := handler.NewLocalShopCartHandler(localShopCartSvc)
	orderRepo := repository.NewMarketplaceOrderRepository(db)
	punktLookupRepo := repository.NewPunktLookupRepository(db)
	orderSvc := service.NewMarketplaceOrderService(orderRepo, productRepo, deliveryRepo, punktLookupRepo)
	orderHandler := handler.NewOrderHandler(orderSvc)
	localShopOrderRepo := repository.NewLocalShopOrderRepository(db)
	localShopOrderSvc := service.NewLocalShopOrderService(localShopOrderRepo, localShopCartRepo, deliveryRepo)
	localShopOrderHandler := handler.NewLocalShopOrderHandler(localShopOrderSvc)
	partnerReqRepo := repository.NewPartnerRequestRepository(db)
	partnerReqSvc := service.NewPartnerRequestService(partnerReqRepo)
	partnerReqHandler := handler.NewPartnerRequestHandler(partnerReqSvc)
	ratingRepo := repository.NewProductRatingRepository(db)
	ratingSvc := service.NewProductRatingService(ratingRepo)
	ratingHandler := handler.NewProductRatingHandler(ratingSvc)

	mpNotifRepo := repository.NewMarketplaceNotificationRepository(db)
	mpNotifSvc := service.NewMarketplaceNotificationService(mpNotifRepo)
	mpNotifHandler := handler.NewMarketplaceNotificationHandler(mpNotifSvc)

	api := router.Group("/api/v1")
	authMiddleware := marketplaceAuthMiddleware(jwtSecret)
	authHandler.RegisterRoutes(api, authMiddleware)
	cartHandler.RegisterRoutes(api, authMiddleware)
	localShopCartHandler.RegisterRoutes(api, authMiddleware)
	orderHandler.RegisterRoutes(api, authMiddleware)
	localShopOrderHandler.RegisterRoutes(api, authMiddleware)
	deliveryHandler.RegisterRoutes(api, authMiddleware)
	partnerReqHandler.RegisterRoutes(api, authMiddleware)
	ratingHandler.RegisterRoutes(api, authMiddleware)
	mpNotifHandler.RegisterRoutes(api, authMiddleware)
	return nil
}

func marketplaceAuthMiddleware(secret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := strings.TrimSpace(c.GetHeader("Authorization"))
		if authHeader == "" {
			if q := strings.TrimSpace(c.Query("token")); q != "" {
				authHeader = "Bearer " + q
			}
		}
		if authHeader == "" {
			c.JSON(401, gin.H{"message": "Authorization header topilmadi"})
			c.Abort()
			return
		}
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || !strings.EqualFold(parts[0], "Bearer") {
			c.JSON(401, gin.H{"message": "Authorization formati noto'g'ri"})
			c.Abort()
			return
		}
		claims, err := security.ParseMarketplaceToken(secret, parts[1])
		if err != nil {
			c.JSON(401, gin.H{"message": "token yaroqsiz"})
			c.Abort()
			return
		}
		c.Set("marketplace_user_id", claims.UserID)
		c.Next()
	}
}
