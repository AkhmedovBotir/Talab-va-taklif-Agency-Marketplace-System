package domain

import "strings"

// AdminPermissionNames — frontend uchun tavsiya etilgan sahifa nomlari (faqat konstanta ro'yxat).
// API endpointlari ushbu ro'yxatga qarab ruxsat bermaydi yoki rad etmaydi.
var AdminPermissionNames = []string{
	"dashboard",
	"adminlar",
	"agentlar",
	"menejerlar",
	"punktlar",
	"hududlar",
	"kontragent turlari",
	"kontragentlar",
	"maxalla do'konlari",
	"hamkorlik so'rovi",
	"kategoriyalar",
	"mahsulotlar",
	"maxalla maxsulotlari shablonlari",
	"maxalla maxsulotlari",
	"marketplace foydalanuvchilari",
	"barcha buyurtmalar",
	"buyurtmalar monitoringgi",
	"kommentariya shablonlari",
	"kommentariyalar",
	"trankzasiyalar",
	"do'kon obunasi",
	"integratsiya kalitlari",
	"arxiv",
	"qr tizimi",
}

func AllAdminPermissions() []string {
	out := make([]string, len(AdminPermissionNames))
	copy(out, AdminPermissionNames)
	return out
}

// SanitizePermissionList — bo'sh va takroriy qiymatlarni olib tashlaydi; nomlarni tekshirmaydi.
func SanitizePermissionList(perms []string) []string {
	if len(perms) == 0 {
		return []string{}
	}
	seen := make(map[string]struct{}, len(perms))
	out := make([]string, 0, len(perms))
	for _, p := range perms {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if _, ok := seen[p]; ok {
			continue
		}
		seen[p] = struct{}{}
		out = append(out, p)
	}
	return out
}
