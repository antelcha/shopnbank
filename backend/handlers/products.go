package handlers

import (
	"banking-ecommerce-api/repository"
	"banking-ecommerce-api/utils"
	"encoding/json"
	"errors"
	"net/http"
	"strings"
	"time"
)

func CreateProductHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Price       int64  `json:"price"`
		Stock       int    `json:"stock"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Price <= 0 || req.Stock <= 0 {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	product := repository.Product{
		ID:          utils.GenerateUserID(),
		Name:        req.Name,
		Description: req.Description,
		Price:       req.Price,
		Stock:       req.Stock,
		CreatedAt:   time.Now(),
	}

	if err := repository.CreateProduct(r.Context(), product); err != nil {
		http.Error(w, "Failed to create product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&product)
}

func GetProductsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Invalid method", http.StatusBadRequest)
		return
	}

	products, err := repository.GetAllProducts(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch products", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(products)
}

func UpdateProductHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPut {
		http.Error(w, "Invalid method", http.StatusBadRequest)
		return
	}

	productID := strings.TrimPrefix(r.URL.Path, "/products/")
	if productID == "" {
		http.Error(w, "Product ID required", http.StatusBadRequest)
		return
	}

	product, err := repository.GetProductByID(r.Context(), productID)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load product", http.StatusInternalServerError)
		return
	}

	var req struct {
		Name        string `json:"name"`
		Description string `json:"description"`
		Price       int64  `json:"price"`
		Stock       int    `json:"stock"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid json", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Price <= 0 || req.Stock < 0 {
		http.Error(w, "Invalid product data", http.StatusBadRequest)
		return
	}

	product.Name = req.Name
	product.Description = req.Description
	product.Price = req.Price
	product.Stock = req.Stock

	if err := repository.UpdateProduct(r.Context(), product); err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to update product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&product)
}

func ProductsHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetProductsHandler(w, r)
	case http.MethodPost:
		CreateProductHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func ProductHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		GetSingleProductHandler(w, r)
	case http.MethodPut:
		UpdateProductHandler(w, r)
	case http.MethodDelete:
		DeleteProductHandler(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func GetSingleProductHandler(w http.ResponseWriter, r *http.Request) {
	productID := strings.TrimPrefix(r.URL.Path, "/products/")
	if productID == "" {
		http.Error(w, "Product ID required", http.StatusBadRequest)
		return
	}

	product, err := repository.GetProductByID(r.Context(), productID)
	if err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to load product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(&product)
}

func DeleteProductHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Invalid method", http.StatusBadRequest)
		return
	}

	productID := strings.TrimPrefix(r.URL.Path, "/products/")
	if productID == "" {
		http.Error(w, "Product ID required", http.StatusBadRequest)
		return
	}

	if err := repository.DeleteProduct(r.Context(), productID); err != nil {
		if errors.Is(err, repository.ErrProductNotFound) {
			http.Error(w, "Product not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Failed to delete product", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Product deleted successfully",
	})
}
