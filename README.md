# GIU Food-Truck System Backend

## Project Overview

The GIU Food-Truck System is a full-stack web application backend built for **Project Milestone 3** of the Software Engineering course. This system allows food truck owners to manage their trucks and menus, while customers can browse trucks, add items to their cart, and place orders.

### Tech Stack
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **Query Builder:** Knex.js
- **Authentication:** Session-based with cookies
- **Additional Libraries:** uuid, dotenv, axios

---

## Features

### For Customers
- Browse available food trucks
- View truck menus with item details
- Add items to shopping cart (single truck per order)
- Manage cart items (update quantities, remove items)
- Place orders with optional scheduled pickup time
- View order history and track order status

### For Truck Owners
- Create and manage food truck profile (one per owner)
- Add, update, and delete menu items
- View all orders for their truck
- Update order status (pending → preparing → ready → completed)
- Toggle truck availability and order acceptance status

### Business Rules
1. **One Truck Per Owner:** Each truck owner can only create one truck
2. **Single Truck Orders:** Customers can only order from one truck at a time
3. **Role-Based Access:** Strict separation between customer and truck owner capabilities
4. **Availability Checks:** Only available items from trucks accepting orders can be ordered
5. **Pickup Time Validation:** Scheduled pickups must be at least 30 minutes in the future

---

## Project Structure

```
milestoneBackend/
├── connectors/
│   ├── db.js                    # Knex database connection configuration
│   ├── scripts.sql              # Database schema creation script
│   └── seed.sql                 # Sample data for testing (optional)
├── controllers/
│   ├── truckController.js       # Truck CRUD operations
│   ├── menuController.js        # Menu item management
│   ├── cartController.js        # Shopping cart operations
│   └── orderController.js       # Order placement and management
├── middleware/
│   └── auth.js                  # Session authentication middleware
├── routes/
│   ├── public/
│   │   ├── api.js              # Public API routes (register, login)
│   │   └── view.js             # Public views
│   └── private/
│       ├── api.js              # Protected API routes (all 19 endpoints)
│       └── view.js             # Protected views
├── utils/
│   └── session.js              # Session management utilities (getUser function)
├── views/                       # Frontend templates (HJS)
├── public/                      # Static assets
├── .env                         # Environment variables (DATABASE PASSWORD)
├── server.js                    # Express server setup
├── package.json                 # Project dependencies
├── API_DOCUMENTATION.md         # Complete API documentation
├── TESTING_GUIDE.md            # Testing scenarios and examples
└── README.md                    # This file
```

---

## Installation & Setup

