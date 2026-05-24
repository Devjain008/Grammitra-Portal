import express from 'express';
import { registerUser, loginUser, getUserProfile, getVillageReportController, updateUserProfile, getGlobalStats } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/village-report', protect, getVillageReportController);
router.get('/global-stats', protect, getGlobalStats);

export default router;