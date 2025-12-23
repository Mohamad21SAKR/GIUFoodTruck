# GIU Food-Truck System - API Documentation

## Overview
This document provides comprehensive documentation for all 21 API endpoints in the GIU Food-Truck System backend.

**Tech Stack:**
- Node.js + Express
- PostgreSQL + Knex Query Builder
- Session-based Authentication

**Base URL:** `http://localhost:3001`

---

## Authentication

Most endpoints require authentication via session cookie. After logging in, a `session_token` cookie is set automatically.

### Public Endpoints (No Authentication Required)
- `POST /api/v1/user` - Register
- `POST /api/v1/user/login` - Login

### Private Endpoints (Authentication Required)
All other endpoints require a valid session token cookie.

---

## API Endpoints Quick Reference

| # | Method | Endpoint | Access | Description |
|---|--------|----------|--------|-------------|
| 1 | GET | `/api/v1/trucks` | All | Get all available trucks |
| 2 | GET | `/api/v1/trucks/:truckId` | All | Get specific truck by ID |
| 3 | GET | `/api/v1/my-truck` | Owner | Get truck owned by current user |
| 4 | POST | `/api/v1/trucks` | Owner | Create a new truck |
| 5 | PUT | `/api/v1/trucks/:truckId` | Owner | Update own truck |
| 6 | GET | `/api/v1/trucks/:truckId/menu` | All | Get menu items for a truck |
| 7 | GET | `/api/v1/my-truck/menu` | Owner | Get menu for own truck |
| 8 | POST | `/api/v1/menu-items` | Owner | Add menu item |
| 9 | PUT | `/api/v1/menu-items/:itemId` | Owner | Update menu item |
| 10 | DELETE | `/api/v1/menu-items/:itemId` | Owner | Delete menu item |
| 11 | GET | `/api/v1/cart` | Customer | Get user's cart |
| 12 | POST | `/api/v1/cart` | Customer | Add item to cart |
| 13 | PUT | `/api/v1/cart/:cartId` | Customer | Update cart item quantity |
| 14 | DELETE | `/api/v1/cart/:cartId` | Customer | Remove item from cart |
| 15 | POST | `/api/v1/orders` | Customer | Place an order |
| 16 | GET | `/api/v1/orders` | Customer | Get customer's orders |
| 17 | GET | `/api/v1/orders/:orderId` | Both | Get order details |
| 18 | GET | `/api/v1/my-truck/orders` | Owner | Get truck's orders |
| 19 | PUT | `/api/v1/orders/:orderId/status` | Owner | Update order status |
| 20 | POST | `/api/v1/user` | Public | Register new user |
| 21 | POST | `/api/v1/user/login` | Public | Login user |

---

## Detailed Endpoint Documentation

### 1. User Management (Public)

#### 20. POST /api/v1/user
**Description:** Register a new user  
**Access:** Public  
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "customer",  // Optional: "customer" or "truckOwner", defaults to "customer"
  "birthDate": "1990-01-15"  // Optional: YYYY-MM-DD format
}
```

**Success Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "birthDate": "1990-01-15",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- `400` - Missing required fields or email already exists
- `500` - Server error

---

#### 21. POST /api/v1/user/login
**Description:** Login and create session  
**Access:** Public  
**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "userId": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```
Sets `session_token` cookie automatically.

**Error Responses:**
- `400` - Missing email or password
- `401` - Invalid credentials
- `500` - Server error

---

### 2. Truck Endpoints

#### 1. GET /api/v1/trucks
**Description:** Get all available trucks  
**Access:** All authenticated users  
**Response (200):**
```json
[
  {
    "truckId": 1,
    "truckName": "Tasty Tacos",
    "truckLogo": "https://example.com/logo.png",
    "ownerId": 2,
    "truckStatus": "available",
    "orderStatus": "available",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
]
```

---

#### 2. GET /api/v1/trucks/:truckId
**Description:** Get specific truck by ID  
**Access:** All authenticated users  
**URL Parameters:** `truckId` (integer)  
**Response (200):** Single truck object  
**Error Responses:**
- `404` - Truck not found

---

#### 3. GET /api/v1/my-truck
**Description:** Get truck owned by current user  
**Access:** TruckOwner only  
**Response (200):** Truck object  
**Error Responses:**
- `401` - Unauthorized
- `403` - Not a truck owner
- `404` - No truck found

---

#### 4. POST /api/v1/trucks
**Description:** Create a new truck (one per owner)  
**Access:** TruckOwner only  
**Request Body:**
```json
{
  "truckName": "Tasty Tacos",
  "truckLogo": "https://example.com/logo.png",  // Optional
  "truckStatus": "available",  // Optional: "available" or "unavailable"
  "orderStatus": "available"  // Optional: "available" or "unavailable"
}
```

