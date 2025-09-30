package utils

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"regexp"
	"strconv"
	"time"
)

func IsValidEmail(email string) bool {
	emailRegex := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	re := regexp.MustCompile(emailRegex)
	return re.MatchString(email)
}

func HashPassword(password string) string {
	salt := make([]byte, 16)
	rand.Read(salt)

	hash := sha256.Sum256([]byte(password + hex.EncodeToString(salt)))
	return hex.EncodeToString(salt) + hex.EncodeToString(hash[:])
}

func VerifyPassword(password, hashedPassword string) bool {
	if len(hashedPassword) < 32 {
		return false
	}

	saltHex := hashedPassword[:32]
	storedHashHex := hashedPassword[32:]

	hash := sha256.Sum256([]byte(password + saltHex))
	computedHashHex := hex.EncodeToString(hash[:])
	return computedHashHex == storedHashHex
}

func GenerateUserID() string {
	return "user_" + strconv.FormatInt(time.Now().UnixNano(), 10)
}