### Prerequisites
1. **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)
3. **Visual Studio Code** - [Download](https://code.visualstudio.com/)
4. **pgAdmin4** (comes with PostgreSQL)

### Step 1: Clone/Open Project
Open the `milestoneBackend` folder in Visual Studio Code.

### Step 2: Install Dependencies
Open a terminal in VS Code and run:
```bash
npm install
```

This installs all required packages:
- express
- knex
- pg (PostgreSQL client)
- dotenv
- uuid
- axios
- hjs (template engine)
- nodemon (development)

### Step 3: Setup PostgreSQL Database

#### 3.1 Register Server in pgAdmin4
1. Open pgAdmin4
2. Click "Register" → "Server"
3. **General Tab:**
   - Name: `db_server`
4. **Connection Tab:**
   - Host name/address: `localhost`
   - Port: `5432`
   - Maintenance database: `postgres`
   - Username: `postgres`
   - Password: `[your-postgres-password]`
5. Click "Save"

#### 3.2 Create Database Schema
1. Navigate to: `db_server` → `Databases` → `postgres` → `Schemas`
2. Right-click on "Schemas" → "Create" → "Schema"
3. Name: `FoodTruck`
4. Click "Save"

#### 3.3 Run Database Script
1. Right-click on `postgres` database → "Query Tool"
2. Open the file `connectors/scripts.sql`
3. Copy all content and paste into Query Tool
4. Click "Execute/Run" (F5)
5. Verify that 7 tables are created in the `FoodTruck` schema:
   - Users
   - Trucks
   - MenuItems
   - Orders
   - OrderItems
   - Carts
   - Sessions

### Step 4: Configure Environment Variables
1. Open the `.env` file in the project root
2. Update the PASSWORD field with your PostgreSQL password:
```env
PASSWORD=your_postgres_password_here
PORT=3001
```

### Step 5: Start the Server
In VS Code terminal, run:
```bash
npm run server
```

Or alternatively:
```bash
node server.js
```

You should see:
```
Server is now listening at port 3001 on http://localhost:3001/
```

---

## API Endpoints

The system implements **21 total endpoints:**
- **2 Public endpoints** (no authentication required)
- **19 Protected endpoints** (authentication required via session cookie)

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/user` | Register new user |
| POST | `/api/v1/user/login` | Login user |

### Protected Endpoints

#### Trucks (5 endpoints)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/trucks` | All | Get all available trucks |
| GET | `/api/v1/trucks/:truckId` | All | Get specific truck |
| GET | `/api/v1/my-truck` | Owner | Get owner's truck |
| POST | `/api/v1/trucks` | Owner | Create truck |
| PUT | `/api/v1/trucks/:truckId` | Owner | Update truck |

#### Menu (5 endpoints)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/trucks/:truckId/menu` | All | Get truck menu |
| GET | `/api/v1/my-truck/menu` | Owner | Get owner's menu |
| POST | `/api/v1/menu-items` | Owner | Add menu item |
| PUT | `/api/v1/menu-items/:itemId` | Owner | Update menu item |
| DELETE | `/api/v1/menu-items/:itemId` | Owner | Delete menu item |

#### Cart (4 endpoints)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/api/v1/cart` | Customer | Get cart |
| POST | `/api/v1/cart` | Customer | Add to cart |
| PUT | `/api/v1/cart/:cartId` | Customer | Update cart item |
| DELETE | `/api/v1/cart/:cartId` | Customer | Remove from cart |

#### Orders (5 endpoints)
| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/v1/orders` | Customer | Place order |
| GET | `/api/v1/orders` | Customer | Get customer orders |
| GET | `/api/v1/orders/:orderId` | Both | Get order details |
| GET | `/api/v1/my-truck/orders` | Owner | Get truck orders |
| PUT | `/api/v1/orders/:orderId/status` | Owner | Update order status |

For detailed request/response formats, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## Testing the API

### Option 1: Thunder Client (Recommended)
1. Install Thunder Client extension in VS Code
2. Follow the comprehensive guide in [TESTING_GUIDE.md](./TESTING_GUIDE.md)
3. Test all endpoints with provided examples

### Option 2: Postman
1. Import the API endpoints into Postman
2. Set base URL: `http://localhost:3001`
3. Follow the same test scenarios as Thunder Client guide

### Option 3: cURL
Example commands:

**Register:**
```bash
curl -X POST http://localhost:3001/api/v1/user \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"password123","role":"customer"}'
```

**Login:**
```bash
curl -X POST http://localhost:3001/api/v1/user/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"test@test.com","password":"password123"}'
```

**Get Trucks (with session):**
```bash
curl -X GET http://localhost:3001/api/v1/trucks \
  -b cookies.txt
```

---

## Database Schema

### Users Table
```sql
userId (PK, serial)
name (text)
email (text, unique)
password (text)
role (text) -- 'customer' or 'truckOwner'
birthDate (date)
createdAt (timestamp)
```

### Trucks Table
```sql
truckId (PK, serial)
truckName (text, unique)
truckLogo (text)
ownerId (FK → Users.userId)
truckStatus (text) -- 'available' or 'unavailable'
orderStatus (text) -- 'available' or 'unavailable'
createdAt (timestamp)
```

### MenuItems Table
```sql
itemId (PK, serial)
truckId (FK → Trucks.truckId)
name (text)
description (text)
price (numeric)
category (text)
status (text) -- 'available' or 'unavailable'
createdAt (timestamp)
```

### Orders Table
```sql
orderId (PK, serial)
userId (FK → Users.userId)
truckId (FK → Trucks.truckId)
orderStatus (text) -- 'pending', 'preparing', 'ready', 'completed', 'cancelled'
totalPrice (numeric)
scheduledPickupTime (timestamp)
estimatedEarliestPickup (timestamp)
createdAt (timestamp)
```

### OrderItems Table
```sql
orderItemId (PK, serial)
orderId (FK → Orders.orderId)
itemId (FK → MenuItems.itemId)
quantity (integer)
price (numeric)
```

### Carts Table
```sql
cartId (PK, serial)
userId (FK → Users.userId)
itemId (FK → MenuItems.itemId)
quantity (integer)
price (numeric)
```

### Sessions Table
```sql
id (PK, serial)
userId (FK → Users.userId)
token (text)
expiresAt (timestamp)
```

---

## Authentication Flow

1. **Register:** User creates account with email, password, and role
2. **Login:** System validates credentials and creates session token
3. **Session Cookie:** Token stored in `session_token` cookie (5 hour expiry)
4. **Protected Routes:** `authMiddleware` validates session token
5. **Get User:** `getUser(req)` function retrieves current user from session
6. **Authorization:** Controllers check user role and resource ownership

---

## Key Implementation Details

### Session Management (`utils/session.js`)
- `getSessionToken(req)`: Extracts session token from cookie
- `getUser(req)`: Returns logged-in user with role and truck info (for owners)

### Error Handling
All endpoints use try-catch blocks and return proper HTTP status codes:
- `200 OK` - Successful GET/PUT/DELETE
- `201 Created` - Successful POST (resource created)
- `400 Bad Request` - Invalid input or business rule violation
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

### Input Validation
All endpoints validate:
- Required fields
- Data types
- Business rules
- User permissions
- Resource ownership

### Knex Query Builder
All database operations use Knex for:
- SQL injection prevention
- Clean query syntax
- Transaction support
- Promise-based async operations

Example:
```javascript
const trucks = await db.select('*')
  .from('FoodTruck.Trucks')
  .where('truckStatus', 'available')
  .orderBy('createdAt', 'desc');
```

---

## Development Commands

```bash
# Start server (with nodemon auto-restart)
npm run server

# Start server (without auto-restart)
node server.js

# Install dependencies
npm install

# Install specific package
npm install package-name
```

---

## Common Issues & Solutions

### Issue: Cannot connect to database
**Solution:**
1. Verify PostgreSQL is running
2. Check pgAdmin can connect with same credentials
3. Ensure `.env` PASSWORD is correct
4. Verify `FoodTruck` schema exists

### Issue: Port 3001 already in use
**Solution:**
1. Change PORT in `.env` file
2. Or kill existing process:
   ```bash
   # Windows
   netstat -ano | findstr :3001
   taskkill /PID <PID> /F
   
   # Linux/Mac
   lsof -ti:3001 | xargs kill -9
   ```

### Issue: Session expired / Unauthorized
**Solution:**
1. Login again to get new session token
2. Check session expiry time (5 hours)
3. Verify cookie is being sent with requests

### Issue: 403 Forbidden on endpoint
**Solution:**
1. Check user role (customer vs truckOwner)
2. Verify you're accessing your own resources
3. Re-read endpoint access requirements in documentation

### Issue: Table does not exist
**Solution:**
1. Run `scripts.sql` in pgAdmin Query Tool
2. Verify tables exist in `FoodTruck` schema
3. Check schema name in queries matches exactly (case-sensitive)

---

## Code Quality Standards

This project follows:
- **Clean Code:** Descriptive function and variable names
- **Separation of Concerns:** Routes → Controllers → Database
- **DRY Principle:** Reusable controller functions
- **Error Handling:** Comprehensive try-catch blocks
- **Comments:** Clear documentation of business rules
- **Validation:** Input validation before database operations
- **Security:** Session-based auth, role checks, resource ownership

---

## Future Enhancements (Beyond Milestone 3)

Potential improvements:
- Password hashing (bcrypt)
- JWT authentication instead of sessions
- File upload for truck logos and menu images
- Real-time order status updates (WebSockets)
- Email notifications
- Payment integration
- Order history analytics
- Rating and review system
- Multiple trucks per owner
- Advanced search and filtering
- Admin dashboard

---

## Academic Integrity

This is a student project for the Software Engineering course at GIU. Please follow your institution's academic integrity policies when using this code.

---

## Credits

**Course:** Software Engineering  
**Institution:** German International University (GIU)  
**Milestone:** Project Milestone 3  
**Tech Stack:** Node.js, Express, PostgreSQL, Knex

---

## Support & Documentation

- **API Documentation:** See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Testing Guide:** See [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Setup Instructions:** See [checkReadMeImportant.txt](./checkReadMeImportant.txt)

---

## License

This project is for educational purposes as part of the GIU Software Engineering course.

---

**Last Updated:** December 2024  
**Version:** 1.0.0

---

Happy Coding! 🚀
