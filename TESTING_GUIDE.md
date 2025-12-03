# GIU Food-Truck System - Testing Guide

## Setup Instructions

### Prerequisites
1. Node.js installed
2. PostgreSQL installed and running
3. Visual Studio Code with Thunder Client extension

### Database Setup
1. Open pgAdmin4
2. Register server named `db_server` with password (same as during PostgreSQL install)
3. Navigate to: `db_server` → `Database` → `postgres` → `Schemas`
4. Create schema named `FoodTruck` (if not exists)
5. Open Query Tool and run the script from `connectors/scripts.sql`
6. Verify tables are created in `FoodTruck` schema

### Project Setup
1. Open project in VS Code
2. Update `.env` file with your PostgreSQL password
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run server
   ```
5. Server should start on `http://localhost:3001`

---

## Testing with Thunder Client

### Setup Thunder Client
1. Install Thunder Client extension in VS Code
2. Click Thunder Client icon in sidebar
3. Create a new Collection called "GIU Food Truck API"

---

## Test Scenarios

### Scenario 1: Customer Complete Flow

#### Step 1: Register Customer
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/user`  
**Headers:** `Content-Type: application/json`  
**Body:**
```json
{
  "name": "Alice Customer",
  "email": "alice@customer.com",
  "password": "password123",
  "role": "customer",
  "birthDate": "1995-05-15"
}
```

**Expected Response (201):**
```json
{
  "message": "User registered successfully",
  "user": {
    "userId": 1,
    "name": "Alice Customer",
    "email": "alice@customer.com",
    "role": "customer",
    "birthDate": "1995-05-15T00:00:00.000Z",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### Step 2: Login Customer
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/user/login`  
**Headers:** `Content-Type: application/json`  
**Body:**
```json
{
  "email": "alice@customer.com",
  "password": "password123"
}
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "userId": 1,
    "name": "Alice Customer",
    "email": "alice@customer.com",
    "role": "customer"
  }
}
```

**Important:** The session cookie is automatically saved by Thunder Client. All subsequent requests will include this cookie.

---

#### Step 3: Browse Available Trucks
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/trucks`  
**No Body Required**

**Expected Response (200):** Array of available trucks

---

#### Step 4: View Truck Menu
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/trucks/1/menu`  
(Replace `1` with actual truckId)

**Expected Response (200):** Array of menu items

---

#### Step 5: Add Item to Cart
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/cart`  
**Headers:** `Content-Type: application/json`  
**Body:**
```json
{
  "itemId": 1,
  "quantity": 2
}
```

**Expected Response (201):**
```json
{
  "message": "Item added to cart successfully",
  "cartItem": {
    "cartId": 1,
    "userId": 1,
    "itemId": 1,
    "quantity": 2,
    "price": 5.99
  }
}
```

---

#### Step 6: Add Another Item
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/cart`  
**Body:**
```json
{
  "itemId": 2,
  "quantity": 1
}
```

**Expected Response (201):** Cart item added

---

#### Step 7: View Cart
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/cart`

**Expected Response (200):**
```json
{
  "cartItems": [
    {
      "cartId": 1,
      "userId": 1,
      "itemId": 1,
      "quantity": 2,
      "price": 5.99,
      "itemName": "Beef Taco",
      "description": "Delicious beef taco",
      "category": "Main",
      "itemStatus": "available",
      "truckId": 1,
      "truckName": "Tasty Tacos",
      "orderStatus": "available"
    }
  ],
  "total": 11.98
}
```

---

#### Step 8: Update Cart Item Quantity
**Method:** PUT  
**URL:** `http://localhost:3001/api/v1/cart/1`  
(Replace `1` with actual cartId)  
**Body:**
```json
{
  "quantity": 3
}
```

**Expected Response (200):**
```json
{
  "message": "Cart item updated successfully",
  "cartItem": { /* updated cart item */ }
}
```

---

#### Step 9: Place Order
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/orders`  
**Body:** (optional scheduled pickup)
```json
{
  "scheduledPickupTime": "2024-12-31T15:00:00.000Z"
}
```

Or empty body for ASAP:
```json
{}
```

**Expected Response (201):**
```json
{
  "message": "Order placed successfully",
  "order": {
    "orderId": 1,
    "userId": 1,
    "truckId": 1,
    "orderStatus": "pending",
    "totalPrice": 17.97,
    "estimatedEarliestPickup": "2024-01-15T14:00:00.000Z",
    "createdAt": "2024-01-15T13:30:00.000Z"
  },
  "orderItems": [ /* order items */ ]
}
```

---

#### Step 10: View Customer Orders
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/orders`

**Expected Response (200):** Array of customer's orders

---

#### Step 11: View Specific Order Details
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/orders/1`  
(Replace `1` with actual orderId)

**Expected Response (200):** Order details with items

---

### Scenario 2: Truck Owner Complete Flow

#### Step 1: Register Truck Owner
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/user`  
**Body:**
```json
{
  "name": "Bob Owner",
  "email": "bob@owner.com",
  "password": "password123",
  "role": "truckOwner",
  "birthDate": "1985-03-20"
}
```

