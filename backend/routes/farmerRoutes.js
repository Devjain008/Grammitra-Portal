import express from 'express';
import { getVillageWeather } from '../controllers/farmerController.js';

const router = express.Router();

router.get('/weather', getVillageWeather);

// We will add the AI crop recommendation route here next!

export default router;