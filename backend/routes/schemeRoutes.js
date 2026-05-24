import express from 'express';
import { createScheme, getSchemes, incrementSchemeViews } from '../controllers/schemeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, admin, createScheme);
router.get('/', getSchemes);
router.put('/:id/view', incrementSchemeViews);

export default router;