import { generateGeneralAdvice, generateCropRecommendations } from '../services/aiService.js';

// @desc    Ask the General GramMitra AI a question
// @route   POST /api/ai/ask
export const askAssistant = async (req, res) => {
  try {
    const { prompt, language } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ message: "Prompt is required." });
    }

    const responseText = await generateGeneralAdvice(prompt, language);
    res.status(200).json({ reply: responseText });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get smart crop recommendations
// @route   POST /api/ai/crops
export const getSmartCrops = async (req, res) => {
  try {
    const { month, weather, soilType, region, language } = req.body;
    
    if (!month || !soilType || !region) {
      return res.status(400).json({ message: "Month, soilType, and region are required." });
    }

    const recommendations = await generateCropRecommendations(
      month, weather, soilType, region, language
    );
    
    res.status(200).json({ recommendations });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};