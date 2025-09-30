package handlers

import (
	"banking-ecommerce-api/middleware"
	"banking-ecommerce-api/repository"
	"banking-ecommerce-api/services"
	"banking-ecommerce-api/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

func CreateAccountHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		AccountName string `json:"account_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid arguments", http.StatusBadRequest)
		return
	}

	if req.AccountName == "" {
		http.Error(w, "Account name cannot be empty", http.StatusBadRequest)
		return
	}

	if len(req.AccountName) < 3 {
		http.Error(w, "Account name must be at least 3 characters", http.StatusBadRequest)
		return
	}

	if len(req.AccountName) > 50 {
		http.Error(w, "Account name cannot exceed 50 characters", http.StatusBadRequest)
		return
	}

	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

	account := repository.Account{
		ID:          utils.GenerateUserID(),
		UserID:      claims.UserID,
		AccountName: req.AccountName,
		Balance:     0,
		CreatedAt:   time.Now(),
	}

	if err := repository.CreateAccount(r.Context(), account); err != nil {
		http.Error(w, "Failed to create account", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&account)
}

func GetAccountsHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
	accounts, err := repository.GetAccountsByUserID(r.Context(), claims.UserID)
	if err != nil {
		http.Error(w, "Failed to fetch accounts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&accounts)
}

func GetAccountsByUserIDHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID := strings.TrimPrefix(r.URL.Path, "/accounts/")
	if userID == "" {
		http.Error(w, "User ID required", http.StatusBadRequest)
		return
	}

	if _, err := repository.GetUserByID(r.Context(), userID); err != nil {
		if errors.Is(err, repository.ErrUserNotFound) {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to validate user", http.StatusInternalServerError)
		return
	}

	accounts, err := repository.GetAccountsByUserID(r.Context(), userID)
	if err != nil {
		http.Error(w, "Failed to fetch accounts", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&accounts)
}

func AccountsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodPost:
		CreateAccountHandler(w, r)
	case http.MethodGet:
		GetAccountsHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func TransferMoneyHandler(w http.ResponseWriter, r *http.Request) {
	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)
	var req struct {
		FromAccountID string `json:"from_account_id"`
		ToAccountID   string `json:"to_account_id"`
		Amount        int64  `json:"amount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json", http.StatusBadRequest)
		return
	}

	if req.FromAccountID == req.ToAccountID {
		http.Error(w, "Self-transfer is not allowed", http.StatusBadRequest)
		return
	}

	fromAccount, err := repository.GetAccountByID(r.Context(), req.FromAccountID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Sender account doesn't exist", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load sender account", http.StatusInternalServerError)
		return
	}

	if fromAccount.UserID != claims.UserID {
		http.Error(w, "Unauthorized", http.StatusForbidden)
		return
	}

	toAccount, err := repository.GetAccountByID(r.Context(), req.ToAccountID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Receiver account doesn't exist", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load receiver account", http.StatusInternalServerError)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	if fromAccount.Balance < req.Amount {
		http.Error(w, "Insufficient balance", http.StatusBadRequest)
		return
	}

	if err := repository.TransferMoney(r.Context(), fromAccount.ID, toAccount.ID, req.Amount); err != nil {
		if errors.Is(err, repository.ErrInsufficientBalance) {
			http.Error(w, "Insufficient balance", http.StatusBadRequest)
			return
		}
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Account not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Transfer failed", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Transfer successful",
	})
}

func DepositMoney(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	claims := r.Context().Value(middleware.ClaimsKey).(*services.Claims)

	var req struct {
		AccountID string `json:"account_id"`
		Amount    int64  `json:"amount"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json", http.StatusBadRequest)
		return
	}

	account, err := repository.GetAccountByID(r.Context(), req.AccountID)
	if err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Bank account doesn't exist", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load account", http.StatusInternalServerError)
		return
	}

	if account.UserID != claims.UserID {
		http.Error(w, "Account id doesn't belong to current user", http.StatusUnauthorized)
		return
	}

	if req.Amount <= 0 {
		http.Error(w, "Invalid amount", http.StatusBadRequest)
		return
	}

	if err := repository.DepositMoney(r.Context(), req.AccountID, req.Amount); err != nil {
		if errors.Is(err, repository.ErrAccountNotFound) {
			http.Error(w, "Bank account doesn't exist", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to deposit money", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Deposit successful",
	})
}
