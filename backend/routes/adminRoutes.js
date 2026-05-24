import express from 'express';
import { getVillagePerformance } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/village-performance', protect, admin, getVillagePerformance);

export default router;
