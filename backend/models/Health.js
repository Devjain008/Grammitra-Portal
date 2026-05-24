import mongoose from 'mongoose';

// Helper for bilingual fields
const localizedString = {
  en: { type: String, required: true },
  hi: { type: String, required: true }
};

const localizedArray = {
  en: [{ type: String }],
  hi: [{ type: String }]
};

const healthSchema = new mongoose.Schema({
  diseaseName: localizedString,
  season: { 
    type: String, 
    enum: ['summer', 'monsoon', 'winter', 'all_season'], 
    required: true 
  },
  description: localizedString,
  
  // Medical Details
  symptoms: localizedArray,
  preventionTips: localizedArray,
  
  // First aid & OTC (Over The Counter) awareness
  medicineSuggestions: localizedString, 
  precautions: localizedString,
  
  // When to rush to the hospital
  emergencyWarnings: localizedArray,
  
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

healthSchema.index({ season: 1, isActive: 1 });

export default mongoose.model('Health', healthSchema);