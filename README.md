# Shop'n'Bank

A full-stack banking and e-commerce application built with Go and React TypeScript. This project demonstrates the implementation of financial transactions, inventory management, and user authentication in a web application.

## About

This is a learning project focused on understanding REST API development with Go's standard library and building modern web interfaces with React TypeScript. The application combines banking operations with e-commerce functionality to explore transaction safety, state management, and secure authentication patterns.

## Features

### Banking Operations
- Account creation and management
- Inter-user money transfers with atomic transactions
- Account balance tracking and deposits
- Multi-account support per user

### E-Commerce
- Product catalog with 100 demo items
- Inventory management and stock tracking
- Purchase transactions with account balance deduction
- Transaction history and receipts
- Admin product management interface

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (user/admin)
- Protected API endpoints
- Session validation and token refresh
- Password hashing with bcrypt

## Tech Stack

### Backend
- **Language:** Go 1.23
- **Database:** AWS DynamoDB
- **Authentication:** JWT tokens with bcrypt password hashing
- **HTTP Server:** Go standard library (`net/http`)
- **Architecture:** Repository pattern with clean separation of concerns

**Implementation Details:**
- Atomic transactions using DynamoDB TransactWriteItems
- Custom middleware for authentication, CORS, and rate limiting
- Context-based request handling for timeouts and cancellation
- Error handling with custom error types and wrapping

### Frontend
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS v4
- **Build Tool:** Vite
- **Icons:** Lucide React

**Implementation Details:**
- Type-safe API service layer
- Protected route wrapper components
- Token validation and automatic expiration handling
- Responsive design with mobile-first approach
- Form validation and error state management

## 📦 Project Structure

```
shopnbank/
├── backend/                 # Go backend
│   ├── config/             # Environment configuration
│   ├── handlers/           # HTTP handlers
│   ├── middleware/         # Auth, CORS, rate limiting
│   ├── repository/         # Data access layer (DynamoDB)
│   ├── services/           # Business logic (JWT)
│   ├── utils/              # Helper functions
│   ├── main.go            # Entry point
│   ├── .env.example       # Environment variables template
│   └── go.mod             # Go dependencies
│
└── frontend/              # React frontend
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/        # Page components
    │   ├── services/     # API services
    │   └── utils/        # Helper functions
    ├── package.json
    └── vite.config.ts
```

## 🚀 Getting Started

### Prerequisites
- Go 1.23+
- Node.js 18+
- DynamoDB Local (for development)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   go mod download
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start DynamoDB Local** (optional, for local development)
   ```bash
   # Download and run DynamoDB Local
   # https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
   ```

5. **Run the server**
   ```bash
   go run main.go
   ```

   Server will start on `http://localhost:8080`

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run development server**
   ```bash
   npm run dev
   ```

   Frontend will start on `http://localhost:5173`

## 🔧 Environment Variables

### Backend (.env)
```env
# Admin User
ADMIN_USERNAME=admin
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_FULLNAME=System Administrator

# JWT Secret (change for production)
JWT_SECRET=your-secret-key-here

# AWS Configuration
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=dummy          # For local DynamoDB
AWS_SECRET_ACCESS_KEY=dummy       # For local DynamoDB

# DynamoDB (remove for production AWS)
DYNAMODB_ENDPOINT=http://localhost:8000
```

## 📱 Features Demo

### User Features
- Create account and login
- Create multiple bank accounts
- Deposit money to accounts
- Transfer money to other users
- Browse and search products
- Purchase products with account balance
- View purchase history

### Admin Features
- All user features
- Add new products
- Manage product inventory

## Architecture

### Backend Design
The backend follows a layered architecture pattern:

- **Handlers Layer:** HTTP request/response handling, input validation
- **Service Layer:** Business logic, JWT token management
- **Repository Layer:** Data access abstraction, DynamoDB operations
- **Middleware:** Cross-cutting concerns (authentication, CORS, rate limiting)

**Key Patterns:**
- Uses DynamoDB TransactWriteItems for ACID-compliant operations
- Stateless design enables horizontal scaling
- Context propagation for request lifecycle management
- Optimistic locking prevents race conditions at the database level

### Frontend Design
The frontend is organized into a component-based architecture:

- **Pages:** Route-level components with data fetching
- **Components:** Reusable UI components
- **Services:** API communication layer
- **Utils:** Helper functions and utilities

**Key Patterns:**
- Protected routes with authentication checks
- Centralized API service with interceptors
- Token validation wrapper component
- Responsive design with Tailwind utilities

## 🧪 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /profile` - Get user profile (protected)

### Accounts
- `GET /accounts` - Get user's accounts (protected)
- `POST /accounts` - Create new account (protected)
- `GET /accounts/{user_id}` - Get accounts by user ID (protected)

### Transactions
- `POST /transfer` - Transfer money (protected)
- `POST /deposit` - Deposit money (protected)

### Products
- `GET /products` - Get all products
- `POST /products` - Create product (admin only)
- `GET /products/{id}` - Get product by ID

### Shopping
- `POST /purchase` - Purchase product (protected)
- `GET /purchases` - Get purchase history (protected)

### Users
- `GET /users` - Get all users (protected)

## 🎨 Design Features

- **Typography:** Lyon Display (serif) + Inter (sans-serif)
- **Color Scheme:** Dark theme with gradient accents
- **Responsive:** Mobile-first design with bottom navigation
- **Animations:** Smooth transitions and hover effects
- **Accessibility:** Semantic HTML and ARIA labels

## Learning Outcomes

This project was built to gain practical experience with:

**Backend Development:**
- Building REST APIs with Go's standard library
- Implementing transaction safety in financial applications
- Working with NoSQL databases (DynamoDB)
- Middleware patterns and HTTP interceptors
- JWT authentication and authorization flows

**Frontend Development:**
- Building type-safe React applications with TypeScript
- State management and API integration
- Responsive UI design and mobile-first approach
- Protected routing and authentication flows
- Form handling and validation patterns

**System Design:**
- Designing stateless, scalable architectures
- Understanding ACID properties in distributed systems
- Implementing role-based access control
- Managing concurrent operations safely

## License

MIT License - This project is open source and available for learning purposes.

## Notes

This is a learning project built to understand full-stack development patterns. It demonstrates concepts and implementations commonly found in production applications but is intended for educational purposes.