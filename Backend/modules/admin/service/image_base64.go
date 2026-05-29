package service

import "strings"

// maxImageBase64PayloadLen — base64 qismidagi maksimal belgilar (100 GiB).
const maxImageBase64PayloadLen = 100 * 1024 * 1024 * 1024

type imageBase64Validation int

const (
	imageBase64OK imageBase64Validation = iota
	imageBase64Invalid
	imageBase64TooLarge
)

// validateImageBase64 — har qanday data: MIME; piksel/hajm cheklovi yo‘q; max 100 GiB base64.
// To‘liq decode qilinmaydi (katta fayllar uchun xavfsiz).
func validateImageBase64(raw string) imageBase64Validation {
	payload := strings.TrimSpace(raw)
	if strings.HasPrefix(payload, "data:") {
		parts := strings.SplitN(payload, ",", 2)
		if len(parts) != 2 || strings.TrimSpace(parts[1]) == "" {
			return imageBase64Invalid
		}
		payload = strings.TrimSpace(parts[1])
	}
	if payload == "" {
		return imageBase64Invalid
	}
	if int64(len(payload)) > maxImageBase64PayloadLen {
		return imageBase64TooLarge
	}
	if !isValidBase64Payload(payload) {
		return imageBase64Invalid
	}
	return imageBase64OK
}

func isValidBase64Payload(s string) bool {
	n := len(s)
	if n == 0 || n%4 != 0 {
		return false
	}
	padding := 0
	for i := n - 1; i >= 0 && s[i] == '='; i-- {
		padding++
	}
	if padding > 2 {
		return false
	}
	for i := 0; i < n-padding; i++ {
		switch s[i] {
		case 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
			'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
			'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
			'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
			'0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '/', '-', '_':
		default:
			return false
		}
	}
	return true
}
