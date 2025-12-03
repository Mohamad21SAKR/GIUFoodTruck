const db = require('../connectors/db');
const { getUser } = require('../utils/session');

/**
 * Place an order from cart items
 * Customer only
 * Creates order and moves cart items to order items, then clears cart
 */
async function placeOrder(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can place orders.' });
    }

    const { scheduledPickupTime } = req.body;

    // Get cart items with menu and truck details
    const cartItems = await db
      .select(
        'c.*',
        'mi.truckId',
        'mi.name',
        'mi.status as itemStatus',
        't.orderStatus'
      )
      .from({ c: 'FoodTruck.Carts' })
      .innerJoin({ mi: 'FoodTruck.MenuItems' }, 'c.itemId', 'mi.itemId')
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'mi.truckId', 't.truckId')
      .where('c.userId', user.userId);

    if (cartItems.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Add items before placing an order.' });
    }

    // Check if all items are available
    const unavailableItems = cartItems.filter(item => item.itemStatus !== 'available');
    if (unavailableItems.length > 0) {
      return res.status(400).json({ 
        error: 'Some items in your cart are no longer available. Please remove them and try again.' 
      });
    }

    // Check if truck is accepting orders
    const truckId = cartItems[0].truckId;
    if (cartItems[0].orderStatus !== 'available') {
      return res.status(400).json({ error: 'This truck is not accepting orders at the moment.' });
    }

    // Calculate total price
    const totalPrice = cartItems.reduce((sum, item) => 
      sum + (parseFloat(item.price) * item.quantity), 0
    );

    // Calculate estimated earliest pickup (e.g., 30 minutes from now)
    const estimatedEarliestPickup = new Date();
    estimatedEarliestPickup.setMinutes(estimatedEarliestPickup.getMinutes() + 30);

    // Validate scheduled pickup time if provided
    let scheduledPickup = null;
    if (scheduledPickupTime) {
      scheduledPickup = new Date(scheduledPickupTime);
      if (isNaN(scheduledPickup.getTime())) {
        return res.status(400).json({ error: 'Invalid scheduled pickup time format' });
      }
      if (scheduledPickup < estimatedEarliestPickup) {
        return res.status(400).json({ 
          error: 'Scheduled pickup time must be at least 30 minutes from now' 
        });
      }
    }

    // Create order
    const newOrder = {
      userId: user.userId,
      truckId,
      orderStatus: 'pending',
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      scheduledPickupTime: scheduledPickup,
      estimatedEarliestPickup
    };

    const [order] = await db('FoodTruck.Orders').insert(newOrder).returning('*');

    // Create order items from cart
    const orderItems = cartItems.map(item => ({
      orderId: order.orderId,
      itemId: item.itemId,
      quantity: item.quantity,
      price: item.price
    }));

    await db('FoodTruck.OrderItems').insert(orderItems);

    // Clear user's cart
    await db('FoodTruck.Carts').where('userId', user.userId).delete();

    // Get full order details with items
    const orderWithItems = await db
      .select(
        'oi.*',
        'mi.name as itemName',
        'mi.description',
        'mi.category'
      )
      .from({ oi: 'FoodTruck.OrderItems' })
      .innerJoin({ mi: 'FoodTruck.MenuItems' }, 'oi.itemId', 'mi.itemId')
      .where('oi.orderId', order.orderId);

    return res.status(201).json({ 
      message: 'Order placed successfully', 
      order,
      orderItems: orderWithItems
    });
  } catch (error) {
    console.error('Error placing order:', error.message);
    return res.status(500).json({ error: 'Failed to place order' });
  }
}

/**
 * Get all orders for current customer
 * Customer only
 */
async function getCustomerOrders(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'customer') {
      return res.status(403).json({ error: 'Access denied. Only customers can view their orders.' });
    }

    const orders = await db
      .select(
        'o.*',
        't.truckName',
        't.truckLogo'
      )
      .from({ o: 'FoodTruck.Orders' })
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'o.truckId', 't.truckId')
      .where('o.userId', user.userId)
      .orderBy('o.createdAt', 'desc');

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching customer orders:', error.message);
    return res.status(500).json({ error: 'Failed to fetch orders' });
  }
}

