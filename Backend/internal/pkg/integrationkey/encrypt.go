package integrationkey

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"
)

// ErrDecrypt — shifrlangan qiymat bo‘sh yoki kalit/ma’lumot mos kelmaydi.
var ErrDecrypt = errors.New("shifrni ochib bo'lmadi")

func deriveKey(secret string) []byte {
	sum := sha256.Sum256([]byte(secret))
	return sum[:]
}

// EncryptString — AES-256-GCM, natija base64.
func EncryptString(plaintext, secret string) (string, error) {
	key := deriveKey(secret)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	sealed := gcm.Seal(nonce, nonce, []byte(plaintext), nil)
	return base64.StdEncoding.EncodeToString(sealed), nil
}

// DecryptString — EncryptString chiqishi.
func DecryptString(ciphertextB64, secret string) (string, error) {
	if ciphertextB64 == "" {
		return "", ErrDecrypt
	}
	data, err := base64.StdEncoding.DecodeString(ciphertextB64)
	if err != nil {
		return "", err
	}
	key := deriveKey(secret)
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(data) < gcm.NonceSize() {
		return "", ErrDecrypt
	}
	nonce, ct := data[:gcm.NonceSize()], data[gcm.NonceSize():]
	plain, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", err
	}
	return string(plain), nil
}
