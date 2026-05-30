package productmedia

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"backend/internal/pkg/imagebase64"
)

const (
	productPrefix  = "products"
	templatePrefix = "templates"
)

// Store — mahsulot/shablon rasmlarini diskda saqlaydi; DB da nisbiy yo‘l yoki URL.
type Store struct {
	uploadDir  string
	publicBase string // masalan https://api.ttsa.uz
}

func NewStore(uploadDir, publicBase string) *Store {
	base := strings.TrimRight(strings.TrimSpace(publicBase), "/")
	dir := strings.TrimSpace(uploadDir)
	if dir == "" {
		dir = "uploads"
	}
	_ = os.MkdirAll(dir, 0o755)
	return &Store{uploadDir: dir, publicBase: base}
}

// ValidateImageInput — frontend hali base64 yuborishi mumkin; URL ham qabul qilinadi.
func (s *Store) ValidateImageInput(raw string) (invalid, tooLarge bool) {
	raw = strings.TrimSpace(raw)
	if raw == "" {
		return true, false
	}
	if s.isStoredReference(raw) {
		return false, false
	}
	switch imagebase64.Validate(raw) {
	case imagebase64.TooLarge:
		return false, true
	case imagebase64.Invalid:
		return true, false
	default:
		return false, false
	}
}

func (s *Store) PrepareProductImages(productID uint, inputs []string) ([]string, error) {
	return s.prepare(productPrefix, productID, inputs)
}

func (s *Store) PrepareTemplateImages(templateID uint, inputs []string) ([]string, error) {
	return s.prepare(templatePrefix, templateID, inputs)
}

func (s *Store) prepare(prefix string, entityID uint, inputs []string) ([]string, error) {
	out := make([]string, 0, len(inputs))
	dir := filepath.Join(s.uploadDir, prefix, strconv.FormatUint(uint64(entityID), 10))
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	for i, in := range inputs {
		in = strings.TrimSpace(in)
		if rel, ok := s.relFromInput(prefix, entityID, in); ok {
			out = append(out, rel)
			continue
		}
		rel, err := s.saveBase64(prefix, entityID, i, in)
		if err != nil {
			return nil, err
		}
		out = append(out, rel)
	}
	s.pruneDir(dir, out)
	return out, nil
}

// PublicURLs — API javobida to‘liq URL (img src uchun); eski base64 DB da qolsa — o‘zgartirilmaydi.
func (s *Store) PublicURLs(stored []string) []string {
	if len(stored) == 0 {
		return []string{}
	}
	out := make([]string, len(stored))
	for i, v := range stored {
		out[i] = s.publicOne(v)
	}
	return out
}

func (s *Store) publicOne(v string) string {
	v = strings.TrimSpace(v)
	if v == "" {
		return ""
	}
	if strings.HasPrefix(v, "data:") || s.looksLikeLegacyBase64(v) {
		return v
	}
	if strings.HasPrefix(v, "http://") || strings.HasPrefix(v, "https://") {
		return v
	}
	rel := strings.TrimPrefix(v, "/")
	rel = strings.TrimPrefix(rel, "uploads/")
	return s.publicBase + "/uploads/" + rel
}

func (s *Store) RemoveProductDir(productID uint) {
	s.removeDir(productPrefix, productID)
}

func (s *Store) RemoveTemplateDir(templateID uint) {
	s.removeDir(templatePrefix, templateID)
}

func (s *Store) removeDir(prefix string, id uint) {
	_ = os.RemoveAll(filepath.Join(s.uploadDir, prefix, strconv.FormatUint(uint64(id), 10)))
}

func (s *Store) isStoredReference(raw string) bool {
	_, ok := s.relFromInput("", 0, raw)
	return ok
}

func (s *Store) relFromInput(prefix string, entityID uint, in string) (string, bool) {
	in = strings.TrimSpace(in)
	if in == "" {
		return "", false
	}
	uploadsPrefix := s.publicBase + "/uploads/"
	if strings.HasPrefix(in, uploadsPrefix) {
		return strings.TrimPrefix(in, uploadsPrefix), true
	}
	if strings.HasPrefix(in, "/uploads/") {
		return strings.TrimPrefix(in, "/uploads/"), true
	}
	if strings.HasPrefix(in, "uploads/") {
		return strings.TrimPrefix(in, "uploads/"), true
	}
	if strings.HasPrefix(in, productPrefix+"/") || strings.HasPrefix(in, templatePrefix+"/") {
		return in, true
	}
	return "", false
}

func (s *Store) looksLikeLegacyBase64(v string) bool {
	if strings.HasPrefix(v, "data:") {
		return true
	}
	return len(v) > 256 && !strings.Contains(v, "/")
}

func (s *Store) saveBase64(prefix string, entityID uint, index int, raw string) (string, error) {
	mime, payload, err := splitDataURL(raw)
	if err != nil {
		return "", err
	}
	data, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return "", fmt.Errorf("base64 decode: %w", err)
	}
	ext := extFromMIME(mime)
	rel := filepath.ToSlash(filepath.Join(prefix, strconv.FormatUint(uint64(entityID), 10), strconv.Itoa(index)+ext))
	abs := filepath.Join(s.uploadDir, rel)
	if err = os.MkdirAll(filepath.Dir(abs), 0o755); err != nil {
		return "", err
	}
	if err = os.WriteFile(abs, data, 0o644); err != nil {
		return "", err
	}
	return rel, nil
}

func splitDataURL(raw string) (mime, payload string, err error) {
	raw = strings.TrimSpace(raw)
	if strings.HasPrefix(raw, "data:") {
		parts := strings.SplitN(raw, ",", 2)
		if len(parts) != 2 {
			return "", "", fmt.Errorf("data url format")
		}
		header := parts[0]
		payload = strings.TrimSpace(parts[1])
		if idx := strings.Index(header, ":"); idx >= 0 {
			mime = header[5:idx]
			if semi := strings.Index(mime, ";"); semi >= 0 {
				mime = mime[:semi]
			}
		}
		if payload == "" {
			return "", "", fmt.Errorf("empty payload")
		}
		return mime, payload, nil
	}
	switch imagebase64.Validate(raw) {
	case imagebase64.Invalid:
		return "", "", fmt.Errorf("invalid image")
	case imagebase64.TooLarge:
		return "", "", fmt.Errorf("image too large")
	}
	return "image/jpeg", raw, nil
}

func extFromMIME(mime string) string {
	switch strings.ToLower(strings.TrimSpace(mime)) {
	case "image/png":
		return ".png"
	case "image/webp":
		return ".webp"
	case "image/gif":
		return ".gif"
	default:
		return ".jpg"
	}
}

func (s *Store) pruneDir(dir string, keepRel []string) {
	keep := make(map[string]struct{}, len(keepRel))
	for _, rel := range keepRel {
		keep[filepath.Base(rel)] = struct{}{}
	}
	entries, err := os.ReadDir(dir)
	if err != nil {
		return
	}
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		if _, ok := keep[e.Name()]; !ok {
			_ = os.Remove(filepath.Join(dir, e.Name()))
		}
	}
}