**Success Response (201):**
```json
{
  "message": "Truck created successfully",
  "truck": { /* truck object */ }
}
```

**Error Responses:**
- `400` - Missing truck name, name already exists, or owner already has a truck
- `401` - Unauthorized
- `403` - Not a truck owner

---

#### 5. PUT /api/v1/trucks/:truckId
**Description:** Update truck (owner can only update own truck)  
**Access:** TruckOwner only  
**URL Parameters:** `truckId` (integer)  
**Request Body:** (all fields optional)
```json
{
  "truckName": "Updated Name",
  "truckLogo": "https://example.com/new-logo.png",
  "truckStatus": "unavailable",
  "orderStatus": "unavailable"
}
```

**Success Response (200):**
```json
{
  "message": "Truck updated successfully",
  "truck": { /* updated truck object */ }
}
```

**Error Responses:**
- `400` - No fields to update or truck name already exists
- `403` - Can only update own truck
- `404` - Truck not found

---

### 3. Menu Endpoints

#### 6. GET /api/v1/trucks/:truckId/menu
**Description:** Get menu items for a specific truck  
**Access:** All authenticated users  
**URL Parameters:** `truckId` (integer)  
**Response (200):** Array of menu items  
**Error Responses:**
- `404` - Truck not found

---

#### 7. GET /api/v1/my-truck/menu
**Description:** Get menu items for owner's truck  
**Access:** TruckOwner only  
**Response (200):** Array of menu items  
**Error Responses:**
- `403` - Not a truck owner
- `404` - No truck found

---

#### 8. POST /api/v1/menu-items
**Description:** Add a menu item to owner's truck  
**Access:** TruckOwner only  
**Request Body:**
```json
{
  "name": "Beef Taco",
  "description": "Delicious beef taco with fresh ingredients",  // Optional
  "price": 5.99,
  "category": "Main",
  "status": "available"  // Optional: "available" or "unavailable"
}
```

**Success Response (201):**
```json
{
  "message": "Menu item added successfully",
  "menuItem": { /* menu item object */ }
}
```

**Error Responses:**
- `400` - Missing required fields or invalid price
- `403` - Not a truck owner
- `404` - No truck found

---

