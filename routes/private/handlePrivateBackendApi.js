// routes/private/handlePrivateBackendApi.js

const db = require('../../connectors/db');
const { getUser } = require('../../utils/session');

// TRUCK controllers
const {
  getAllTrucks,
  getTruckById,
  getMyTruck,
  createTruck,
  updateTruck,
} = require('../../controllers/truckController');

// MENU controllers
const {
  getTruckMenu,
  getMyTruckMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} = require('../../controllers/menuController');

// CART controllers
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
} = require('../../controllers/cartController');

// ORDER controllers
const {
  placeOrder,
  getCustomerOrders,
  getOrderById,
  getTruckOrders,
  updateOrderStatus,
} = require('../../controllers/orderController');

function handlePrivateBackendApi(app) {

  // ============================================
  // 🚚 TRUCK MANAGEMENT (Matches Milestone Table)
  // ============================================

  // GET /api/v1/trucks/view – Customer: view all available trucks
  app.get('/api/v1/trucks/view', getAllTrucks);

  // GET /api/v1/trucks/myTruck – Truck Owner: view my truck info
  app.get('/api/v1/trucks/myTruck', getMyTruck);

  // PUT /api/v1/trucks/updateOrderStatus – Truck Owner
  app.put('/api/v1/trucks/updateOrderStatus/:truckId', updateTruck);

  // ============================================
  // 🍔 MENU ITEM MANAGEMENT (Truck Owner)
  // ============================================

  // POST /api/v1/menuItem/new – Truck Owner: create menu item
  app.post('/api/v1/menuItem/new', addMenuItem);

  // GET /api/v1/menuItem/view – Truck Owner: view my menu items
  app.get('/api/v1/menuItem/view', getMyTruckMenu);

// GET /api/v1/menuItem/view/:itemId – Truck Owner: view specific menu item
app.get('/api/v1/menuItem/view/:itemId', async (req, res) => {
  try {
    const user = req.user; // ✅ set by authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res
        .status(403)
        .json({ error: 'Only truck owners can view this menu item' });
    }

    const { itemId } = req.params;

    // 1) Get the menu item
    const menuItem = await db('MenuItems')
      .withSchema('FoodTruck')
      .where('itemId', itemId)
      .first();

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // 2) Check that this item belongs to THIS owner's truck
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('truckId', menuItem.truckId)
      .first();

    if (!truck || truck.ownerId !== user.userId) {
      return res
        .status(403)
        .json({ error: 'You can only view items from your own truck' });
    }

    // 3) All good → return the item
    return res.status(200).json(menuItem);
  } catch (err) {
    console.error('Error fetching menu item by id:', err);
    return res
      .status(500)
      .json({ error: 'Failed to fetch menu item', details: err.message });
  }
});

// PUT /api/v1/menuItem/edit/:itemId – Truck Owner: edit menu item
app.put('/api/v1/menuItem/edit/:itemId', async (req, res) => {
  try {
    const user = req.user; // set by authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    if (user.role !== 'truckOwner') {
      return res.status(403).json({ error: 'Only truck owners can edit menu items' });
    }

    const { itemId } = req.params;
    const { name, description, price, category } = req.body;

    if (!name || !price || !category) {
      return res.status(400).json({
        error: 'name, price and category are required to update a menu item'
      });
    }

    // Find the truck owned by this user
    const truckResult = await db.raw(
      `SELECT "truckId"
       FROM "FoodTruck"."Trucks"
       WHERE "ownerId" = ?
       LIMIT 1;`,
      [user.userId]
    );
    const truck = truckResult.rows && truckResult.rows[0];

    if (!truck) {
      return res.status(404).json({ error: 'You do not own a truck' });
    }

    // Update the menu item, but only if it belongs to this truck
    await db.raw(
      `UPDATE "FoodTruck"."MenuItems"
       SET "name" = ?, "description" = ?, "price" = ?, "category" = ?
       WHERE "itemId" = ? AND "truckId" = ?;`,
      [name, description || null, price, category, itemId, truck.truckid || truck.truckId]
    );

    // Fetch the updated row to return it
    const itemResult = await db.raw(
      `SELECT *
       FROM "FoodTruck"."MenuItems"
       WHERE "itemId" = ? AND "truckId" = ?;`,
      [itemId, truck.truckid || truck.truckId]
    );
    const updatedItem = itemResult.rows && itemResult.rows[0];

    if (!updatedItem) {
      return res.status(404).json({ error: 'Menu item not found for this truck owner' });
    }

    return res.status(200).json({
      message: 'Menu item updated successfully',
      item: updatedItem
    });
  } catch (err) {
    console.error('Error updating menu item:', err);
    return res.status(500).json({ error: 'Failed to update menu item' });
  }
});


  // DELETE /api/v1/menuItem/delete/:itemId – Truck Owner: delete menu item
  app.delete('/api/v1/menuItem/delete/:itemId', deleteMenuItem);

  // ============================================
  // 🔎 BROWSE MENU (Customer)
  // ============================================

  // GET /api/v1/menuItem/truck/:truckId – Customer: truck menu
  app.get('/api/v1/menuItem/truck/:truckId', getTruckMenu);

  // GET /api/v1/menuItem/truck/:truckId/category/:category – Customer: search by category
  app.get('/api/v1/menuItem/truck/:truckId/category/:category', getTruckMenu);

  // ============================================
  // 🛒 CART MANAGEMENT (Customer)
  // ============================================

  // POST /api/v1/cart/new – Add item to cart
  app.post('/api/v1/cart/new', addToCart);

  // GET /api/v1/cart/view – View cart
  app.get('/api/v1/cart/view', getCart);

  // PUT /api/v1/cart/edit/:cartId – Update quantity
  app.put('/api/v1/cart/edit/:cartId', updateCartItem);

  // DELETE /api/v1/cart/delete/:cartId – Remove from cart
  app.delete('/api/v1/cart/delete/:cartId', removeFromCart);

  // ============================================
  // 📦 ORDER MANAGEMENT (Customer + Truck Owner)
  // ============================================

  // POST /api/v1/order/new – Customer: place order
  app.post('/api/v1/order/new', placeOrder);

  // GET /api/v1/order/myOrders – Customer: view my orders
  app.get('/api/v1/order/myOrders', getCustomerOrders);

  // GET /api/v1/order/details/:orderId – Customer: view order details
  app.get('/api/v1/order/details/:orderId', getOrderById);

  // GET /api/v1/order/truckOwner/:orderId – Truck Owner: view order details
  app.get('/api/v1/order/truckOwner/:orderId', getOrderById);

  // GET /api/v1/order/truckOrders – Truck Owner: view orders for my truck
  app.get('/api/v1/order/truckOrders', getTruckOrders);

  // PUT /api/v1/order/updateStatus/:orderId – Truck Owner: update order status
  app.put('/api/v1/order/updateStatus/:orderId', updateOrderStatus);

  // ============================================
  // 🧪 TEST ENDPOINT
  // ============================================
  app.get('/test', async (req, res) => {
    try {
      return res.status(200).send('successful connection');
    } catch (err) {
      console.log('error message', err.message);
      return res.status(400).send(err.message);
    }
  });
}

module.exports = { handlePrivateBackendApi };
