package handlers

import (
	"banking-ecommerce-api/middleware"
	"banking-ecommerce-api/repository"
	"banking-ecommerce-api/services"
	"encoding/json"
	"errors"
	"net/http"
)

func PurchaseProductHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusBadRequest)
		return
	}

	var req struct {
		AccountID string `json:"account_id"`
		ProductID string `json:"product_id"`
		Quantity  int    `json:"quantity"`
	}

	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json", http.StatusBadRequest)
		return
	}

	if req.Quantity <= 0 {
		http.Error(w, "Invalid quantity", http.StatusBadRequest)
		return
	}

	account, err := repository.GetAccountByID(r.Context(), req.AccountID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Account not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load account", http.StatusInternalServerError)
		return
	}

	if account.UserID != claims.UserID {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if err := repository.PurchaseProduct(r.Context(), req.AccountID, req.ProductID, req.Quantity); err != nil {
		switch {
		case errors.Is(err, repository.ErrAccountNotFound):
			http.Error(w, "Account not found", http.StatusNotFound)
			return
		case errors.Is(err, repository.ErrProductNotFound):
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		case errors.Is(err, repository.ErrProductOutOfStock):
			http.Error(w, "Not enough stock available", http.StatusBadRequest)
			return
		case errors.Is(err, repository.ErrInsufficientBalance):
			http.Error(w, "Insufficient balance", http.StatusBadRequest)
			return
		default:
			http.Error(w, "Purchase failed", http.StatusInternalServerError)
			return
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Purchase successful",
	})
}

func GetPurchaseHistoryHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid method", http.StatusBadRequest)
		return
	}

	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
	transactions, err := repository.GetTransactionsByUserID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, "Failed to fetch purchase history", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}
