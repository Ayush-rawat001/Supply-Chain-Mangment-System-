const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all inventory with product information (all authenticated users)
router.get('/', requireAuth, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }
        const inventory = await Inventory.find(query)
            .populate('productId', 'name SKU price')
            .sort({ lastUpdated: -1 });
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Get single inventory item by ID (all authenticated users)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const inventory = await Inventory.findById(req.params.id)
            .populate('productId', 'name SKU price description');
        
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        // Only allow admin or owner to view
        if (req.user.role !== 'admin' && String(inventory.userId) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to view this inventory item' });
        }
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Get inventory by product ID (all authenticated users)
router.get('/product/:productId', requireAuth, async (req, res) => {
    try {
        let query = { productId: req.params.productId };
        if (req.user.role !== 'admin') {
            query.userId = req.user._id;
        }
        const inventory = await Inventory.findOne(query)
            .populate('productId', 'name SKU price description');
        
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found for this product' });
        }
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory by product:', error);
        res.status(500).json({ error: 'Failed to fetch inventory' });
    }
});

// Create new inventory item (admin only)
router.post('/',requireAuth, async (req, res) => {
    try {
        const {
            productId,
            availableStock,
            reservedStock,
            minimumStock,
            maximumStock,
            location,
            notes
        } = req.body;

        if (!productId || availableStock === undefined) {
            return res.status(400).json({ 
                error: 'ProductId and availableStock are required' 
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        // Check if inventory already exists for this product
        const existingInventory = await Inventory.findOne({ productId, userId: req.user._id });
        if (existingInventory) {
            return res.status(400).json({ error: 'Inventory already exists for this product' });
        }

        const inventory = new Inventory({
            productId,
            availableStock: availableStock || 0,
            reservedStock: reservedStock || 0,
            minimumStock: minimumStock || 0,
            maximumStock,
            location,
            notes,
            userId: req.user._id // Set owner
        });

        await inventory.save();
        
        // Populate product info before sending response
        await inventory.populate('productId', 'name SKU price');
        res.status(201).json(inventory);
    } catch (error) {
        console.error('Error creating inventory:', error);
        res.status(500).json({ error: 'Failed to create inventory' });
    }
});

// Update inventory (admin or owner only)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        // Allow if admin or owner
        if (req.user.role !== 'admin' && String(inventory.userId) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to edit this inventory item' });
        }
        const {
            availableStock,
            reservedStock,
            minimumStock,
            maximumStock,
            location,
            notes
        } = req.body;
        inventory.availableStock = availableStock;
        inventory.reservedStock = reservedStock;
        inventory.minimumStock = minimumStock;
        inventory.maximumStock = maximumStock;
        inventory.location = location;
        inventory.notes = notes;
        inventory.lastUpdated = Date.now();
        await inventory.save();
        await inventory.populate('productId', 'name SKU price');
        res.json(inventory);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Failed to update inventory' });
    }
});


router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const inventory = await Inventory.findByIdAndDelete(req.params.id);
        
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }

        res.json({ message: 'Inventory item deleted successfully' });
    } catch (error) {
        console.error('Error deleting inventory:', error);
        res.status(500).json({ error: 'Failed to delete inventory' });
    }
});

// Update stock levels (admin or owner only)
router.patch('/:id/stock', requireAuth, async (req, res) => {
    try {
        const inventory = await Inventory.findById(req.params.id);
        if (!inventory) {
            return res.status(404).json({ error: 'Inventory item not found' });
        }
        // Allow if admin or owner
        if (req.user.role !== 'admin' && String(inventory.userId) !== String(req.user._id)) {
            return res.status(403).json({ error: 'Not authorized to update stock for this inventory item' });
        }
        const { availableStock, reservedStock } = req.body;

        if (availableStock === undefined && reservedStock === undefined) {
            return res.status(400).json({ error: 'At least one stock field is required' });
        }

        if (availableStock !== undefined) inventory.availableStock = availableStock;
        if (reservedStock !== undefined) inventory.reservedStock = reservedStock;
        inventory.lastUpdated = Date.now();
        await inventory.save();
        await inventory.populate('productId', 'name SKU price');
        res.json(inventory);
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({ error: 'Failed to update stock' });
    }
});

// Get low stock items (all authenticated users)
router.get('/low-stock/items', requireAuth, async (req, res) => {
    try {
        const lowStockItems = await Inventory.find({
            $expr: { $lte: ['$availableStock', '$minimumStock'] }
        }).populate('productId', 'name SKU price');

        res.json(lowStockItems);
    } catch (error) {
        console.error('Error fetching low stock items:', error);
        res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
});

module.exports = router; 