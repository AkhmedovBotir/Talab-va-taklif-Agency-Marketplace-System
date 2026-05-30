package imagebase64

import "strings"

// MaxPayloadLen — bitta rasm uchun base64 qismidagi maksimal belgilar (~3 MB fayl).
const MaxPayloadLen = 4 * 1024 * 1024

type Result int

const (
	OK Result = iota
	Invalid
	TooLarge
)

// Validate — data: URL qabul qiladi; to‘liq decode qilinmaydi (tez).
func Validate(raw string) Result {
	payload := strings.TrimSpace(raw)
	if strings.HasPrefix(payload, "data:") {
		parts := strings.SplitN(payload, ",", 2)
		if len(parts) != 2 || strings.TrimSpace(parts[1]) == "" {
			return Invalid
		}
		payload = strings.TrimSpace(parts[1])
	}
	if payload == "" {
		return Invalid
	}
	if len(payload) > MaxPayloadLen {
		return TooLarge
	}
	if !isValidPayload(payload) {
		return Invalid
	}
	return OK
}

func isValidPayload(s string) bool {
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
