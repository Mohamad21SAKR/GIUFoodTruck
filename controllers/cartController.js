const db = require('../connectors/db');
const { getUser } = require('../utils/session');

/**
 * Get user's cart with item details
 * Customer only
 */
async function getCart(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can access cart.' });
    }

    // Get cart items with menu item and truck details
    const cartItems = await db
      .select(
        'c.*',
        'mi.name as itemName',
        'mi.description',
        'mi.category',
        'mi.status as itemStatus',
        't.truckId',
        't.truckName',
        't.truckLogo',
        't.orderStatus'
      )
      .from({ c: 'FoodTruck.Carts' })
      .innerJoin({ mi: 'FoodTruck.MenuItems' }, 'c.itemId', 'mi.itemId')
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'mi.truckId', 't.truckId')
      .where('c.userId', user.userId)
      .orderBy('c.cartId', 'asc');

    // Calculate total
    const total = cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

    return res.status(200).json({
      cartItems,
      total: parseFloat(total.toFixed(2))
    });
  } catch (error) {
    console.error('Error fetching cart:', error.message);
    return res.status(500).json({ error: 'Failed to fetch cart' });
  }
}

/**
 * Add item to cart
 * Customer only
 * Business rule: Cannot add items from multiple trucks
 */
async function addToCart(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can add to cart.' });
    }

    const { itemId, quantity } = req.body;

    // Validation
    if (!itemId || !quantity) {
      return res.status(400).json({ error: 'Item ID and quantity are required' });
    }

    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Check if menu item exists and is available
    const menuItem = await db.select('mi.*', 't.truckId', 't.truckName', 't.orderStatus')
      .from({ mi: 'FoodTruck.MenuItems' })
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'mi.truckId', 't.truckId')
      .where('mi.itemId', itemId)
      .first();

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    if (menuItem.status !== 'available') {
      return res.status(400).json({ error: 'Menu item is not available' });
    }

    if (menuItem.orderStatus !== 'available') {
      return res.status(400).json({ error: 'This truck is not accepting orders at the moment' });
    }

    // Check if cart already has items from a different truck
    const existingCartItems = await db
      .select('mi.truckId')
      .from({ c: 'FoodTruck.Carts' })
      .innerJoin({ mi: 'FoodTruck.MenuItems' }, 'c.itemId', 'mi.itemId')
      .where('c.userId', user.userId)
      .first();

    if (existingCartItems && existingCartItems.truckId !== menuItem.truckId) {
      return res.status(400).json({ 
        error: 'Cannot order from multiple trucks. Please clear your cart or complete your current order first.' 
      });
    }

    // Check if item already in cart
    const existingCartItem = await db.select('*')
      .from('FoodTruck.Carts')
      .where('userId', user.userId)
      .where('itemId', itemId)
      .first();

    if (existingCartItem) {
      // Update quantity instead of adding new entry
      const newQuantity = existingCartItem.quantity + parseInt(quantity);
      const [updatedCart] = await db('FoodTruck.Carts')
        .where('cartId', existingCartItem.cartId)
        .update({
          quantity: newQuantity,
          price: menuItem.price
        })
        .returning('*');

      return res.status(200).json({ message: 'Cart updated successfully', cartItem: updatedCart });
    }

    // Add new cart item
    const newCartItem = {
      userId: user.userId,
      itemId: parseInt(itemId),
      quantity: parseInt(quantity),
      price: menuItem.price
    };

    const [cartItem] = await db('FoodTruck.Carts').insert(newCartItem).returning('*');

    return res.status(201).json({ message: 'Item added to cart successfully', cartItem });
  } catch (error) {
    console.error('Error adding to cart:', error.message);
    return res.status(500).json({ error: 'Failed to add item to cart' });
  }
}

/**
 * Update cart item quantity
 * Customer only - can only update own cart
 */
async function updateCartItem(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can update cart.' });
    }

    const { cartId } = req.params;
    const { quantity } = req.body;

    // Validation
    if (!quantity) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    if (isNaN(quantity) || quantity <= 0 || !Number.isInteger(Number(quantity))) {
      return res.status(400).json({ error: 'Quantity must be a positive integer' });
    }

    // Check if cart item exists and belongs to user
    const cartItem = await db.select('*')
      .from('FoodTruck.Carts')
      .where('cartId', cartId)
      .first();

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.userId !== user.userId) {
      return res.status(403).json({ error: 'You can only update your own cart items' });
    }

    const [updatedCartItem] = await db('FoodTruck.Carts')
      .where('cartId', cartId)
      .update({ quantity: parseInt(quantity) })
      .returning('*');

    return res.status(200).json({ message: 'Cart item updated successfully', cartItem: updatedCartItem });
  } catch (error) {
    console.error('Error updating cart item:', error.message);
    return res.status(500).json({ error: 'Failed to update cart item' });
  }
}

/**
 * Remove item from cart
 * Customer only - can only remove own cart items
 */
async function removeFromCart(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can remove from cart.' });
    }

    const { cartId } = req.params;

    // Check if cart item exists and belongs to user
    const cartItem = await db.select('*')
      .from('FoodTruck.Carts')
      .where('cartId', cartId)
      .first();

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    if (cartItem.userId !== user.userId) {
      return res.status(403).json({ error: 'You can only remove your own cart items' });
    }

    await db('FoodTruck.Carts')
      .where('cartId', cartId)
      .delete();

    return res.status(200).json({ message: 'Item removed from cart successfully' });
  } catch (error) {
    console.error('Error removing from cart:', error.message);
    return res.status(500).json({ error: 'Failed to remove item from cart' });
  }
}

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};
