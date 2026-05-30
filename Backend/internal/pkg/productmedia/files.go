package productmedia

import (
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

const maxFileBytes = 4 * 1024 * 1024

// FileInput — multipart dan o‘qilgan bitta rasm.
type FileInput struct {
	Data        []byte
	ContentType string
	Filename    string
}

var allowedMIMEs = map[string]string{
	"image/jpeg": ".jpg",
	"image/jpg":  ".jpg",
	"image/png":  ".png",
	"image/webp": ".webp",
	"image/gif":  ".gif",
}

// ValidateFile — hajm va MIME.
func ValidateFile(f FileInput) error {
	if len(f.Data) == 0 {
		return fmt.Errorf("empty file")
	}
	if len(f.Data) > maxFileBytes {
		return fmt.Errorf("file too large")
	}
	ct := normalizeMIME(f.ContentType, f.Filename)
	if _, ok := allowedMIMEs[ct]; !ok {
		return fmt.Errorf("unsupported type")
	}
	return nil
}

func normalizeMIME(contentType, filename string) string {
	ct := strings.ToLower(strings.TrimSpace(contentType))
	if idx := strings.Index(ct, ";"); idx >= 0 {
		ct = ct[:idx]
	}
	if ct != "" && ct != "application/octet-stream" {
		return ct
	}
	switch strings.ToLower(filepath.Ext(filename)) {
	case ".png":
		return "image/png"
	case ".webp":
		return "image/webp"
	case ".gif":
		return "image/gif"
	default:
		return "image/jpeg"
	}
}

// SaveProductFile — bitta faylni products/{id}/{sortOrder}.ext ga yozadi.
func (s *Store) SaveProductFile(productID uint, sortOrder int, f FileInput) (string, error) {
	if err := ValidateFile(f); err != nil {
		return "", err
	}
	ct := normalizeMIME(f.ContentType, f.Filename)
	ext := allowedMIMEs[ct]
	rel := filepath.ToSlash(filepath.Join(productPrefix, strconv.FormatUint(uint64(productID), 10), strconv.Itoa(sortOrder)+ext))
	abs := filepath.Join(s.uploadDir, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(abs, f.Data, 0o644); err != nil {
		return "", err
	}
	return rel, nil
}

// SaveTemplateFile — bitta faylni templates/{id}/{sortOrder}.ext ga yozadi.
func (s *Store) SaveTemplateFile(templateID uint, sortOrder int, f FileInput) (string, error) {
	if err := ValidateFile(f); err != nil {
		return "", err
	}
	ct := normalizeMIME(f.ContentType, f.Filename)
	ext := allowedMIMEs[ct]
	rel := filepath.ToSlash(filepath.Join(templatePrefix, strconv.FormatUint(uint64(templateID), 10), strconv.Itoa(sortOrder)+ext))
	abs := filepath.Join(s.uploadDir, rel)
	if err := os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err := os.WriteFile(abs, f.Data, 0o644); err != nil {
		return "", err
	}
	return rel, nil
}

// RemoveFileByRel — diskdagi nisbiy yo‘lni o‘chiradi.
func (s *Store) RemoveFileByRel(rel string) {
	rel = strings.TrimSpace(rel)
	if rel == "" || strings.HasPrefix(rel, "data:") {
		return
	}
	rel = strings.TrimPrefix(rel, "/")
	rel = strings.TrimPrefix(rel, "uploads/")
	_ = os.Remove(filepath.Join(s.uploadDir, rel))
}
