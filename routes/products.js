const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all products with supplier information (all authenticated users)
router.get('/', requireAuth, async (req, res) => {
    try {
        const products = await Product.find()
            .populate('supplierId', 'name contact')
            .sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product by ID (all authenticated users)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('supplierId', 'name contact address email phone');
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Create new product (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, SKU, supplierId, quantity, price, description, category } = req.body;

        if (!name || !SKU || !supplierId || price === undefined) {
            return res.status(400).json({ 
                error: 'Name, SKU, supplierId, and price are required' 
            });
        }

        // Check if supplier exists
        const supplier = await Supplier.findById(supplierId);
        if (!supplier) {
            return res.status(400).json({ error: 'Supplier not found' });
        }

        // Check if SKU already exists
        const existingProduct = await Product.findOne({ SKU });
        if (existingProduct) {
            return res.status(400).json({ error: 'SKU already exists' });
        }

        const product = new Product({
            name,
            SKU,
            supplierId,
            quantity: quantity || 0,
            price,
            description,
            category
        });

        await product.save();
        
        // Populate supplier info before sending response
        await product.populate('supplierId', 'name contact');
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// Update product (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, SKU, supplierId, quantity, price, description, category } = req.body;

        // Check if supplier exists if supplierId is being updated
        if (supplierId) {
            const supplier = await Supplier.findById(supplierId);
            if (!supplier) {
                return res.status(400).json({ error: 'Supplier not found' });
            }
        }

        // Check if SKU already exists (excluding current product)
        if (SKU) {
            const existingProduct = await Product.findOne({ 
                SKU, 
                _id: { $ne: req.params.id } 
            });
            if (existingProduct) {
                return res.status(400).json({ error: 'SKU already exists' });
            }
        }

        const product = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name,
                SKU,
                supplierId,
                quantity,
                price,
                description,
                category,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        ).populate('supplierId', 'name contact');

        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// Delete product (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
    }
});

module.exports = router; 