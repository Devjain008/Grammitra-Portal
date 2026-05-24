import express from 'express';
import {
  createAnnouncement, getAnnouncements,
  registerAsTeacher, getVillageTeachers,
  createBatch, getMyBatches, getStudentBatches, getBatchDetails,
  addStudentToBatch, requestJoinBatch, handleJoinRequest, removeStudentFromBatch,
  updateFees, markAttendance, markFeePaid
} from '../controllers/educationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Announcements
router.post('/announcements', protect, createAnnouncement);
router.get('/announcements', protect, getAnnouncements);

// Teacher registration
router.post('/register-teacher', protect, registerAsTeacher);
router.get('/teachers', protect, getVillageTeachers);

// Batch management (Teacher)
router.post('/batches', protect, createBatch);
router.get('/batches', protect, getMyBatches);
router.get('/my-batches', protect, getStudentBatches);
router.get('/batches/:batchId', protect, getBatchDetails);
router.post('/batches/:batchId/add-student', protect, addStudentToBatch);
router.post('/batches/:batchId/request-join', protect, requestJoinBatch);
router.put('/batches/:batchId/join-requests/:requestId', protect, handleJoinRequest);
router.delete('/batches/:batchId/students/:userId', protect, removeStudentFromBatch);

// Fees & Attendance
router.put('/batches/:batchId/fees', protect, updateFees);
router.post('/batches/:batchId/attendance', protect, markAttendance);
router.put('/batches/:batchId/students/:userId/fees/:feeId', protect, markFeePaid);

export default router;
