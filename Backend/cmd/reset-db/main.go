package main

import (
	"flag"
	"fmt"
	"log"

	"backend/internal/config"
	"backend/internal/platform/database"
)

func main() {
	confirm := flag.Bool("confirm", false, "DB ni to'liq tozalashni tasdiqlash (boshqa holda hech narsa qilinmaydi)")
	flag.Parse()

	if !*confirm {
		log.Fatal("Xavfsizlik: barcha jadvallarni o'chirish uchun qo'shing: -confirm\nMisol: go run ./cmd/reset-db -confirm")
	}

	cfg := config.Load()
	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("DB ulanishda xatolik: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("sql.DB olishda xatolik: %v", err)
	}

	stmts := []string{
		`DROP SCHEMA IF EXISTS public CASCADE`,
		`CREATE SCHEMA public`,
		// Ulanayotgan foydalanuvchi sxema egasi bo'lishi uchun (ko'p dev muhitlarda yetarli)
		fmt.Sprintf(`GRANT ALL ON SCHEMA public TO %s`, quotePGIdent(cfg.DBUser)),
		`GRANT ALL ON SCHEMA public TO PUBLIC`,
	}

	for _, q := range stmts {
		if _, err = sqlDB.Exec(q); err != nil {
			log.Fatalf("SQL bajarilmadi (%q): %v", q, err)
		}
	}

	_ = sqlDB.Close()

	log.Println("public sxemasi to'liq yangilandi (barcha jadvallar o'chirildi).")
	log.Println("Keyingi qadam: migratsiya va ma'lumot — masalan `go run ./cmd/api` (AutoMigrate) yoki seed/import skriptlaringiz.")
}

// quotePGIdent oddiy identifikatorlar uchun "..." qo'shtirnoq.
func quotePGIdent(s string) string {
	out := `"`
	for _, r := range s {
		switch r {
		case '"':
			out += `""`
		default:
			out += string(r)
		}
	}
	return out + `"`
}