**Expected Response (201):** User registered

---

#### Step 2: Login Truck Owner
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/user/login`  
**Body:**
```json
{
  "email": "bob@owner.com",
  "password": "password123"
}
```

**Expected Response (200):** Login successful  
**Note:** New session cookie is set (replaces customer session)

---

#### Step 3: Create Truck
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/trucks`  
**Body:**
```json
{
  "truckName": "Tasty Tacos Deluxe",
  "truckLogo": "https://example.com/logo.png",
  "truckStatus": "available",
  "orderStatus": "available"
}
```

**Expected Response (201):**
```json
{
  "message": "Truck created successfully",
  "truck": {
    "truckId": 1,
    "truckName": "Tasty Tacos Deluxe",
    "truckLogo": "https://example.com/logo.png",
    "ownerId": 2,
    "truckStatus": "available",
    "orderStatus": "available",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

#### Step 4: View My Truck
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/my-truck`

**Expected Response (200):** Truck details

---

#### Step 5: Add Menu Item
**Method:** POST  
**URL:** `http://localhost:3001/api/v1/menu-items`  
**Body:**
```json
{
  "name": "Beef Taco",
  "description": "Delicious beef taco with fresh ingredients",
  "price": 5.99,
  "category": "Main",
  "status": "available"
}
```

**Expected Response (201):**
```json
{
  "message": "Menu item added successfully",
  "menuItem": {
    "itemId": 1,
    "truckId": 1,
    "name": "Beef Taco",
    "description": "Delicious beef taco with fresh ingredients",
    "price": 5.99,
    "category": "Main",
    "status": "available",
    "createdAt": "2024-01-15T10:35:00.000Z"
  }
}
```

---

#### Step 6: Add More Menu Items
Repeat Step 5 with different items:
```json
{
  "name": "Chicken Burrito",
  "description": "Grilled chicken burrito",
  "price": 7.99,
  "category": "Main",
  "status": "available"
}
```

```json
{
  "name": "Churros",
  "description": "Sweet cinnamon churros",
  "price": 3.99,
  "category": "Dessert",
  "status": "available"
}
```

---

#### Step 7: View My Truck Menu
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/my-truck/menu`

**Expected Response (200):** Array of menu items for your truck

---

#### Step 8: Update Menu Item
**Method:** PUT  
**URL:** `http://localhost:3001/api/v1/menu-items/1`  
(Replace `1` with actual itemId)  
**Body:**
```json
{
  "price": 6.49,
  "status": "available"
}
```

**Expected Response (200):**
```json
{
  "message": "Menu item updated successfully",
  "menuItem": { /* updated menu item */ }
}
```

---

#### Step 9: Update Truck Status
**Method:** PUT  
**URL:** `http://localhost:3001/api/v1/trucks/1`  
(Replace `1` with actual truckId)  
**Body:**
```json
{
  "orderStatus": "unavailable"
}
```

**Expected Response (200):**
```json
{
  "message": "Truck updated successfully",
  "truck": { /* updated truck */ }
}
```

---

#### Step 10: View Truck Orders (after customers place orders)
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/my-truck/orders`

**Expected Response (200):** Array of orders for your truck

---

#### Step 11: View Specific Order
**Method:** GET  
**URL:** `http://localhost:3001/api/v1/orders/1`  
(Replace `1` with actual orderId)

**Expected Response (200):** Order details with items

---

#### Step 12: Update Order Status
**Method:** PUT  
**URL:** `http://localhost:3001/api/v1/orders/1/status`  
(Replace `1` with actual orderId)  
**Body:**
```json
{
  "orderStatus": "preparing"
}
```

**Expected Response (200):**
```json
{
  "message": "Order status updated successfully",
  "order": {
    "orderId": 1,
    "orderStatus": "preparing",
    /* other order fields */
  }
}
```

---

## Testing Business Rules

### Test 1: Cannot Order from Multiple Trucks
1. Login as customer
2. Add item from Truck 1 to cart
3. Try to add item from Truck 2 to cart

**Expected:** 400 error with message about multiple trucks

---

### Test 2: Truck Owner Can Only Create One Truck
1. Login as truck owner
2. Create first truck (should succeed)
3. Try to create second truck

**Expected:** 400 error about already having a truck

---

### Test 3: Only Update Own Resources
1. Login as Truck Owner 1
2. Try to update Truck Owner 2's truck/menu

**Expected:** 403 Forbidden error

---

### Test 4: Role-Based Access
1. Login as customer
2. Try to create truck or add menu items

**Expected:** 403 Forbidden error

---

### Test 5: Cannot Place Order with Empty Cart
1. Login as customer
2. Clear cart (delete all items)
3. Try to place order

**Expected:** 400 error about empty cart

---

## Common Issues & Solutions

### Issue: "Unauthorized" Error
**Solution:** Make sure you're logged in and the session cookie is being sent with requests

### Issue: "Forbidden" Error
**Solution:** Check that your user role matches the endpoint requirements (customer vs truckOwner)

