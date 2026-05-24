import express from 'express';
import { 
  createBusiness, addProduct, getProducts, getMyBusiness, deleteProduct,
  createOrder, getBuyerOrders, getShopkeeperOrders, updateOrderStatus,
  getBusinesses, getMyBusinesses, addProductReview
} from '../controllers/marketController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/products', getProducts);
router.get('/businesses', getBusinesses);
router.get('/my-businesses', protect, getMyBusinesses);
router.get('/my-business', protect, getMyBusiness);
router.post('/business', protect, createBusiness);
router.post('/product', protect, addProduct);
router.delete('/product/:id', protect, deleteProduct);
router.post('/products/:id/review', protect, addProductReview);

// Orders routes
router.post('/orders', protect, createOrder);
router.get('/orders/buyer', protect, getBuyerOrders);
router.get('/orders/shopkeeper', protect, getShopkeeperOrders);
router.put('/orders/:id/status', protect, updateOrderStatus);

export default router;