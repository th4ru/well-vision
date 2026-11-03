import express from 'express';
import { getOrders, getOrderById, updateOrderStatus, createOrder, deleteOrder, previewOrderNumber, collectOrder, getPendingOrders } from '../controllers/orderController.js';
import userAuth from '../middleware/userAuth.js';

const router = express.Router();

// All routes require authentication
router.use(userAuth);

// Preview next order number (does NOT increment counter)
router.get('/preview-order-no', userAuth, previewOrderNumber);

router.get('/', getOrders);
router.get('/pending', getPendingOrders);
router.post('/', createOrder);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:id/collect', collectOrder);
router.delete('/:id', deleteOrder);

export default router;
