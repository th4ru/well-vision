import express from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  bulkUpdateStock,
  getProductCategories,
  getLowStockAlerts,
  getOutOfStockProducts,
  getProductAnalytics,
  exportProducts,
  updateProductStock
} from '../controllers/productController.js';
import userAuth from '../middleware/userAuth.js';
import validateRequest from '../middleware/validateRequest.js';
import {
  createProductValidator,
  updateProductValidator,
  getProductsValidator,
  productIdValidator,
  bulkUpdateStockValidator
} from '../validators/productValidator.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Analytics and statistics
router.get('/analytics', getProductAnalytics);
router.get('/stats', getProductStats);
router.get('/categories', getProductCategories);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/alerts/out-of-stock', getOutOfStockProducts);

// Export products
router.get('/export', exportProducts);

// Get all products with filtering and pagination
router.get('/', getProductsValidator, validateRequest, getProducts);

// Get single product
router.get('/:id', productIdValidator, validateRequest, getProductById);

// Create new product
router.post('/', createProductValidator, validateRequest, createProduct);

// Update product
router.put('/:id', updateProductValidator, validateRequest, updateProduct);

// Update product stock
router.patch('/:id/stock', productIdValidator, validateRequest, updateProductStock);

// Delete product (soft delete)
router.delete('/:id', productIdValidator, validateRequest, deleteProduct);

// Bulk operations
router.put('/bulk/stock', bulkUpdateStockValidator, validateRequest, bulkUpdateStock);

export default router;
