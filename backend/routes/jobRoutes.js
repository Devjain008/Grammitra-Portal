import express from 'express';
import { createJob, getJobs, applyJob, getPostedJobs, updateApplicantStatus, addJobReview } from '../controllers/jobController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/posted', protect, getPostedJobs);
router.get('/', getJobs);
router.post('/', protect, createJob);
router.post('/:id/apply', protect, applyJob);
router.put('/:id/applicants/:userId/status', protect, updateApplicantStatus);
router.post('/:id/review', protect, addJobReview);

export default router;