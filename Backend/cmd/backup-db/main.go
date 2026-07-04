package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"backend/internal/config"
)

const backupTimeout = 2 * time.Hour

func main() {
	cfg := config.Load()
	if err := runBackup(cfg); err != nil {
		log.Fatalf("Backup xatolik: %v", err)
	}
}

func runBackup(cfg config.Config) error {
	backupDir := strings.TrimSpace(cfg.BackupDir)
	if backupDir == "" {
		backupDir = "backups"
	}
	if err := os.MkdirAll(backupDir, 0o755); err != nil {
		return fmt.Errorf("backup papkasi yaratilmadi: %w", err)
	}

	pgDump, err := findPgDump()
	if err != nil {
		return err
	}

	timestamp := time.Now().Format("20060102_150405")
	filename := fmt.Sprintf("%s_%s.dump", cfg.DBName, timestamp)
	outPath := filepath.Join(backupDir, filename)

	args := []string{
		"-h", cfg.DBHost,
		"-p", cfg.DBPort,
		"-U", cfg.DBUser,
		"-d", cfg.DBName,
		"-F", "c",
		"-f", outPath,
		"--no-owner",
		"--no-acl",
	}

	ctx, cancel := context.WithTimeout(context.Background(), backupTimeout)
	defer cancel()

	cmd := exec.CommandContext(ctx, pgDump, args...)
	cmd.Env = append(os.Environ(),
		"PGPASSWORD="+cfg.DBPassword,
		"PGSSLMODE="+cfg.DBSSLMode,
	)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	log.Printf("Backup boshlandi (API dan mustaqil jarayon): %s", outPath)
	if err := cmd.Run(); err != nil {
		_ = os.Remove(outPath)
		return fmt.Errorf("pg_dump: %w", err)
	}

	info, err := os.Stat(outPath)
	if err != nil {
		return fmt.Errorf("backup faylini tekshirish: %w", err)
	}
	log.Printf("Backup muvaffaqiyatli: %s (%.2f MB)", outPath, float64(info.Size())/1024/1024)

	if cfg.BackupRetentionDays > 0 {
		if err := cleanOldBackups(backupDir, cfg.DBName, cfg.BackupRetentionDays); err != nil {
			log.Printf("Eski backup larni tozalashda ogohlantirish: %v", err)
		}
	}
	return nil
}

func findPgDump() (string, error) {
	if p := strings.TrimSpace(os.Getenv("PG_DUMP")); p != "" {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}
	if p, err := exec.LookPath("pg_dump"); err == nil {
		return p, nil
	}

	windowsCandidates := []string{
		`C:\Program Files\PostgreSQL\17\bin\pg_dump.exe`,
		`C:\Program Files\PostgreSQL\16\bin\pg_dump.exe`,
		`C:\Program Files\PostgreSQL\15\bin\pg_dump.exe`,
		`C:\Program Files\PostgreSQL\14\bin\pg_dump.exe`,
	}
	for _, p := range windowsCandidates {
		if _, err := os.Stat(p); err == nil {
			return p, nil
		}
	}

	return "", fmt.Errorf("pg_dump topilmadi: PATH ga qo'shing yoki PG_DUMP muhit o'zgaruvchisini o'rnating")
}

func cleanOldBackups(dir, dbName string, retentionDays int) error {
	cutoff := time.Now().AddDate(0, 0, -retentionDays)
	pattern := filepath.Join(dir, dbName+"_*.dump")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return err
	}

	var removed int
	for _, f := range files {
		info, err := os.Stat(f)
		if err != nil {
			continue
		}
		if info.ModTime().Before(cutoff) {
			if err := os.Remove(f); err != nil {
				log.Printf("O'chirib bo'lmadi %s: %v", f, err)
				continue
			}
			removed++
		}
	}
	if removed > 0 {
		log.Printf("%d ta eski backup o'chirildi (>%d kun)", removed, retentionDays)
	}
	return nil
}
