import { body, param, query } from 'express-validator';

/*
|--------------------------------------------------------------------------
| Validation rules for Product Routes
|--------------------------------------------------------------------------
*/

// Validation for creating a new product
export const createProductValidator = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Product name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn(['eyeglasses', 'sunglasses', 'contact-lenses', 'lens', 'accessories'])
    .withMessage('Invalid category'),

  body('brand')
    .trim()
    .notEmpty()
    .withMessage('Brand is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Brand must be between 2 and 50 characters'),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Model must be less than 50 characters'),

  body('price')
    .notEmpty()
    .withMessage('Price is required')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('cost')
    .notEmpty()
    .withMessage('Cost is required')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),

  body('stock')
    .notEmpty()
    .withMessage('Stock quantity is required')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('frameMaterial')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Frame material must be less than 50 characters'),

  body('frameColor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Frame color must be less than 50 characters'),

  body('lensType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Lens type must be less than 50 characters'),

  body('prescription')
    .optional()
    .isBoolean()
    .withMessage('Prescription must be a boolean value')
];

// Validation for updating a product
export const updateProductValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Product name cannot be empty')
    .isLength({ min: 2, max: 100 })
    .withMessage('Product name must be between 2 and 100 characters'),

  body('category')
    .optional()
    .isIn(['eyeglasses', 'sunglasses', 'contact-lenses', 'lens', 'accessories'])
    .withMessage('Invalid category'),

  body('brand')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Brand cannot be empty')
    .isLength({ min: 2, max: 50 })
    .withMessage('Brand must be between 2 and 50 characters'),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Model must be less than 50 characters'),

  body('price')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),

  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),

  body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),

  body('reorderLevel')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Reorder level must be a non-negative integer'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),

  body('frameMaterial')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Frame material must be less than 50 characters'),

  body('frameColor')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Frame color must be less than 50 characters'),

  body('lensType')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Lens type must be less than 50 characters'),

  body('prescription')
    .optional()
    .isBoolean()
    .withMessage('Prescription must be a boolean value'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Validation for getting products with query parameters
export const getProductsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('category')
    .optional()
    .isIn(['all', 'eyeglasses', 'sunglasses', 'contact-lenses', 'lens', 'accessories'])
    .withMessage('Invalid category filter'),

  query('brand')
    .optional()
    .isIn(['all', 'ray-ban', 'oakley', 'gucci', 'prada', 'versace', 'tom-ford', 'other'])
    .withMessage('Invalid brand filter'),

  query('stockStatus')
    .optional()
    .isIn(['all', 'in-stock', 'low-stock', 'out-of-stock'])
    .withMessage('Invalid stock status filter'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum price must be a positive number'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum price must be a positive number'),

  query('tags')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Tags query must be between 1 and 200 characters'),

  query('prescription')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Prescription must be true or false'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'name', 'price', 'stock', 'category', 'brand', 'totalSold', 'sku'])
    .withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Validation for product ID parameter
export const productIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid product ID')
];

// Validation for bulk stock update
export const bulkUpdateStockValidator = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array'),

  body('updates.*.id')
    .isMongoId()
    .withMessage('Invalid product ID in updates'),

  body('updates.*.stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer')
];