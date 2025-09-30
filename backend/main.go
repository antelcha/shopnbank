package main

import (
	appconfig "banking-ecommerce-api/config"
	"banking-ecommerce-api/handlers"
	"banking-ecommerce-api/middleware"
	"banking-ecommerce-api/repository"
	"banking-ecommerce-api/utils"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awsconfig "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/dynamodb"
)

func createDemoProducts(ctx context.Context) error {
	// Check if products already exist
	products, err := repository.GetAllProducts(ctx)
	if err != nil {
		return err
	}

	// If products already exist, skip creation
	if len(products) > 0 {
		log.Println("Demo products already exist, skipping creation")
		return nil
	}

	log.Println("Creating 100 demo products...")

	demoProducts := []struct {
		name        string
		description string
		price       int64
		stock       int
	}{
		{"Wireless Headphones", "Premium noise-cancelling headphones with 30-hour battery life", 29900, 150},
		{"Smart Watch", "Fitness tracker with heart rate monitor and GPS", 19900, 200},
		{"Laptop Stand", "Ergonomic aluminum laptop stand for better posture", 4900, 300},
		{"USB-C Hub", "7-in-1 USB-C hub with HDMI, USB 3.0, and SD card reader", 3900, 250},
		{"Mechanical Keyboard", "RGB backlit mechanical keyboard with blue switches", 12900, 180},
		{"Gaming Mouse", "High-precision gaming mouse with customizable RGB", 6900, 220},
		{"Webcam 1080p", "Full HD webcam with auto-focus and built-in microphone", 7900, 175},
		{"Phone Case", "Durable protective case with shock absorption", 2900, 500},
		{"Screen Protector", "Tempered glass screen protector 9H hardness", 1500, 600},
		{"Wireless Charger", "Fast wireless charging pad Qi-certified", 3400, 400},
		{"Power Bank", "20000mAh portable power bank with dual USB ports", 5900, 280},
		{"Bluetooth Speaker", "Portable waterproof speaker with 360° sound", 8900, 190},
		{"Cable Organizer", "Desk cable management system - 5 pack", 1900, 450},
		{"Laptop Sleeve", "Padded laptop sleeve 13-15 inch compatible", 2400, 320},
		{"Desk Lamp", "LED desk lamp with adjustable brightness and color", 4500, 210},
		{"Mouse Pad", "Large gaming mouse pad with non-slip base", 1800, 550},
		{"Webcam Cover", "Privacy webcam cover slider - 3 pack", 900, 700},
		{"Phone Stand", "Adjustable phone stand for desk", 1200, 480},
		{"Tablet Stand", "Foldable tablet stand for reading and video", 2800, 350},
		{"Monitor Arm", "Single monitor arm with gas spring adjustment", 9900, 140},
		{"Earbuds", "True wireless earbuds with charging case", 7900, 260},
		{"Smart Plug", "WiFi smart plug with voice control", 2400, 380},
		{"LED Strip", "5m RGB LED strip with remote control", 3900, 290},
		{"Web Camera Light", "Ring light for webcam and video calls", 3200, 310},
		{"Microphone", "USB condenser microphone for podcasting", 11900, 160},
		{"Laptop Bag", "Professional laptop backpack with USB port", 6900, 240},
		{"Graphics Tablet", "Digital drawing tablet with pen", 8900, 170},
		{"External SSD", "500GB portable external SSD USB 3.1", 7900, 200},
		{"USB Flash Drive", "128GB USB 3.0 flash drive", 2900, 450},
		{"HDMI Cable", "4K HDMI cable 2m braided", 1500, 600},
		{"Phone Grip", "Collapsible phone grip and stand", 800, 800},
		{"Laptop Cooling Pad", "Laptop cooling pad with 5 fans", 4900, 220},
		{"Surge Protector", "8-outlet surge protector with USB ports", 3900, 280},
		{"Cable Clips", "Adhesive cable clips - 20 pack", 1200, 500},
		{"Desk Organizer", "Bamboo desk organizer with phone stand", 3400, 270},
		{"Monitor Light Bar", "LED monitor light bar with auto-dimming", 8900, 150},
		{"Keyboard Wrist Rest", "Memory foam keyboard wrist rest", 2400, 360},
		{"Mouse Wrist Rest", "Ergonomic mouse wrist rest with gel", 1800, 420},
		{"Laptop Privacy Screen", "14 inch laptop privacy filter", 4900, 190},
		{"Docking Station", "USB-C docking station 11-in-1", 15900, 130},
		{"Portable Monitor", "15.6 inch portable monitor Full HD", 24900, 110},
		{"Stylus Pen", "Universal capacitive stylus pen", 2400, 390},
		{"Screen Cleaning Kit", "Screen cleaning solution and microfiber cloth", 1500, 520},
		{"Cable Sleeve", "Cable management sleeve 1.5m", 1900, 440},
		{"Laptop Lock", "Security cable lock for laptops", 2900, 310},
		{"USB Extension Cable", "USB 3.0 extension cable 3m", 1800, 480},
		{"Audio Splitter", "3.5mm audio splitter for headphones", 900, 650},
		{"Bluetooth Adapter", "USB Bluetooth 5.0 adapter for PC", 1500, 510},
		{"Card Reader", "SD card reader USB 3.0", 1200, 560},
		{"Phone Tripod", "Flexible phone tripod with remote", 2900, 340},
		{"Laptop Fan", "External laptop cooling fan", 2400, 370},
		{"Cable Tester", "Network cable tester RJ45", 3400, 250},
		{"Laptop Battery", "Replacement laptop battery universal", 6900, 180},
		{"Wireless Keyboard", "Slim wireless keyboard and mouse combo", 4900, 230},
		{"Gaming Headset", "7.1 surround sound gaming headset", 8900, 190},
		{"VR Headset", "Virtual reality headset smartphone compatible", 5900, 160},
		{"Action Camera", "4K action camera waterproof", 14900, 120},
		{"Ring Light", "10 inch ring light with tripod", 4900, 210},
		{"Green Screen", "Collapsible green screen background", 6900, 170},
		{"Laptop Skin", "Vinyl laptop skin decal custom", 1900, 430},
		{"Phone Lens Kit", "3-in-1 clip-on phone camera lens", 3400, 280},
		{"Selfie Stick", "Bluetooth selfie stick with remote", 2400, 360},
		{"Gimbal Stabilizer", "3-axis smartphone gimbal stabilizer", 11900, 140},
		{"Streaming Deck", "Programmable stream deck 6 keys", 9900, 150},
		{"Capture Card", "HD capture card for streaming", 16900, 110},
		{"USB Microphone", "Cardioid USB microphone for streaming", 7900, 180},
		{"Pop Filter", "Microphone pop filter double layer", 1500, 470},
		{"Mic Arm", "Adjustable microphone boom arm", 3900, 240},
		{"Studio Headphones", "Professional studio monitor headphones", 9900, 160},
		{"Audio Interface", "2-channel USB audio interface", 12900, 130},
		{"MIDI Keyboard", "25-key MIDI keyboard controller", 8900, 150},
		{"Guitar Cable", "10ft guitar cable gold-plated", 1900, 410},
		{"Drum Pad", "Electronic drum pad practice pad", 6900, 170},
		{"Tuner", "Clip-on chromatic tuner for guitar", 1500, 490},
		{"Capo", "Quick-change guitar capo", 1200, 540},
		{"Guitar Picks", "Guitar picks variety pack - 100 pieces", 1500, 600},
		{"Music Stand", "Folding music stand portable", 2900, 300},
		{"Instrument Cable", "XLR cable balanced audio 10ft", 2400, 350},
		{"Metronome", "Digital metronome with tuner", 2900, 320},
		{"Acoustic Foam", "Studio acoustic foam panels 12 pack", 4900, 200},
		{"DJ Controller", "2-channel DJ controller with pads", 24900, 90},
		{"Turntable", "Belt-drive turntable with USB", 19900, 100},
		{"Monitor Speakers", "Active studio monitor speakers pair", 29900, 85},
		{"Subwoofer", "8 inch powered subwoofer", 19900, 95},
		{"Soundbar", "2.1 channel soundbar with wireless subwoofer", 14900, 120},
		{"AV Receiver", "5.1 channel AV receiver with HDMI", 34900, 75},
		{"Bluetooth Transmitter", "Bluetooth transmitter and receiver", 2900, 330},
		{"Vinyl Record Cleaner", "Record cleaning kit with brush", 2400, 360},
		{"DJ Headphones", "Professional DJ headphones closed-back", 11900, 140},
		{"Instrument Tuner", "Pedal tuner for guitar and bass", 8900, 150},
		{"Direct Box", "Passive direct box DI for instruments", 4900, 210},
		{"Cable Pack", "Instrument cable pack 3 cables", 4500, 220},
		{"Patch Cables", "Patch cable pack for pedals 5 pack", 2900, 310},
		{"Looper Pedal", "Guitar looper pedal with effects", 14900, 110},
		{"Distortion Pedal", "Classic distortion guitar pedal", 7900, 170},
		{"Delay Pedal", "Digital delay guitar pedal", 9900, 140},
		{"Reverb Pedal", "Hall reverb guitar effect pedal", 8900, 150},
		{"Compressor Pedal", "Dynamic compressor guitar pedal", 10900, 130},
		{"Wah Pedal", "Classic wah guitar effect pedal", 11900, 120},
	}

	for i, p := range demoProducts {
		product := repository.Product{
			ID:          utils.GenerateUserID(),
			Name:        p.name,
			Description: p.description,
			Price:       p.price,
			Stock:       p.stock,
			CreatedAt:   time.Now(),
		}

		if err := repository.CreateProduct(ctx, product); err != nil {
			log.Printf("warning: failed to create product %d: %v", i+1, err)
			continue
		}
	}

	log.Println("Successfully created 100 demo products")
	return nil
}

