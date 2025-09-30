package middleware

import (
	"banking-ecommerce-api/services"
	"context"
	"errors"
	"net/http"
	"strings"
)

type contextKey string

const ClaimsKey contextKey = "claims"

func AuthMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header required", http.StatusUnauthorized)
			return
		}

		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Invalid auth header format", http.StatusUnauthorized)
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		claims, err := services.ValidateJWT(token)
		if err != nil {
			if errors.Is(err, services.ErrJWTSecretNotConfigured) {
				http.Error(w, "Authentication service unavailable", http.StatusInternalServerError)
				return
			}
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), ClaimsKey, claims)
		r = r.WithContext(ctx)

		next(w, r)
	}
}
