package main

import (
	"fmt"
	"log"
	"os"
	"time"

	"backend/internal/config"
	"backend/internal/platform/database"
	"backend/modules/core/domain"
	"backend/modules/core/repository"
	"backend/modules/core/service"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		return
	}

	switch os.Args[1] {
	case "notifications":
		runNotificationsTest()
	default:
		usage()
	}
}

func usage() {
	fmt.Println("Foydalanish:")
	fmt.Println("  go run ./cmd/test notifications")
}

func runNotificationsTest() {
	cfg := config.Load()
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("DB ulanishda xatolik: %v", err)
	}

	if err = db.AutoMigrate(&domain.IntegrationNotification{}); err != nil {
		log.Fatalf("integration_notifications migratsiyada xatolik: %v", err)
	}

	repo := repository.NewIntegrationNotificationRepository(db)
	svc := service.NewIntegrationNotificationService(repo)

	types := []string{
		domain.NotificationTypeInfo,
		domain.NotificationTypeWarning,
		domain.NotificationTypeSuccess,
		domain.NotificationTypeError,
		domain.NotificationTypeUpdate,
		domain.NotificationTypeAnnouncement,
	}
	targets := []string{
		domain.NotificationTargetAll,
		domain.NotificationTargetAdmins,
		domain.NotificationTargetAgents,
		domain.NotificationTargetContragents,
		domain.NotificationTargetMarketplace,
		domain.NotificationTargetManagers,
		domain.NotificationTargetPunkts,
		domain.NotificationTargetLocalShops,
		domain.NotificationTargetDeliveryProviders,
	}

	now := time.Now().Format("2006-01-02 15:04:05")
	created := 0
	for _, nType := range types {
		for _, target := range targets {
			title := fmt.Sprintf("[TEST MODE] %s -> %s", nType, target)
			message := fmt.Sprintf("TEST MODE: %s turidagi notification %s uchun yuborildi. Vaqt: %s", nType, target, now)
			_, err = svc.Create(service.IntegrationNotificationInput{
				Title:      title,
				Message:    message,
				Type:       nType,
				TargetType: target,
			})
			if err != nil {
				log.Printf("Yaratilmadi (%s/%s): %v", nType, target, err)
				continue
			}
			created++
		}
	}

	log.Printf("Test yakunlandi. %d ta notification yaratildi.", created)
}
