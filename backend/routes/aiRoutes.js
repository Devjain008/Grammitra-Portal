import express from 'express';
import { askAssistant, getSmartCrops } from '../controllers/aiController.js';

const router = express.Router();

router.post('/ask', askAssistant);
router.post('/crops', getSmartCrops);

export default router;