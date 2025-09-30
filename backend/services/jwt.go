package services

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"banking-ecommerce-api/config"
)

type Claims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	Exp    int64  `json:"exp"`
}

var (
	jwtSecretOnce sync.Once
	jwtSecret     []byte
	jwtSecretErr  error
)

const jwtSecretEnvKey = "JWT_SECRET"

var ErrJWTSecretNotConfigured = errors.New("jwt secret not configured")

func loadJWTSecret() {
	secret := config.GetEnv(jwtSecretEnvKey, "")
	if secret == "" {
		jwtSecretErr = ErrJWTSecretNotConfigured
		return
	}
	jwtSecret = []byte(secret)
}

func getJWTSecret() ([]byte, error) {
	jwtSecretOnce.Do(loadJWTSecret)
	return jwtSecret, jwtSecretErr
}

func GenerateJWT(userId, role string) (string, error) {
	secret, err := getJWTSecret()
	if err != nil {
		return "", err
	}

	headerBytes, err := json.Marshal(map[string]string{
		"alg": "HS256",
		"typ": "JWT",
	})
	if err != nil {
		return "", fmt.Errorf("failed to marshal JWT header: %w", err)
	}
	headerB64 := base64.RawURLEncoding.EncodeToString(headerBytes)

	exp := time.Now().Add(24 * time.Hour).Unix()
	payloadBytes, err := json.Marshal(Claims{
		UserID: userId,
		Role:   role,
		Exp:    exp,
	})
	if err != nil {
		return "", fmt.Errorf("failed to marshal JWT payload: %w", err)
	}
	payloadB64 := base64.RawURLEncoding.EncodeToString(payloadBytes)

	message := headerB64 + "." + payloadB64
	h := hmac.New(sha256.New, secret)
	h.Write([]byte(message))
	signature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	token := headerB64 + "." + payloadB64 + "." + signature
	return token, nil
}

func ValidateJWT(tokenString string) (*Claims, error) {
	secret, err := getJWTSecret()
	if err != nil {
		return nil, err
	}

	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return nil, fmt.Errorf("invalid token format")
	}

	message := parts[0] + "." + parts[1]
	h := hmac.New(sha256.New, secret)
	h.Write([]byte(message))
	expectedSignature := base64.RawURLEncoding.EncodeToString(h.Sum(nil))

	if parts[2] != expectedSignature {
		return nil, fmt.Errorf("invalid signature")
	}

	payloadBytes, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return nil, fmt.Errorf("invalid payload")
	}

	var claims Claims
	err = json.Unmarshal(payloadBytes, &claims)
	if err != nil {
		return nil, fmt.Errorf("invalid claims")
	}

	if time.Now().Unix() > claims.Exp {
		return nil, fmt.Errorf("token expired")
	}

	return &claims, nil
}
