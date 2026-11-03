import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  sku: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['eyeglasses', 'sunglasses', 'contact-lenses', 'lens', 'accessories']
  },
  brand: {
    type: String,
    required: true,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    required: true,
    min: 0
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reorderLevel: {
    type: Number,
    min: 0,
    default: 10
  },
  description: {
    type: String,
    trim: true
  },
  frameMaterial: {
    type: String,
    trim: true
  },
  frameColor: {
    type: String,
    trim: true
  },
  lensType: {
    type: String,
    trim: true
  },
  prescription: {
    type: Boolean,
    default: false
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: ''
    },
    isPrimary: {
      type: Boolean,
      default: false
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  weight: {
    type: Number,
    min: 0
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  supplier: {
    type: String,
    trim: true
  },
  barcode: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastStockUpdate: {
    type: Date,
    default: Date.now
  },
  totalSold: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for performance
productSchema.index({ name: 'text', brand: 'text', model: 'text', description: 'text' });
productSchema.index({ category: 1, brand: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ isActive: 1, stock: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ totalSold: -1 });

// Virtual for profit margin
productSchema.virtual('profitMargin').get(function() {
  if (this.price === 0) return 0;
  return ((this.price - this.cost) / this.price) * 100;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out-of-stock';
  if (this.stock <= this.reorderLevel) return 'low-stock';
  return 'in-stock';
});

// Virtual for primary image
productSchema.virtual('primaryImage').get(function() {
  const primary = this.images.find(img => img.isPrimary);
  return primary || (this.images.length > 0 ? this.images[0] : null);
});

// Virtual for stock value
productSchema.virtual('stockValue').get(function() {
  return this.stock * this.cost;
});

// Virtual for availability
productSchema.virtual('isAvailable').get(function() {
  return this.isActive && this.stock > 0;
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', async function(next) {
  if (!this.sku) {
    try {
      const counter = await mongoose.model('Counter').findOneAndUpdate(
        { name: 'productSKU' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      this.sku = `PRD${String(counter.seq).padStart(6, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Pre-save middleware to update lastStockUpdate
productSchema.pre('save', function(next) {
  if (this.isModified('stock')) {
    this.lastStockUpdate = new Date();
  }
  next();
});

// Static method to get low stock products
productSchema.statics.getLowStockProducts = function() {
  return this.find({
    isActive: true,
    $expr: {
      $and: [
        { $gt: ['$stock', 0] },
        { $lte: ['$stock', '$reorderLevel'] }
      ]
    }
  }).sort({ stock: 1 });
};

// Static method to get out of stock products
productSchema.statics.getOutOfStockProducts = function() {
  return this.find({
    isActive: true,
    stock: 0
  }).sort({ name: 1 });
};

// Instance method to update stock
productSchema.methods.updateStock = function(newStock, reason = '') {
  const oldStock = this.stock;
  this.stock = newStock;
  this.lastStockUpdate = new Date();

  // Could add stock history tracking here
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
