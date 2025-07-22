const express = require('express');
const router = express.Router();
const Supplier = require('../models/Supplier');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all suppliers (admin only)
router.get('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.json(suppliers);
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ error: 'Failed to fetch suppliers' });
    }
});

// Get single supplier by ID (admin only)
router.get('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }
        res.json(supplier);
    } catch (error) {
        console.error('Error fetching supplier:', error);
        res.status(500).json({ error: 'Failed to fetch supplier' });
    }
});

// Create new supplier (admin only)
router.post('/', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, contact, address, email, phone } = req.body;

        if (!name || !contact || !address) {
            return res.status(400).json({ 
                error: 'Name, contact, and address are required' 
            });
        }

        const supplier = new Supplier({
            name,
            contact,
            address,
            email,
            phone
        });

        await supplier.save();
        res.status(201).json(supplier);
    } catch (error) {
        console.error('Error creating supplier:', error);
        res.status(500).json({ error: 'Failed to create supplier' });
    }
});

// Update supplier (admin only)
router.put('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const { name, contact, address, email, phone } = req.body;

        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            {
                name,
                contact,
                address,
                email,
                phone,
                updatedAt: Date.now()
            },
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json(supplier);
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ error: 'Failed to update supplier' });
    }
});

// Delete supplier (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndDelete(req.params.id);
        
        if (!supplier) {
            return res.status(404).json({ error: 'Supplier not found' });
        }

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ error: 'Failed to delete supplier' });
    }
});

module.exports = router; 