### Issue: "Item not found" Error
**Solution:** Verify the ID in the URL parameter exists in the database

### Issue: Cannot connect to database
**Solution:** 
1. Check PostgreSQL is running
2. Verify `.env` password is correct
3. Ensure `FoodTruck` schema exists
4. Run `scripts.sql` if tables don't exist

### Issue: Session expired
**Solution:** Login again to get a new session token

---

## Thunder Client Collection Structure

Organize your Thunder Client requests like this:

```
📁 GIU Food Truck API
  📁 Public
    - Register Customer
    - Register Truck Owner
    - Login Customer
    - Login Truck Owner
  
  📁 Trucks
    - Get All Trucks
    - Get Truck by ID
    - Get My Truck (Owner)
    - Create Truck
    - Update Truck
  
  📁 Menu
    - Get Truck Menu
    - Get My Truck Menu (Owner)
    - Add Menu Item
    - Update Menu Item
    - Delete Menu Item
  
  📁 Cart
    - View Cart
    - Add to Cart
    - Update Cart Item
    - Remove from Cart
  
  📁 Orders
    - Place Order
    - View My Orders (Customer)
    - View Order Details
    - View Truck Orders (Owner)
    - Update Order Status
```

---

## Testing Checklist

### Authentication
- [ ] Register customer
- [ ] Register truck owner
- [ ] Login customer
- [ ] Login truck owner
- [ ] Access protected endpoint without login (should fail)

### Truck Management
- [ ] Create truck (owner)
- [ ] View my truck (owner)
- [ ] Update truck (owner)
- [ ] View all trucks (any user)
- [ ] View specific truck (any user)
- [ ] Try to create second truck (should fail)

### Menu Management
- [ ] Add menu items (owner)
- [ ] View truck menu (any user)
- [ ] View my truck menu (owner)
- [ ] Update menu item (owner)
- [ ] Delete menu item (owner)
- [ ] Try to update another owner's menu item (should fail)

### Cart Management
- [ ] Add item to cart (customer)
- [ ] View cart (customer)
- [ ] Update cart quantity (customer)
- [ ] Remove from cart (customer)
- [ ] Try to add items from multiple trucks (should fail)

### Order Management
- [ ] Place order (customer)
- [ ] View my orders (customer)
- [ ] View order details (customer/owner)
- [ ] View truck orders (owner)
- [ ] Update order status (owner)
- [ ] Place order with empty cart (should fail)

---

## Production Testing Tips

1. **Use Environment Variables:** Thunder Client supports environments. Create separate environments for development, testing, and production.

2. **Test Error Cases:** Don't just test happy paths. Try invalid inputs, missing fields, wrong IDs, etc.

3. **Test Role Permissions:** Always verify that customers can't access owner endpoints and vice versa.

4. **Clear Data Between Tests:** Use DELETE requests or truncate tables to start fresh.

5. **Monitor Console Output:** Watch the terminal where `npm run server` is running for error logs.

6. **Database State:** Use pgAdmin to verify database state after operations.

---

## Sample Test Data

### Users
```json
// Customer 1
{
  "name": "Alice Customer",
  "email": "alice@customer.com",
  "password": "password123",
  "role": "customer"
}

// Customer 2
{
  "name": "Charlie Customer",
  "email": "charlie@customer.com",
  "password": "password123",
  "role": "customer"
}

// Truck Owner 1
{
  "name": "Bob Owner",
  "email": "bob@owner.com",
  "password": "password123",
  "role": "truckOwner"
}

// Truck Owner 2
{
  "name": "Dave Owner",
  "email": "dave@owner.com",
  "password": "password123",
  "role": "truckOwner"
}
```

### Trucks
```json
{
  "truckName": "Tasty Tacos",
  "truckLogo": "https://example.com/tacos.png"
}

{
  "truckName": "Burger Bliss",
  "truckLogo": "https://example.com/burgers.png"
}
```

### Menu Items
```json
// Tacos Menu
{ "name": "Beef Taco", "price": 5.99, "category": "Main" }
{ "name": "Chicken Taco", "price": 5.49, "category": "Main" }
{ "name": "Veggie Taco", "price": 4.99, "category": "Main" }
{ "name": "Churros", "price": 3.99, "category": "Dessert" }
{ "name": "Horchata", "price": 2.99, "category": "Beverage" }

// Burgers Menu
{ "name": "Classic Burger", "price": 7.99, "category": "Main" }
{ "name": "Cheese Burger", "price": 8.99, "category": "Main" }
{ "name": "Veggie Burger", "price": 7.49, "category": "Main" }
{ "name": "Fries", "price": 2.99, "category": "Side" }
{ "name": "Milkshake", "price": 4.99, "category": "Beverage" }
```

---

## Quick Start Script

After setting up the database, you can use this sequence to quickly test the system:

1. Register & login truck owner
2. Create truck
3. Add 3-5 menu items
4. Register & login customer
5. View all trucks
6. View truck menu
7. Add 2-3 items to cart
8. Place order
9. Switch back to truck owner
10. View orders and update status

---

Good luck with your testing! 🚀
