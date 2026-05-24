import express from 'express';
import { getEmployees, addEmployee, updateEmployee, deleteEmployee } from '../controllers/employeeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getEmployees)
  .post(protect, addEmployee);

router.route('/:id')
  .put(protect, updateEmployee)
  .delete(protect, deleteEmployee);

export default router;