func createAdminUser(ctx context.Context) error {
	adminEmail := appconfig.GetEnv("ADMIN_EMAIL", "")
	adminUsername := appconfig.GetEnv("ADMIN_USERNAME", "")
	adminPassword := appconfig.GetEnv("ADMIN_PASSWORD", "")
	adminFullName := appconfig.GetEnv("ADMIN_FULLNAME", "")

	if adminEmail == "" || adminUsername == "" || adminPassword == "" || adminFullName == "" {
		return nil
	}

	exists, err := repository.UserExists(ctx, "", adminEmail)
	if err != nil {
		return err
	}

	if exists {
		return nil
	}

	passwordHash := utils.HashPassword(adminPassword)
	admin := repository.User{
		ID:           utils.GenerateUserID(),
		Username:     adminUsername,
		Email:        adminEmail,
		PasswordHash: passwordHash,
		FullName:     adminFullName,
		Role:         "admin",
		CreatedAt:    time.Now(),
		LastLogin:    time.Time{},
	}

	return repository.CreateUser(ctx, admin)
}

type customResolver struct {
    endpoint string
}

func (c customResolver) ResolveEndpoint(service, region string, options ...interface{}) (aws.Endpoint, error) {
    if service == dynamodb.ServiceID {
        return aws.Endpoint{
            URL:           c.endpoint,
            SigningRegion: region,
        }, nil
    }
    return aws.Endpoint{}, &aws.EndpointNotFoundError{}
}