/**
 * Get specific order details with items
 * Accessible by order owner (customer) or truck owner
 */
async function getOrderById(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { orderId } = req.params;

    // Get order with truck details
    const order = await db
      .select(
        'o.*',
        't.truckName',
        't.truckLogo',
        't.ownerId'
      )
      .from({ o: 'FoodTruck.Orders' })
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'o.truckId', 't.truckId')
      .where('o.orderId', orderId)
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization: customer can view own orders, truck owner can view truck's orders
    const isCustomerOwner = user.role === 'customer' && order.userId === user.userId;
    const isTruckOwner = user.role === 'truckOwner' && order.ownerId === user.userId;

    if (!isCustomerOwner && !isTruckOwner) {
      return res.status(403).json({ error: 'You can only view your own orders' });
    }

    // Get order items
    const orderItems = await db
      .select(
        'oi.*',
        'mi.name as itemName',
        'mi.description',
        'mi.category'
      )
      .from({ oi: 'FoodTruck.OrderItems' })
      .innerJoin({ mi: 'FoodTruck.MenuItems' }, 'oi.itemId', 'mi.itemId')
      .where('oi.orderId', orderId);

    return res.status(200).json({
      ...order,
      items: orderItems
    });
  } catch (error) {
    console.error('Error fetching order:', error.message);
    return res.status(500).json({ error: 'Failed to fetch order details' });
  }
}

/**
 * Get all orders for truck owner's truck
 * TruckOwner only
 */
async function getTruckOrders(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({ error: 'Access denied. Only truck owners can view truck orders.' });
    }

    // Get owner's truck
    const truck = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('ownerId', user.userId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'No truck found for this owner' });
    }

    // Get all orders for this truck with customer info
    const orders = await db
      .select(
        'o.*',
        'u.name as customerName',
        'u.email as customerEmail'
      )
      .from({ o: 'FoodTruck.Orders' })
      .innerJoin({ u: 'FoodTruck.Users' }, 'o.userId', 'u.userId')
      .where('o.truckId', truck.truckId)
      .orderBy('o.createdAt', 'desc');

    return res.status(200).json(orders);
  } catch (error) {
    console.error('Error fetching truck orders:', error.message);
    return res.status(500).json({ error: 'Failed to fetch truck orders' });
  }
}

/**
 * Update order status
 * TruckOwner only - can only update orders for own truck
 * Valid statuses: pending, preparing, ready, completed, cancelled
 */
async function updateOrderStatus(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({ error: 'Access denied. Only truck owners can update order status.' });
    }

    const { orderId } = req.params;
    const { orderStatus } = req.body;

    // Validation
    if (!orderStatus) {
      return res.status(400).json({ error: 'Order status is required' });
    }

    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(orderStatus)) {
      return res.status(400).json({ 
        error: `Invalid status. Valid statuses are: ${validStatuses.join(', ')}` 
      });
    }

    // Get order with truck details
    const order = await db
      .select('o.*', 't.ownerId')
      .from({ o: 'FoodTruck.Orders' })
      .innerJoin({ t: 'FoodTruck.Trucks' }, 'o.truckId', 't.truckId')
      .where('o.orderId', orderId)
      .first();

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order belongs to owner's truck
    if (order.ownerId !== user.userId) {
      return res.status(403).json({ error: 'You can only update orders for your own truck' });
    }

    const [updatedOrder] = await db('FoodTruck.Orders')
      .where('orderId', orderId)
      .update({ orderStatus })
      .returning('*');

    return res.status(200).json({ 
      message: 'Order status updated successfully', 
      order: updatedOrder 
    });
  } catch (error) {
    console.error('Error updating order status:', error.message);
    return res.status(500).json({ error: 'Failed to update order status' });
  }
}

module.exports = {
  placeOrder,
  getCustomerOrders,
  getOrderById,
  getTruckOrders,
  updateOrderStatus
};
