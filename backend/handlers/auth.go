package handlers

import (
	"banking-ecommerce-api/middleware"
	"banking-ecommerce-api/repository"
	"banking-ecommerce-api/services"
	"banking-ecommerce-api/utils"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"time"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Register handler called")
	var req struct {
		Username string `json:"username"`
		Email    string `json:"email"`
		Password string `json:"password"`
		FullName string `json:"full_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json format", http.StatusBadRequest)
		return
	}

	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	if !utils.IsValidEmail(req.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 6 {
		http.Error(w, "Password must be at least 6 characters", http.StatusBadRequest)
		return
	}

	exists, err := repository.UserExists(r.Context(), req.Username, req.Email)
	if err != nil {
		http.Error(w, "Failed to verify user uniqueness", http.StatusInternalServerError)
		return
	}

	if exists {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	}

	passwordHash := utils.HashPassword(req.Password)
	user := repository.User{
		ID:           utils.GenerateUserID(),
		Username:     req.Username,
		Email:        req.Email,
		PasswordHash: passwordHash,
		FullName:     req.FullName,
		Role:         "user",
		CreatedAt:    time.Now(),
		LastLogin:    time.Time{},
	}

	if err := repository.CreateUser(r.Context(), user); err != nil {
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{"message": "registered"})
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Provide credentials", http.StatusBadRequest)
		return
	}

	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json format", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	if !utils.IsValidEmail(req.Email) {
		http.Error(w, "Invalid email format", http.StatusBadRequest)
		return
	}

	user, err := repository.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			http.Error(w, "Could not find any user", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to fetch user", http.StatusInternalServerError)
		return
	}

	if !utils.VerifyPassword(req.Password, user.PasswordHash) {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	lastLogin := time.Now()
	if err := repository.UpdateUserLastLogin(r.Context(), user.ID, lastLogin); err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	token, err := services.GenerateJWT(user.ID, user.Role)
	if err != nil {
		if errors.Is(err, services.ErrJWTSecretNotConfigured) {
			http.Error(w, "Authentication service misconfigured", http.StatusInternalServerError)
			return
		}
		http.Error(w, "Could not issue token", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"token":   token,
		"message": "login successful",
	})
}

func ProfileHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

	user, err := repository.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load profile", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}
