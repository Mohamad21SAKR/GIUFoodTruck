# API Endpoints Quick Reference

## Summary: 21 Total Endpoints

- **2 Public Endpoints** (No authentication required)
- **19 Protected Endpoints** (Authentication required)

---

## Public Endpoints (2)

### Authentication
| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 20 | POST | `/api/v1/user` | Register new user |
| 21 | POST | `/api/v1/user/login` | Login user |

---

## Protected Endpoints (19)

### Trucks (5 endpoints)
| # | Method | Endpoint | Access | Description |
|---|--------|----------|--------|-------------|
| 1 | GET | `/api/v1/trucks` | All Users | Get all available trucks |
| 2 | GET | `/api/v1/trucks/:truckId` | All Users | Get specific truck by ID |
| 3 | GET | `/api/v1/my-truck` | Owner Only | Get truck owned by current user |
| 4 | POST | `/api/v1/trucks` | Owner Only | Create a new truck |
| 5 | PUT | `/api/v1/trucks/:truckId` | Owner Only | Update own truck |

### Menu Items (5 endpoints)
| # | Method | Endpoint | Access | Description |
|---|--------|----------|--------|-------------|
| 6 | GET | `/api/v1/trucks/:truckId/menu` | All Users | Get menu for specific truck |
| 7 | GET | `/api/v1/my-truck/menu` | Owner Only | Get menu for owner's truck |
| 8 | POST | `/api/v1/menu-items` | Owner Only | Add menu item to owner's truck |
| 9 | PUT | `/api/v1/menu-items/:itemId` | Owner Only | Update menu item |
| 10 | DELETE | `/api/v1/menu-items/:itemId` | Owner Only | Delete menu item |

### Shopping Cart (4 endpoints)
| # | Method | Endpoint | Access | Description |
|---|--------|----------|--------|-------------|
| 11 | GET | `/api/v1/cart` | Customer Only | Get user's cart with details |
| 12 | POST | `/api/v1/cart` | Customer Only | Add item to cart |
| 13 | PUT | `/api/v1/cart/:cartId` | Customer Only | Update cart item quantity |
| 14 | DELETE | `/api/v1/cart/:cartId` | Customer Only | Remove item from cart |

### Orders (5 endpoints)
| # | Method | Endpoint | Access | Description |
|---|--------|----------|--------|-------------|
| 15 | POST | `/api/v1/orders` | Customer Only | Place order from cart |
| 16 | GET | `/api/v1/orders` | Customer Only | Get all customer's orders |
| 17 | GET | `/api/v1/orders/:orderId` | Customer/Owner | Get specific order details |
| 18 | GET | `/api/v1/my-truck/orders` | Owner Only | Get all orders for owner's truck |
| 19 | PUT | `/api/v1/orders/:orderId/status` | Owner Only | Update order status |

---

## Access Control

### Customer Role
Can access:
- All Trucks (view only)
- All Menus (view only)
- Own Cart (CRUD)
- Own Orders (Create, Read)

### Truck Owner Role
Can access:
- All Trucks (view only)
- All Menus (view only)
- Own Truck (CRUD)
- Own Menu Items (CRUD)
- Own Truck's Orders (Read, Update status)

### All Authenticated Users
Can access:
- View all trucks
- View truck menus

---

## HTTP Methods Summary

| Method | Count | Purpose |
|--------|-------|---------|
| GET | 9 | Retrieve data |
| POST | 6 | Create new resources |
| PUT | 5 | Update existing resources |
| DELETE | 1 | Delete resources |

---

## Response Status Codes

- **200 OK** - Successful GET/PUT/DELETE
- **201 Created** - Successful POST
- **400 Bad Request** - Validation error or business rule violation
- **401 Unauthorized** - Missing or invalid session
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource doesn't exist
- **500 Internal Server Error** - Server error

---

## URL Parameters Used

- `:truckId` - Truck identifier (integer)
- `:itemId` - Menu item identifier (integer)
- `:cartId` - Cart item identifier (integer)
- `:orderId` - Order identifier (integer)

---

## Base URL

```
http://localhost:3001
```

---

## Authentication Method

Session-based authentication using `session_token` cookie:
1. Login via `/api/v1/user/login`
2. Cookie automatically set (5-hour expiry)
3. Cookie sent with all subsequent requests
4. `authMiddleware` validates session for protected routes

---

## Controller Files

- **truckController.js** - Endpoints 1-5 (Trucks)
- **menuController.js** - Endpoints 6-10 (Menu)
- **cartController.js** - Endpoints 11-14 (Cart)
- **orderController.js** - Endpoints 15-19 (Orders)
- **routes/public/api.js** - Endpoints 20-21 (Auth)

---

## Testing Priority Order

### Phase 1: Setup
1. Register users (customer + owner)
2. Login users

### Phase 2: Truck & Menu Setup (Owner)
3. Create truck
4. Add menu items
5. View menu

### Phase 3: Shopping Flow (Customer)
6. Browse trucks
7. View menu
8. Add to cart
9. Update cart
10. Place order

### Phase 4: Order Management (Owner)
11. View truck orders
12. View order details
13. Update order status

---

## Business Rules Enforced

1. ✅ One truck per owner
2. ✅ Single truck per cart/order
3. ✅ Role-based access control
4. ✅ Only available items can be ordered
5. ✅ Pickup time must be 30+ minutes
6. ✅ Owners can only manage own resources
7. ✅ Customers can only access own cart/orders

---

For detailed request/response examples, see **API_DOCUMENTATION.md**  
For testing scenarios, see **TESTING_GUIDE.md**
