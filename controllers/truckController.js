const db = require('../connectors/db');
const { getUser } = require('../utils/session');

/**
 * Get all available trucks (Customer view)
 * Accessible by all authenticated users
 */
async function getAllTrucks(req, res) {
  try {
    const trucks = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('truckStatus', 'available')
      .orderBy('createdAt', 'desc');

    return res.status(200).json(trucks);
  } catch (error) {
    console.error('Error fetching trucks:', error.message);
    return res.status(500).json({ error: 'Failed to fetch trucks' });
  }
}

/**
 * Get specific truck by ID
 * Accessible by all authenticated users
 */
async function getTruckById(req, res) {
  try {
    const { truckId } = req.params;

    const truck = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('truckId', truckId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    return res.status(200).json(truck);
  } catch (error) {
    console.error('Error fetching truck:', error.message);
    return res.status(500).json({ error: 'Failed to fetch truck' });
  }
}

/**
 * Get truck owned by current user (TruckOwner only)
 */
async function getMyTruck(req, res) {
  try {
    // ✅ user is already attached by authMiddleware
    const user = req.user;

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({
        error: 'Access denied. Only truck owners can access this endpoint.',
      });
    }

    const truck = await db('Trucks')
      .withSchema('FoodTruck')
      .where('ownerId', user.userId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'No truck found for this owner' });
    }

    return res.status(200).json(truck);
  } catch (error) {
    console.error('Error fetching owned truck:', error.message);
    return res.status(500).json({ error: 'Failed to fetch truck' });
  }
}


/**
 * Create a new truck (TruckOwner only)
 * Only one truck per owner allowed
 */
async function createTruck(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({ error: 'Access denied. Only truck owners can create trucks.' });
    }

    // Check if owner already has a truck
    const existingTruck = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('ownerId', user.userId)
      .first();

    if (existingTruck) {
      return res.status(400).json({ error: 'You already have a truck. Only one truck per owner is allowed.' });
    }

    const { truckName, truckLogo, truckStatus, orderStatus } = req.body;

    // Validation
    if (!truckName) {
      return res.status(400).json({ error: 'Truck name is required' });
    }

    // Check if truck name is unique
    const nameExists = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('truckName', truckName)
      .first();

    if (nameExists) {
      return res.status(400).json({ error: 'Truck name already exists' });
    }

    const newTruck = {
      truckName,
      truckLogo: truckLogo || null,
      ownerId: user.userId,
      truckStatus: truckStatus || 'available',
      orderStatus: orderStatus || 'available'
    };

    const [truck] = await db('FoodTruck.Trucks').insert(newTruck).returning('*');

    return res.status(201).json({ message: 'Truck created successfully', truck });
  } catch (error) {
    console.error('Error creating truck:', error.message);
    return res.status(500).json({ error: 'Failed to create truck' });
  }
}

/**
 * Update truck (TruckOwner only - can only update own truck)
 */
async function updateTruck(req, res) {
  try {
    const user = req.user;


    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'truckOwner') {
      return res.status(403).json({ error: 'Access denied. Only truck owners can update trucks.' });
    }

    const { truckId } = req.params;
    const { truckName, truckLogo, truckStatus, orderStatus } = req.body;

    // Check if truck exists and belongs to the user
    const truck = await db.select('*')
      .from('FoodTruck.Trucks')
      .where('truckId', truckId)
      .first();

    if (!truck) {
      return res.status(404).json({ error: 'Truck not found' });
    }

    if (truck.ownerId !== user.userId) {
      return res.status(403).json({ error: 'You can only update your own truck' });
    }

    // If updating truckName, check uniqueness
    if (truckName && truckName !== truck.truckName) {
      const nameExists = await db.select('*')
        .from('FoodTruck.Trucks')
        .where('truckName', truckName)
        .first();

      if (nameExists) {
        return res.status(400).json({ error: 'Truck name already exists' });
      }
    }

    const updateData = {};
    if (truckName !== undefined) updateData.truckName = truckName;
    if (truckLogo !== undefined) updateData.truckLogo = truckLogo;
    if (truckStatus !== undefined) updateData.truckStatus = truckStatus;
    if (orderStatus !== undefined) updateData.orderStatus = orderStatus;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const [updatedTruck] = await db('FoodTruck.Trucks')
      .where('truckId', truckId)
      .update(updateData)
      .returning('*');

    return res.status(200).json({ message: 'Truck updated successfully', truck: updatedTruck });
  } catch (error) {
    console.error('Error updating truck:', error.message);
    return res.status(500).json({ error: 'Failed to update truck' });
  }
}

module.exports = {
  getAllTrucks,
  getTruckById,
  getMyTruck,
  createTruck,
  updateTruck
};
