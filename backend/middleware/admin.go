package middleware

import (
	"banking-ecommerce-api/services"
	"net/http"
)

func AdminMiddleware(next http.HandlerFunc) http.HandlerFunc {
	return AuthMiddleware(func(w http.ResponseWriter, r *http.Request) {
		claims := r.Context().Value(ClaimsKey).(*services.Claims)

		if claims.Role != "admin" {
			http.Error(w, "Admin access required", http.StatusForbidden)
			return
		}

		next(w, r)
	})
}
