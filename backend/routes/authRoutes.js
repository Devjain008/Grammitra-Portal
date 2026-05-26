import express from 'express';
import { registerUser, loginUser, getUserProfile, getVillageReportController, updateUserProfile, getGlobalStats, getVillageFacilities } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import profileUpload from '../middleware/profileUploadMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.get('/village-report', protect, getVillageReportController);
router.get('/global-stats', protect, getGlobalStats);
router.get('/facilities', protect, getVillageFacilities);


// Public route for profile image upload during registration or profile edit before login
router.post('/upload-profile', profileUpload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    res.status(200).json({ imageUrl });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;