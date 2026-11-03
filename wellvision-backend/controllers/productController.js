import Product from '../models/productModel.js';

// Get all products with enhanced filtering and pagination
export const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      category = '',
      brand = '',
      stockStatus = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      minPrice,
      maxPrice,
      tags,
      prescription
    } = req.query;

    // Build filter object
    let filter = { isActive: true };

    // Enhanced search functionality
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (brand && brand !== 'all') {
      filter.brand = brand;
    }

    // Price range filter
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }

    // Prescription filter
    if (prescription !== undefined) {
      filter.prescription = prescription === 'true';
    }

    // Stock status filter
    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'in-stock':
          filter.$expr = { $gt: ['$stock', '$reorderLevel'] };
          break;
        case 'low-stock':
          filter.$and = [
            { stock: { $gt: 0 } },
            { $expr: { $lte: ['$stock', '$reorderLevel'] } }
          ];
          break;
        case 'out-of-stock':
          filter.stock = 0;
          break;
      }
    }

    // Build sort object
    const sort = {};
    const validSortFields = ['createdAt', 'name', 'price', 'stock', 'category', 'brand', 'totalSold', 'sku'];
    if (validSortFields.includes(sortBy)) {
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort
    }

    // Execute query with pagination
    const products = await Product.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('-__v')
      .populate(); // Add any population if needed

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalProducts: total,
        hasNext: parseInt(page) * parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      },
      filters: {
        applied: {
          search: search || null,
          category: category || null,
          brand: brand || null,
          stockStatus: stockStatus || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          tags: tags || null,
          prescription: prescription || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      price: parseFloat(req.body.price),
      cost: parseFloat(req.body.cost),
      stock: parseInt(req.body.stock),
      reorderLevel: parseInt(req.body.reorderLevel) || 10,
      // Handle optional fields
      weight: req.body.weight ? parseFloat(req.body.weight) : undefined,
      dimensions: req.body.dimensions ? {
        length: req.body.dimensions.length ? parseFloat(req.body.dimensions.length) : undefined,
        width: req.body.dimensions.width ? parseFloat(req.body.dimensions.width) : undefined,
        height: req.body.dimensions.height ? parseFloat(req.body.dimensions.height) : undefined
      } : undefined,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : [],
      images: req.body.images || []
    };

    // Remove undefined values
    Object.keys(productData).forEach(key => {
      if (productData[key] === undefined) {
        delete productData[key];
      }
    });

    // If dimensions object is empty, remove it
    if (productData.dimensions && Object.values(productData.dimensions).every(val => val === undefined)) {
      delete productData.dimensions;
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      product: {
        ...product.toObject(),
        profitMargin: product.profitMargin,
        stockStatus: product.stockStatus,
        stockValue: product.stockValue,
        isAvailable: product.isAvailable,
        primaryImage: product.primaryImage
      },
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);

    // Handle duplicate SKU error
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a unique SKU.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const updateData = {
      ...req.body,
      price: req.body.price ? parseFloat(req.body.price) : undefined,
      cost: req.body.cost ? parseFloat(req.body.cost) : undefined,
      stock: req.body.stock ? parseInt(req.body.stock) : undefined,
      reorderLevel: req.body.reorderLevel ? parseInt(req.body.reorderLevel) : undefined,
      // Handle optional fields
      weight: req.body.weight ? parseFloat(req.body.weight) : undefined,
      dimensions: req.body.dimensions ? {
        length: req.body.dimensions.length ? parseFloat(req.body.dimensions.length) : undefined,
        width: req.body.dimensions.width ? parseFloat(req.body.dimensions.width) : undefined,
        height: req.body.dimensions.height ? parseFloat(req.body.dimensions.height) : undefined
      } : undefined,
      tags: req.body.tags ? (Array.isArray(req.body.tags) ? req.body.tags : [req.body.tags]) : undefined,
      images: req.body.images || undefined
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    // If dimensions object is empty, remove it
    if (updateData.dimensions && Object.values(updateData.dimensions).every(val => val === undefined)) {
      delete updateData.dimensions;
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        profitMargin: product.profitMargin,
        stockStatus: product.stockStatus,
        stockValue: product.stockValue,
        isAvailable: product.isAvailable,
        primaryImage: product.primaryImage
      },
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);

    // Handle duplicate SKU error
    if (error.code === 11000 && error.keyPattern?.sku) {
      return res.status(400).json({
        success: false,
        message: 'SKU already exists. Please use a unique SKU.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete product (soft delete)
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get product statistics
export const getProductStats = async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$reorderLevel'] }] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: {
              $cond: [{ $eq: ['$stock', 0] }, 1, 0]
            }
          },
          inStockCount: {
            $sum: {
              $cond: [{ $gt: ['$stock', '$reorderLevel'] }, 1, 0]
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalProducts: 0,
      totalValue: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inStockCount: 0
    };

    res.status(200).json({
      success: true,
      stats: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Bulk update stock
export const bulkUpdateStock = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, stock }

    const bulkOps = updates.map(update => ({
      updateOne: {
        filter: { _id: update.id },
        update: {
          stock: parseInt(update.stock),
          lastStockUpdate: new Date()
        }
      }
    }));

    const result = await Product.bulkWrite(bulkOps);

    res.status(200).json({
      success: true,
      message: `Stock updated for ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Error bulk updating stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get product categories and brands
export const getProductCategories = async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    const brands = await Product.distinct('brand', { isActive: true });
    const tags = await Product.distinct('tags', { isActive: true });

    // Flatten tags array
    const flattenedTags = [...new Set(tags.flat())];

    res.status(200).json({
      success: true,
      data: {
        categories: categories.sort(),
        brands: brands.sort(),
        tags: flattenedTags.sort()
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get low stock alerts
export const getLowStockAlerts = async (req, res) => {
  try {
    const lowStockProducts = await Product.getLowStockProducts()
      .select('name sku stock reorderLevel category brand')
      .limit(50);

    res.status(200).json({
      success: true,
      alerts: lowStockProducts,
      count: lowStockProducts.length
    });
  } catch (error) {
    console.error('Error fetching low stock alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock alerts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get out of stock products
export const getOutOfStockProducts = async (req, res) => {
  try {
    const outOfStockProducts = await Product.getOutOfStockProducts()
      .select('name sku category brand lastStockUpdate')
      .limit(50);

    res.status(200).json({
      success: true,
      products: outOfStockProducts,
      count: outOfStockProducts.length
    });
  } catch (error) {
    console.error('Error fetching out of stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch out of stock products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get product analytics
export const getProductAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          averagePrice: { $avg: '$price' },
          averageCost: { $avg: '$cost' },
          totalStock: { $sum: '$stock' },
          lowStockCount: {
            $sum: {
              $cond: [
                { $and: [{ $gt: ['$stock', 0] }, { $lte: ['$stock', '$reorderLevel'] }] },
                1,
                0
              ]
            }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$stock', 0] }, 1, 0] }
          },
          inStockCount: {
            $sum: { $cond: [{ $gt: ['$stock', '$reorderLevel'] }, 1, 0] }
          },
          topSelling: { $max: '$totalSold' },
          recentlyAdded: {
            $sum: {
              $cond: [{ $gte: ['$createdAt', startDate] }, 1, 0]
            }
          }
        }
      }
    ]);

    const categoryBreakdown = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } },
          averagePrice: { $avg: '$price' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const brandBreakdown = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$brand',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$stock', '$cost'] } }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const result = analytics[0] || {
      totalProducts: 0,
      totalValue: 0,
      averagePrice: 0,
      averageCost: 0,
      totalStock: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
      inStockCount: 0,
      topSelling: 0,
      recentlyAdded: 0
    };

    res.status(200).json({
      success: true,
      analytics: result,
      breakdowns: {
        categories: categoryBreakdown,
        brands: brandBreakdown
      },
      period
    });
  } catch (error) {
    console.error('Error fetching product analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product analytics',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export products to CSV
export const exportProducts = async (req, res) => {
  try {
    const {
      category = '',
      brand = '',
      stockStatus = '',
      format = 'csv'
    } = req.query;

    // Build filter
    let filter = { isActive: true };

    if (category && category !== 'all') filter.category = category;
    if (brand && brand !== 'all') filter.brand = brand;

    if (stockStatus && stockStatus !== 'all') {
      switch (stockStatus) {
        case 'in-stock':
          filter.$expr = { $gt: ['$stock', '$reorderLevel'] };
          break;
        case 'low-stock':
          filter.$and = [
            { stock: { $gt: 0 } },
            { $expr: { $lte: ['$stock', '$reorderLevel'] } }
          ];
          break;
        case 'out-of-stock':
          filter.stock = 0;
          break;
      }
    }

    const products = await Product.find(filter)
      .select('sku name category brand model price cost stock reorderLevel description')
      .sort({ category: 1, name: 1 });

    if (format === 'csv') {
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');

      // CSV header
      let csv = 'SKU,Name,Category,Brand,Model,Price,Cost,Stock,Reorder Level,Description\n';

      // CSV rows
      products.forEach(product => {
        csv += `"${product.sku || ''}","${product.name}","${product.category}","${product.brand}","${product.model || ''}",${product.price},${product.cost},${product.stock},${product.reorderLevel},"${product.description || ''}"\n`;
      });

      res.send(csv);
    } else {
      // JSON export
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="products.json"');
      res.json({ products, exportedAt: new Date() });
    }
  } catch (error) {
    console.error('Error exporting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Update product stock with history tracking
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock, reason = 'Manual update' } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const oldStock = product.stock;
    product.stock = parseInt(stock);
    product.lastStockUpdate = new Date();

    await product.save();

    res.status(200).json({
      success: true,
      product: {
        ...product.toObject(),
        stockStatus: product.stockStatus,
        stockValue: product.stockValue
      },
      message: `Stock updated from ${oldStock} to ${stock}`,
      change: {
        oldStock,
        newStock: product.stock,
        difference: product.stock - oldStock,
        reason
      }
    });
  } catch (error) {
    console.error('Error updating product stock:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
