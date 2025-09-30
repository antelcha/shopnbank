# Product Requirements Document (PRD)
## Banking + E-Commerce REST API

### Overview
A REST API system combining banking functionality with e-commerce features built in Go using only the standard library. Users can manage bank accounts, transfer money between accounts, purchase products with inventory management, and view comprehensive transaction history. This project serves as a learning platform for understanding Go REST API fundamentals with focus on financial systems and inventory management for interview preparation.

### Core Features

#### 1. User Management
- User registration and authentication
- JWT token-based authentication
- User profile management
- Secure password handling

#### 2. Banking System
- Multiple bank accounts per user
- Account balance management
- Money transfers between users
- Transaction history
- Balance inquiries
- Account creation and management

#### 3. E-Commerce System
- Product catalog management
- Stock/inventory tracking
- Product purchase functionality
- Stock deduction on purchase
- Purchase history
- Product availability checking

#### 4. Transaction Management
- Comprehensive transaction logging
- Transfer transaction records
- Purchase transaction records
- Transaction history per user
- Transaction status tracking

### API Endpoints

#### Authentication
```
POST   /auth/register       - User registration
POST   /auth/login          - User login
POST   /auth/logout         - User logout
GET    /auth/me             - Get current user info
```

#### Banking
```
POST   /accounts            - Create new bank account
GET    /accounts            - List user's accounts
GET    /accounts/{id}       - Get account details
PUT    /accounts/{id}       - Update account details
DELETE /accounts/{id}       - Close account

POST   /transfers           - Transfer money between users
GET    /transfers           - Get user's transfer history
GET    /transfers/{id}      - Get transfer details
```

#### E-Commerce
```
GET    /products            - List all products
GET    /products/{id}       - Get product details
POST   /products            - Create product (admin only)
PUT    /products/{id}       - Update product (admin only)
DELETE /products/{id}       - Delete product (admin only)

POST   /purchases           - Purchase a product
GET    /purchases           - Get user's purchase history
GET    /purchases/{id}      - Get purchase details
```

#### Transactions
```
GET    /transactions        - Get all user transactions (transfers + purchases)
GET    /transactions/{id}   - Get transaction details
```

### Data Models

#### User
- ID (uuid)
- Username (string)
- Email (string)
- Password Hash (string)
- Full Name (string)
- Role (enum: user, admin)
- Created At (time.Time)
- Last Login (time.Time)

#### Account
- ID (uuid)
- User ID (uuid)
- Account Name (string)
- Balance (decimal - using int64 for cents to avoid float issues)
- Currency (string, default: "USD")
- Account Type (enum: checking, savings)
- Created At (time.Time)
- Updated At (time.Time)

#### Product
- ID (uuid)
- Name (string)
- Description (string)
- Price (decimal - using int64 for cents)
- Stock Quantity (int)
- Category (string)
- Created At (time.Time)
- Updated At (time.Time)

#### Transfer
- ID (uuid)
- From Account ID (uuid)
- To Account ID (uuid)
- Amount (decimal - using int64 for cents)
- Description (string)
- Status (enum: pending, completed, failed)
- Created At (time.Time)
- Completed At (time.Time)

#### Purchase
- ID (uuid)
- User ID (uuid)
- Account ID (uuid)
- Product ID (uuid)
- Quantity (int)
- Unit Price (decimal)
- Total Amount (decimal)
- Status (enum: pending, completed, failed)
- Created At (time.Time)
- Completed At (time.Time)

#### Transaction (Combined view)
- ID (uuid)
- User ID (uuid)
- Type (enum: transfer, purchase)
- Amount (decimal)
- Description (string)
- Status (enum: pending, completed, failed)
- Reference ID (uuid - links to Transfer or Purchase)
- Created At (time.Time)

### Technical Requirements
- Use Go standard library only (no external frameworks)
- JWT token implementation using standard crypto packages
- Proper HTTP routing implementation
- JSON request/response handling
- Comprehensive input validation
- Error handling with appropriate HTTP status codes
- In-memory data storage with proper concurrency control
- Transaction safety with mutex/locking
- Proper logging system
- Unit tests for core functionality
- Decimal precision for financial calculations (avoid floating point)

### Security Requirements
- Secure password hashing (bcrypt)
- JWT token-based authentication
- Protected routes requiring authentication
- User can only access own accounts and transactions
- Admin role for product management
- Input sanitization and validation
- Rate limiting considerations
- Proper error messages without information leakage

### Business Rules
- Users can have multiple bank accounts
- Users can only transfer from their own accounts
- Users can only purchase if they have sufficient balance
- Stock must be available for purchase
- Stock decreases atomically with purchase
- All financial operations must be atomic
- Transaction history must be comprehensive and accurate
- Account balances must always be consistent

### Learning Goals
- Understanding financial system architecture
- Implementing secure authentication with JWT
- Managing concurrent access to shared resources
- Handling decimal precision in financial calculations
- Implementing transaction safety and ACID properties
- Understanding inventory management concepts
- Error handling in financial systems
- Testing financial and inventory logic

### Success Criteria
- All CRUD operations working correctly
- Secure authentication and authorization
- Atomic financial transactions
- Accurate inventory management
- Comprehensive transaction history
- Proper error handling and validation
- Thread-safe concurrent operations
- Clean, maintainable code architecture