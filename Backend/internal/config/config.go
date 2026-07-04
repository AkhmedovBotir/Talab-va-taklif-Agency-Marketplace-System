package config

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	AppPort          string
	AppBaseURL       string // QR va boshqa ochiq URL lar uchun (masalan https://api.ttsa.uz)
	UploadDir        string // Mahsulot rasmlari: ./uploads
	DBHost           string
	DBPort           string
	DBUser           string
	DBPassword       string
	DBName           string
	DBSSLMode        string
	JWTSecret                 string
	JWTExpireHours            int
	MarketplaceJWTExpireHours int
	GeneralAdminName string
	GeneralAdminRole string
	GeneralAdminPhone string
	GeneralAdminUsername string
	GeneralAdminPassword string
	GeneralAdminStatus string
	BackupDir            string
	BackupRetentionDays  int
}

func Load() Config {
	_ = godotenv.Load()

	expire, err := strconv.Atoi(getEnv("JWT_EXPIRE_HOURS", "24"))
	if err != nil {
		log.Println("JWT_EXPIRE_HOURS noto'g'ri, default 24 ishlatildi")
		expire = 24
	}

	marketplaceExpire, err := strconv.Atoi(getEnv("MARKETPLACE_JWT_EXPIRE_HOURS", "8760"))
	if err != nil {
		log.Println("MARKETPLACE_JWT_EXPIRE_HOURS noto'g'ri, default 8760 (1 yil) ishlatildi")
		marketplaceExpire = 8760
	}

	backupRetention, err := strconv.Atoi(getEnv("BACKUP_RETENTION_DAYS", "30"))
	if err != nil {
		log.Println("BACKUP_RETENTION_DAYS noto'g'ri, default 30 ishlatildi")
		backupRetention = 30
	}

	return Config{
		AppPort:             getEnv("APP_PORT", "8081"),
		AppBaseURL:          getEnv("APP_BASE_URL", "https://api.ttsa.uz"),
		UploadDir:           getEnv("UPLOAD_DIR", "uploads"),
		DBHost:              getEnv("DB_HOST", "localhost"),
		DBPort:              getEnv("DB_PORT", "5432"),
		DBUser:              getEnv("DB_USER", "postgres"),
		DBPassword:          getEnv("DB_PASSWORD", "123456"),
		DBName:              getEnv("DB_NAME", "admin_db"),
		DBSSLMode:           getEnv("DB_SSLMODE", "disable"),
		JWTSecret:                 getEnv("JWT_SECRET", "very-secret-key"),
		JWTExpireHours:            expire,
		MarketplaceJWTExpireHours: marketplaceExpire,
		GeneralAdminName:    getEnv("GENERAL_ADMIN_NAME", "Super Admin"),
		GeneralAdminRole:    getEnv("GENERAL_ADMIN_ROLE", "general"),
		GeneralAdminPhone:   getEnv("GENERAL_ADMIN_PHONE", "+998901234567"),
		GeneralAdminUsername: getEnv("GENERAL_ADMIN_USERNAME", "general_admin"),
		GeneralAdminPassword: getEnv("GENERAL_ADMIN_PASSWORD", "12345678"),
		GeneralAdminStatus:  getEnv("GENERAL_ADMIN_STATUS", "active"),
		BackupDir:           getEnv("BACKUP_DIR", "backups"),
		BackupRetentionDays: backupRetention,
	}
}

func getEnv(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
