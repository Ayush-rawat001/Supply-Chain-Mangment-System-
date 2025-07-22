const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
       
    },
    availableStock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    reservedStock: {
        type: Number,
        default: 0,
        min: 0
    },
    minimumStock: {
        type: Number,
        default: 0,
        min: 0
    },
    maximumStock: {
        type: Number,
        min: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    location: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Update the lastUpdated field before saving
inventorySchema.pre('save', function(next) {
    this.lastUpdated = Date.now();
    next();
});

// Compound unique index to allow one inventory per product per user
inventorySchema.index({ productId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Inventory', inventorySchema); 