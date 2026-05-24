import Health from '../models/Health.js';
import { generateGeneralAdvice } from '../services/aiService.js';

// @desc    Get seasonal diseases and health awareness cards
// @route   GET /api/health/diseases
export const getSeasonalDiseases = async (req, res) => {
  try {
    const { season } = req.query;
    
    // Default to active diseases; filter by season if requested
    let query = { isActive: true };
    if (season) {
      query.season = { $in: [season, 'all_season'] };
    }

    const diseases = await Health.find(query).sort({ createdAt: -1 });
    res.status(200).json(diseases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Ask the AI Healthcare Assistant
// @route   POST /api/health/ask
export const askHealthAI = async (req, res) => {
  try {
    const { prompt, language } = req.body;

    if (!prompt) {
      return res.status(400).json({ message: "Please describe your health issue or question." });
    }

    // Wrap the user's prompt with strict medical boundaries for the AI
    const safePrompt = `
      The user has a health query: "${prompt}".
      Provide basic health awareness, home remedies, or preventive measures.
      CRITICAL RULE: You are an AI, not a doctor. You MUST include a strict warning at the end stating that this is for awareness only and they must visit a nearby hospital or consult a doctor for a real diagnosis.
    `;

    const aiResponse = await generateGeneralAdvice(safePrompt, language);
    
    res.status(200).json({ reply: aiResponse });
  } catch (error) {
    res.status(500).json({ message: "AI Assistant is currently unavailable. " + error.message });
  }
};

// @desc    Create a new seasonal disease guide
// @route   POST /api/health/diseases
// @access  Private/Admin
export const createSeasonalDisease = async (req, res) => {
  try {
    const disease = new Health(req.body);
    const createdDisease = await disease.save();
    res.status(201).json(createdDisease);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};