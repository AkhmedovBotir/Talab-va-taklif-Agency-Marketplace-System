package main

import (
	"errors"
	"log"

	"backend/internal/config"
	"backend/internal/pkg/security"
	"backend/internal/platform/database"
	"backend/modules/admin/domain"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("DB ulanishda xatolik: %v", err)
	}

	if err = db.AutoMigrate(&domain.Admin{}); err != nil {
		log.Fatalf("Migratsiyada xatolik: %v", err)
	}

	allPerms := domain.AllAdminPermissions()

	var general domain.Admin
	err = db.Where("role = ?", domain.RoleGeneral).First(&general).Error
	if err == nil {
		general.Permissions = allPerms
		if saveErr := db.Save(&general).Error; saveErr != nil {
			log.Fatalf("General admin permissions yangilashda xatolik: %v", saveErr)
		}
		log.Printf("General admin (id=%d) permissions yangilandi (%d ta).", general.ID, len(allPerms))
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatalf("General admin qidirishda xatolik: %v", err)
	}

	err = db.Where("username = ? OR phone = ?", cfg.GeneralAdminUsername, cfg.GeneralAdminPhone).First(&general).Error
	if err == nil {
		general.Role = domain.RoleGeneral
		general.Permissions = allPerms
		if saveErr := db.Save(&general).Error; saveErr != nil {
			log.Fatalf("Mavjud adminni general qilishda xatolik: %v", saveErr)
		}
		log.Printf("Mavjud admin (id=%d) general qilindi va permissions berildi.", general.ID)
		return
	}
	if !errors.Is(err, gorm.ErrRecordNotFound) {
		log.Fatalf("Admin qidirishda xatolik: %v", err)
	}

	hashedPassword, err := security.HashPassword(cfg.GeneralAdminPassword)
	if err != nil {
		log.Fatalf("Parolni hash qilishda xatolik: %v", err)
	}

	newAdmin := domain.Admin{
		Name:        cfg.GeneralAdminName,
		Role:        domain.RoleGeneral,
		Phone:       cfg.GeneralAdminPhone,
		Username:    cfg.GeneralAdminUsername,
		Password:    hashedPassword,
		Status:      cfg.GeneralAdminStatus,
		Permissions: allPerms,
	}

	if err = db.Create(&newAdmin).Error; err != nil {
		log.Fatalf("General admin yaratishda xatolik: %v", err)
	}

	log.Println("General admin muvaffaqiyatli yaratildi (barcha permissions bilan).")
}
