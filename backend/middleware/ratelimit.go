package middleware

import (
	"net/http"
	"sync"
	"time"
)

type TokenBucket struct {
	tokens     int
	maxTokens  int
	refillRate time.Duration
	lastRefill time.Time
	mu         sync.Mutex
}

func NewTokenBucket(maxTokens int, refillRate time.Duration) *TokenBucket {
	return &TokenBucket{
		tokens:     maxTokens,
		maxTokens:  maxTokens,
		refillRate: refillRate,
		lastRefill: time.Now(),
	}
}

func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastRefill)
	tokensToAdd := int(elapsed / tb.refillRate)

	if tokensToAdd > 0 {
		tb.tokens += tokensToAdd
		if tb.tokens > tb.maxTokens {
			tb.tokens = tb.maxTokens
		}
		tb.lastRefill = now
	}

	if tb.tokens > 0 {
		tb.tokens--
		return true
	}

	return false
}

type RateLimiter struct {
	visitors map[string]*TokenBucket
	mu       sync.RWMutex
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		visitors: make(map[string]*TokenBucket),
	}
}

func (rl *RateLimiter) GetBucket(ip string, maxRequests int, refillRate time.Duration) *TokenBucket {
	rl.mu.RLock()
	bucket, exists := rl.visitors[ip]
	rl.mu.RUnlock()

	if !exists {
		rl.mu.Lock()
		if bucket, exists = rl.visitors[ip]; !exists {
			bucket = NewTokenBucket(maxRequests, refillRate)
			rl.visitors[ip] = bucket
		}
		rl.mu.Unlock()
	}

	return bucket
}

func (rl *RateLimiter) CleanupOldEntries() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	for ip, bucket := range rl.visitors {
		bucket.mu.Lock()
		if time.Since(bucket.lastRefill) > 10*time.Minute {
			delete(rl.visitors, ip)
		}
		bucket.mu.Unlock()
	}
}

var (
	generalLimiter  = NewRateLimiter()
	authLimiter     = NewRateLimiter()
	purchaseLimiter = NewRateLimiter()
)

func init() {
	go func() {
		ticker := time.NewTicker(10 * time.Minute)
		defer ticker.Stop()

		for range ticker.C {
			generalLimiter.CleanupOldEntries()
			authLimiter.CleanupOldEntries()
			purchaseLimiter.CleanupOldEntries()
		}
	}()
}

func RateLimitMiddleware(limiterType string, maxRequests int, refillDuration time.Duration) func(http.HandlerFunc) http.HandlerFunc {
	return func(next http.HandlerFunc) http.HandlerFunc {
		return func(w http.ResponseWriter, r *http.Request) {
			ip := getClientIP(r)

			var bucket *TokenBucket
			switch limiterType {
			case "auth":
				bucket = authLimiter.GetBucket(ip, maxRequests, refillDuration)
			case "purchase":
				bucket = purchaseLimiter.GetBucket(ip, maxRequests, refillDuration)
			default:
				bucket = generalLimiter.GetBucket(ip, maxRequests, refillDuration)
			}

			if !bucket.Allow() {
				http.Error(w, "Rate limit exceeded. Try again later.", http.StatusTooManyRequests)
				return
			}

			next(w, r)
		}
	}
}

func getClientIP(r *http.Request) string {
	if xForwardedFor := r.Header.Get("X-Forwarded-For"); xForwardedFor != "" {
		return xForwardedFor
	}

	if xRealIP := r.Header.Get("X-Real-IP"); xRealIP != "" {
		return xRealIP
	}

	return r.RemoteAddr
}
