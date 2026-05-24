import mongoose from 'mongoose';

// Reusable structure for dual-language text fields
const localizedString = {
  en: { type: String, required: true },
  hi: { type: String, required: true }
};

const localizedArray = {
  en: [{ type: String }],
  hi: [{ type: String }]
};

const schemeSchema = new mongoose.Schema({
  title: localizedString,
  description: localizedString,
  
  category: [{
    type: String,
    enum: ['farmer', 'student', 'labour', 'women', 'businessman', 'senior_citizen', 'health', 'general'],
    required: true,
  }],
  
  // Scheme Details
  eligibility: localizedArray,
  benefits: localizedString,
  requiredDocuments: localizedArray,
  applicationProcess: localizedString,
  
  // Logistics
  department: localizedString,
  state: { type: String, default: 'Central' }, // e.g., 'Madhya Pradesh' or 'Central' for all India
  officialLink: { type: String, trim: true },
  
  deadline: { type: Date },
  isActive: { type: Boolean, default: true },
  
  // Analytics
  views: { type: Number, default: 0 },
  appliedCount: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for fast searching and filtering
schemeSchema.index({ category: 1, isActive: 1 });
schemeSchema.index({ state: 1 });
schemeSchema.index({ deadline: 1 });

export default mongoose.model('Scheme', schemeSchema);