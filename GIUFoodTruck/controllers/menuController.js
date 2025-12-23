// controllers/menuController.js
const db = require('../connectors/db');

/**
 * Get menu items for a specific truck
 * Accessible by all authenticated users
 */
async function getTruckMenu(req, res) {
  try {
    const { truckId, category } = req.params;

    // 1) Make sure truck exists
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('truckId', truckId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    // 2) Base query: all items for that truck
    let query = db('MenuItems')
      .withSchema('FoodTruck')
      .where('truckId', truckId);

    // 3) If category is present in URL, filter by it
    if (category) {
      query = query.andWhere('category', category);
    }

    // 4) Order nicely
    const menuItems = await query
      .orderBy('category', 'asc')
      .orderBy('name', 'asc');

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
}


/**
 * Get menu items for truck owner's own truck
 * TruckOwner only
 */
async function getMyTruckMenu(req, res) {
  try {
    const user = req.user;   // ✅ already set by authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({
        error: 'Access denied. Only truck owners can access this endpoint.'
      });
    }

    // Get owner's truck
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('ownerId', user.userId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'No truck found for this owner' });
    }

    const menuItems = await db('MenuItems')
      .withSchema('FoodTruck')
      .where('truckId', truck.truckId)
      .orderBy('category', 'asc')
      .orderBy('name', 'asc');

    return res.status(200).json(menuItems);
  } catch (error) {
    console.error('Error fetching menu:', error);
    return res.status(500).json({ error: 'Failed to fetch menu' });
  }
}

/**
 * Add a menu item (TruckOwner only)
 */
async function addMenuItem(req, res) {
  try {
    const user = req.user;   // ✅ from authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({
        error: 'Access denied. Only truck owners can add menu items.'
      });
    }

    // Get owner's truck
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('ownerId', user.userId)
      .first();

    if (!truck) {
      return res.status(404).json({
        error: 'You must create a truck before adding menu items'
      });
    }

    const { name, description, price, category, status } = req.body;

    // Validation
    if (!name || !price || !category) {
      return res.status(400).json({
        error: 'Name, price, and category are required'
      });
    }

    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        error: 'Price must be a positive number'
      });
    }

    const newMenuItem = {
      truckId: truck.truckId,
      name,
      description: description || null,
      price: parseFloat(price),
      category,
      status: status || 'available',
    };

    const [menuItem] = await db('MenuItems')
      .withSchema('FoodTruck')
      .insert(newMenuItem)
      .returning('*');

    return res
      .status(201)
      .json({ message: 'Menu item added successfully', menuItem });
  } catch (error) {
    console.error('Error adding menu item:', error);
    return res.status(500).json({ error: 'Failed to add menu item' });
  }
}

/**
 * Update a menu item (TruckOwner only - can only update own truck's items)
 */
async function updateMenuItem(req, res) {
  try {
    const user = req.user;   // ✅ from authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({
        error: 'Access denied. Only truck owners can update menu items.'
      });
    }

    const { itemId } = req.params;
    const { name, description, price, category, status } = req.body;

    // Get the menu item
    const menuItem = await db('MenuItems')
      .withSchema('FoodTruck')
      .where('itemId', itemId)
      .first();

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if the menu item belongs to the owner's truck
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('truckId', menuItem.truckId)
      .first();

    if (!truck || truck.ownerId !== user.userId) {
      return res.status(403).json({
        error: 'You can only update menu items from your own truck'
      });
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({
        error: 'Price must be a positive number'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const [updatedMenuItem] = await db('MenuItems')
      .withSchema('FoodTruck')
      .where('itemId', itemId)
      .update(updateData)
      .returning('*');

    return res.status(200).json({
      message: 'Menu item updated successfully',
      menuItem: updatedMenuItem,
    });
  } catch (error) {
    console.error('Error updating menu item:', error);
    return res.status(500).json({ error: 'Failed to update menu item' });
  }
}

/**
 * Delete a menu item (TruckOwner only - can only delete own truck's items)
 */
async function deleteMenuItem(req, res) {
  try {
    const user = req.user;   // ✅ from authMiddleware

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({
        error: 'Access denied. Only truck owners can delete menu items.'
      });
    }

    const { itemId } = req.params;

    // Get the menu item
    const menuItem = await db('MenuItems')
      .withSchema('FoodTruck')
      .where('itemId', itemId)
      .first();

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if the menu item belongs to the owner's truck
    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('truckId', menuItem.truckId)
      .first();

    if (!truck || truck.ownerId !== user.userId) {
      return res.status(403).json({
        error: 'You can only delete menu items from your own truck'
      });
    }

    await db('MenuItems')
      .withSchema('FoodTruck')
      .where('itemId', itemId)
      .delete();

    return res.status(200).json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Error deleting menu item:', error);
    return res.status(500).json({ error: 'Failed to delete menu item' });
  }
}

module.exports = {
  getTruckMenu,
  getMyTruckMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
