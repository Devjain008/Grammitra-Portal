import express from 'express';
import { getSeasonalDiseases, askHealthAI, createSeasonalDisease } from '../controllers/healthController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/diseases', getSeasonalDiseases);
router.post('/diseases', protect, admin, createSeasonalDisease);
router.post('/ask', askHealthAI);

export default router;