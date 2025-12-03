# Quick Start Guide - Get Running in 5 Minutes

## ⚡ Fast Setup

### Step 1: Database (2 minutes)
1. Open **pgAdmin4**
2. Navigate to: `postgres` database → Right-click → **Query Tool**
3. Open file: `connectors/scripts.sql`
4. Copy all content → Paste in Query Tool → **Execute (F5)**
5. Verify 7 tables created in `FoodTruck` schema

### Step 2: Configure (30 seconds)
1. Open `.env` file
2. Update password:
   ```
   PASSWORD='your_postgres_password'
   ```

### Step 3: Run (1 minute)
```bash
npm install
npm run server
```

Server starts at: `http://localhost:3001`

---

## 🧪 First Test (3 minutes)

### Using Thunder Client in VS Code:

**1. Register Truck Owner**
```
POST http://localhost:3001/api/v1/user
Content-Type: application/json

{
  "name": "Bob Owner",
  "email": "bob@owner.com",
  "password": "password123",
  "role": "truckOwner"
}
```

**2. Login**
```
POST http://localhost:3001/api/v1/user/login
Content-Type: application/json

{
  "email": "bob@owner.com",
  "password": "password123"
}
```

**3. Create Truck**
```
POST http://localhost:3001/api/v1/trucks
Content-Type: application/json

{
  "truckName": "Tasty Tacos",
  "truckLogo": "https://example.com/logo.png"
}
```

**4. Add Menu Item**
```
POST http://localhost:3001/api/v1/menu-items
Content-Type: application/json

{
  "name": "Beef Taco",
  "description": "Delicious!",
  "price": 5.99,
  "category": "Main"
}
```

**5. View All Trucks**
```
GET http://localhost:3001/api/v1/trucks
```

✅ If you see your truck, everything works!

---

## 🎯 Customer Test

**1. Register Customer**
```
POST http://localhost:3001/api/v1/user
Content-Type: application/json

{
  "name": "Alice Customer",
  "email": "alice@customer.com",
  "password": "password123",
  "role": "customer"
}
```

**2. Login**
```
POST http://localhost:3001/api/v1/user/login

{
  "email": "alice@customer.com",
  "password": "password123"
}
```

**3. Add to Cart** (use itemId from previous menu item)
```
POST http://localhost:3001/api/v1/cart

{
  "itemId": 1,
  "quantity": 2
}
```

**4. Place Order**
```
POST http://localhost:3001/api/v1/orders

{}
```

✅ Order placed successfully!

---

## 📚 Full Documentation

For complete details, see:
- **README.md** - Full setup & overview
- **API_DOCUMENTATION.md** - All 21 endpoints
- **TESTING_GUIDE.md** - Complete test scenarios
- **ENDPOINTS_SUMMARY.md** - Quick reference

---

## 🚨 Troubleshooting

**Can't connect to database?**
- Check PostgreSQL is running
- Verify password in `.env`

**Port already in use?**
- Change `PORT=3001` to another port in `.env`

**Unauthorized error?**
- Make sure you logged in
- Check cookie is being sent

**403 Forbidden?**
- Verify user role (customer vs truckOwner)

---

## ✅ You're Ready!

Server running? ✅  
First test passed? ✅  
Now explore all **21 endpoints** documented in the guides! 🚀