#### 9. PUT /api/v1/menu-items/:itemId
**Description:** Update menu item (owner can only update own truck's items)  
**Access:** TruckOwner only  
**URL Parameters:** `itemId` (integer)  
**Request Body:** (all fields optional)
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "price": 6.99,
  "category": "Special",
  "status": "unavailable"
}
```

**Success Response (200):**
```json
{
  "message": "Menu item updated successfully",
  "menuItem": { /* updated menu item */ }
}
```

**Error Responses:**
- `400` - Invalid price or no fields to update
- `403` - Can only update own truck's items
- `404` - Menu item not found

---

#### 10. DELETE /api/v1/menu-items/:itemId
**Description:** Delete menu item (owner can only delete own truck's items)  
**Access:** TruckOwner only  
**URL Parameters:** `itemId` (integer)  
**Success Response (200):**
```json
{
  "message": "Menu item deleted successfully"
}
```

**Error Responses:**
- `403` - Can only delete own truck's items
- `404` - Menu item not found

---

### 4. Cart Endpoints

#### 11. GET /api/v1/cart
**Description:** Get user's cart with item details  
**Access:** Customer only  
**Response (200):**
```json
{
  "cartItems": [
    {
      "cartId": 1,
      "userId": 1,
      "itemId": 5,
      "quantity": 2,
      "price": 5.99,
      "itemName": "Beef Taco",
      "description": "Delicious beef taco",
      "category": "Main",
      "itemStatus": "available",
      "truckId": 1,
      "truckName": "Tasty Tacos",
      "truckLogo": "https://example.com/logo.png",
      "orderStatus": "available"
    }
  ],
  "total": 11.98
}
```

**Error Responses:**
- `403` - Not a customer

---

#### 12. POST /api/v1/cart
**Description:** Add item to cart  
**Access:** Customer only  
**Business Rule:** Cannot add items from multiple trucks  
**Request Body:**
```json
{
  "itemId": 5,
  "quantity": 2
}
```

**Success Response (201):**
```json
{
  "message": "Item added to cart successfully",
  "cartItem": { /* cart item object */ }
}
```

**Error Responses:**
- `400` - Missing fields, invalid quantity, item unavailable, or multiple trucks
- `403` - Not a customer
- `404` - Menu item not found

---

#### 13. PUT /api/v1/cart/:cartId
**Description:** Update cart item quantity  
**Access:** Customer only  
**URL Parameters:** `cartId` (integer)  
**Request Body:**
```json
{
  "quantity": 3
}
```

**Success Response (200):**
```json
{
  "message": "Cart item updated successfully",
  "cartItem": { /* updated cart item */ }
}
```

**Error Responses:**
- `400` - Invalid quantity
- `403` - Can only update own cart
- `404` - Cart item not found

---

#### 14. DELETE /api/v1/cart/:cartId
**Description:** Remove item from cart  
**Access:** Customer only  
**URL Parameters:** `cartId` (integer)  
**Success Response (200):**
```json
{
  "message": "Item removed from cart successfully"
}
```

**Error Responses:**
- `403` - Can only remove own cart items
- `404` - Cart item not found

---

### 5. Order Endpoints

#### 15. POST /api/v1/orders
**Description:** Place an order from cart items  
**Access:** Customer only  
**Request Body:**
```json
{
  "scheduledPickupTime": "2024-01-15T14:30:00.000Z"  // Optional, must be at least 30 min from now
}
```

**Success Response (201):**
```json
{
  "message": "Order placed successfully",
  "order": {
    "orderId": 1,
    "userId": 1,
    "truckId": 1,
    "orderStatus": "pending",
    "totalPrice": 11.98,
    "scheduledPickupTime": "2024-01-15T14:30:00.000Z",
    "estimatedEarliestPickup": "2024-01-15T14:00:00.000Z",
    "createdAt": "2024-01-15T13:30:00.000Z"
  },
  "orderItems": [ /* array of order items */ ]
}
```

**Error Responses:**
- `400` - Empty cart, unavailable items, or invalid pickup time
- `403` - Not a customer

---

#### 16. GET /api/v1/orders
**Description:** Get all orders for current customer  
**Access:** Customer only  
**Response (200):** Array of orders with truck details  
**Error Responses:**
- `403` - Not a customer

---

#### 17. GET /api/v1/orders/:orderId
**Description:** Get specific order details with items  
**Access:** Order owner (customer) or truck owner  
**URL Parameters:** `orderId` (integer)  
**Response (200):**
```json
{
  "orderId": 1,
  "userId": 1,
  "truckId": 1,
  "truckName": "Tasty Tacos",
  "truckLogo": "https://example.com/logo.png",
  "orderStatus": "preparing",
  "totalPrice": 11.98,
  "scheduledPickupTime": "2024-01-15T14:30:00.000Z",
  "estimatedEarliestPickup": "2024-01-15T14:00:00.000Z",
  "createdAt": "2024-01-15T13:30:00.000Z",
  "items": [ /* array of order items with details */ ]
}
```

**Error Responses:**
- `403` - Can only view own orders
- `404` - Order not found

---

#### 18. GET /api/v1/my-truck/orders
**Description:** Get all orders for truck owner's truck  
**Access:** TruckOwner only  
**Response (200):** Array of orders with customer details  
**Error Responses:**
- `403` - Not a truck owner
- `404` - No truck found

---

#### 19. PUT /api/v1/orders/:orderId/status
**Description:** Update order status (owner can only update own truck's orders)  
**Access:** TruckOwner only  
**URL Parameters:** `orderId` (integer)  
**Request Body:**
```json
{
  "orderStatus": "preparing"  // Valid: pending, preparing, ready, completed, cancelled
}
```

**Success Response (200):**
```json
{
  "message": "Order status updated successfully",
  "order": { /* updated order */ }
}
```

**Error Responses:**
- `400` - Missing or invalid status
- `403` - Can only update own truck's orders
- `404` - Order not found

---

## HTTP Status Codes

- `200 OK` - Successful GET/PUT/DELETE request
- `201 Created` - Successful POST request (resource created)
- `400 Bad Request` - Invalid input or business rule violation
- `401 Unauthorized` - No valid session token
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Error Response Format

All errors return JSON:
```json
{
  "error": "Descriptive error message"
}
```

## Success Response Format

Success responses typically include:
```json
{
  "message": "Operation successful",
  "data": { /* resource object or array */ }
}
```

---

## Business Rules

1. **Single Truck per Owner:** Each truck owner can create only one truck
2. **Single Truck per Order:** Customers cannot add items from multiple trucks to cart
3. **Role-Based Access:**
   - Customers: Can only access cart and order endpoints
   - Truck Owners: Can only manage their own truck, menu, and orders
4. **Menu Item Availability:** Cart can only contain available items
5. **Order Acceptance:** Truck must have `orderStatus: "available"` to accept new orders
6. **Pickup Time:** Scheduled pickup must be at least 30 minutes from now

---

## Database Schema

The system uses the following tables in the `FoodTruck` schema:

- **Users** - User accounts (customers and truck owners)
- **Trucks** - Food truck information
- **MenuItems** - Menu items for each truck
- **Orders** - Customer orders
- **OrderItems** - Items in each order
- **Carts** - Customer shopping carts
- **Sessions** - User authentication sessions
