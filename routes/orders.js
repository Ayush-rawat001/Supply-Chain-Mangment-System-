const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Get all orders with product information (admin sees all, users see their own)
router.get('/', requireAuth, async (req, res) => {
    try {
        let orders;
        if (req.user.role === 'admin') {
            // Admin can see all orders
            orders = await Order.find()
                .populate('productId', 'name SKU price')
                .sort({ createdAt: -1 });
        } else {
            // Users can only see their own orders
            orders = await Order.find({ userId: req.user._id })
                .populate('productId', 'name SKU price')
                .sort({ createdAt: -1 });
        }
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order by ID (admin can see any, users can only see their own)
router.get('/:id', requireAuth, async (req, res) => {
    try {
        let order;
        if (req.user.role === 'admin') {
            // Admin can see any order
            order = await Order.findById(req.params.id)
                .populate('productId', 'name SKU price description');
        } else {
            // Users can only see their own orders
            order = await Order.findOne({ 
                _id: req.params.id, 
                userId: req.user._id 
            }).populate('productId', 'name SKU price description');
        }
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        res.json(order);
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create new order (all authenticated users can create orders)
router.post('/', requireAuth, async (req, res) => {
    try {
        const {
            productId,
            quantity,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            notes
        } = req.body;

        if (!productId || !quantity || !customerName || !shippingAddress) {
            return res.status(400).json({ 
                error: 'ProductId, quantity, customerName, and shippingAddress are required' 
            });
        }

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(400).json({ error: 'Product not found' });
        }

        // Calculate total amount
        const totalAmount = product.price * quantity;

        const order = new Order({
            productId,
            quantity,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            totalAmount,
            notes,
            status: 'pending',
            userId: req.user._id // Associate order with user
        });

        await order.save();
        
        // Populate product info before sending response
        await order.populate('productId', 'name SKU price');
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order (admin can update any, users can only update their own)
router.put('/:id', requireAuth, async (req, res) => {
    try {
        const {
            productId,
            quantity,
            status,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            notes
        } = req.body;

        // Check if user can update this order
        let order;
        if (req.user.role === 'admin') {
            order = await Order.findById(req.params.id);
        } else {
            order = await Order.findOne({ 
                _id: req.params.id, 
                userId: req.user._id 
            });
        }

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Check if product exists if productId is being updated
        if (productId) {
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(400).json({ error: 'Product not found' });
            }
        }

        // Calculate total amount if product or quantity is being updated
        let totalAmount;
        if (productId || quantity) {
            const product = await Product.findById(productId || req.body.productId);
            if (product) {
                totalAmount = product.price * (quantity || req.body.quantity);
            }
        }

        const updateData = {
            productId,
            quantity,
            status,
            customerName,
            customerEmail,
            customerPhone,
            shippingAddress,
            notes,
            updatedAt: Date.now()
        };

        if (totalAmount !== undefined) {
            updateData.totalAmount = totalAmount;
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('productId', 'name SKU price');

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Delete order (admin only)
router.delete('/:id', requireAuth, requireAdmin, async (req, res) => {
    try {
        const order = await Order.findByIdAndDelete(req.params.id);
        
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// Update order status (admin can update any, users can only update their own)
router.patch('/:id/status', requireAuth, async (req, res) => {
    try {
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({ error: 'Status is required' });
        }

        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        // Check if user can update this order
        let order;
        if (req.user.role === 'admin') {
            order = await Order.findById(req.params.id);
        } else {
            order = await Order.findOne({ 
                _id: req.params.id, 
                userId: req.user._id 
            });
        }

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status, updatedAt: Date.now() },
            { new: true, runValidators: true }
        ).populate('productId', 'name SKU price');

        res.json(updatedOrder);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

module.exports = router; 