func main() {
	appconfig.LoadEnv()

	ctx := context.Background()
	dynCfg := appconfig.GetDynamoConfig()

	loadOptions := []func(*awsconfig.LoadOptions) error{
		awsconfig.WithRegion(dynCfg.Region),
	}

	if dynCfg.Endpoint != "" {
		resolver := customResolver{endpoint: dynCfg.Endpoint}
		loadOptions = append(loadOptions, awsconfig.WithEndpointResolverWithOptions(resolver))
	}
	
	

	cfg, err := awsconfig.LoadDefaultConfig(ctx, loadOptions...)
	if err != nil {
		log.Fatalf("failed to load AWS configuration: %v", err)
	}

	dynamoClient := dynamodb.NewFromConfig(cfg)
	repository.SetDynamoDBClient(dynamoClient)

	if err := repository.EnsureTables(ctx); err != nil {
		log.Fatalf("failed to ensure DynamoDB tables: %v", err)
	}

	if err := createAdminUser(ctx); err != nil {
		log.Fatalf("failed to ensure admin user: %v", err)
	}

	if err := createDemoProducts(ctx); err != nil {
		log.Printf("warning: failed to create demo products: %v", err)
	}

	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})
	http.HandleFunc("/auth/register", middleware.CORSMiddleWare(middleware.RateLimitMiddleware("auth", 3, 20*time.Second)(handlers.RegisterHandler)))
	http.HandleFunc("/auth/login", middleware.CORSMiddleWare(middleware.RateLimitMiddleware("auth", 5, 12*time.Second)(handlers.LoginHandler)))
	http.HandleFunc("/profile", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.ProfileHandler)))
	http.HandleFunc("/accounts/", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.GetAccountsByUserIDHandler)))
	http.HandleFunc("/accounts", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.AccountsHandler)))
	http.HandleFunc("/transfer", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.TransferMoneyHandler)))
	http.HandleFunc("/deposit", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.DepositMoney)))
	http.HandleFunc("/products", middleware.CORSMiddleWare(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handlers.ProductsHandler(w, r)
		} else {
			middleware.AdminMiddleware(handlers.ProductsHandler)(w, r)
		}
	}))
	http.HandleFunc("/products/", middleware.CORSMiddleWare(func(w http.ResponseWriter, r *http.Request) {
		if r.Method == "GET" {
			handlers.ProductHandler(w, r)
		} else {
			middleware.AdminMiddleware(handlers.ProductHandler)(w, r)
		}
	}))

	http.HandleFunc("/purchase", middleware.CORSMiddleWare(middleware.RateLimitMiddleware("purchase", 10, 6*time.Second)(middleware.AuthMiddleware(handlers.PurchaseProductHandler))))
	http.HandleFunc("/purchases", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.GetPurchaseHistoryHandler)))
	http.HandleFunc("/users", middleware.CORSMiddleWare(middleware.AuthMiddleware(handlers.GetAllUsersHandler)))

	log.Println("HTTP server listening on :8080")
	if err := http.ListenAndServe(":8080", nil); err != nil {
		log.Fatalf("server stopped: %v", err)
	}
}
