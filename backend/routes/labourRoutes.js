import express from 'express';
import { 
  createLabourProfile, 
  getLabours, 
  getMyLabourProfile, 
  updateMyLabourProfile, 
  deleteMyLabourProfile,
  requestLabourService,
  updateServiceRequestStatus,
  addLabourReview,
  cancelServiceRequest
} from '../controllers/labourController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', getLabours);
router.post('/', protect, createLabourProfile);

// Profile management for worker
router.get('/my-profile', protect, getMyLabourProfile);
router.put('/my-profile', protect, updateMyLabourProfile);
router.delete('/my-profile', protect, deleteMyLabourProfile);

// Worker updates service request status
router.put('/requests/:requestId', protect, updateServiceRequestStatus);

// Requester sends service request
router.post('/:id/request', protect, requestLabourService);
router.delete('/requests/:id/:requestId/cancel', protect, cancelServiceRequest);

// Add review to a worker profile
router.post('/:id/review', protect, addLabourReview);

export default router;