import express from 'express';
import { getVillagePerformance, getGrowthMetrics } from '../controllers/adminController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/village-performance', protect, admin, getVillagePerformance);
router.get('/growth-metrics', protect, admin, getGrowthMetrics);

export default router;
