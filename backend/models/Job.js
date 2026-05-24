import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  company:     { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['agriculture','construction','retail','education','healthcare','it','transport','manufacturing','other'],
    required: true,
  },
  salaryMin:   { type: Number, required: true },
  salaryMax:   { type: Number },
  salaryType:  { type: String, enum: ['monthly','daily','hourly','fixed'], default: 'monthly' },
  village:     { type: String },
  district:    { type: String },
  state:       { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  isRemote:    { type: Boolean, default: false },
  workMode:    { type: String, enum: ['onsite','remote','hybrid'], default: 'onsite' },
  experienceRequired: { type: Number, default: 0 },
  skillsRequired:     [{ type: String }],
  workTiming:         { type: String },
  contactNumber:      { type: String },
  contactEmail:       { type: String },
  totalRequired: { type: Number, required: true, min: 1 },
  filledCount:   { type: Number, default: 0 },
  applicants: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:      String,
    mobile:    String,
    appliedAt: { type: Date, default: Date.now },
    status:    { type: String, enum: ['applied','shortlisted','hired','rejected'], default: 'applied' },
  }],
  postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: 'Business' },
  deadline:  { type: Date },
  isActive:  { type: Boolean, default: true },
  views:     { type: Number, default: 0 },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:  { type: Number, default: 0 },
  reviews: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:      String,
    rating:    Number,
    comment:   String,
    createdAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

jobSchema.pre('save', function() {
  if (this.location && (!this.location.coordinates || this.location.coordinates.length === 0)) {
    this.location = undefined;
  }
});

jobSchema.index({ location: '2dsphere' });
jobSchema.index({ category: 1, isActive: 1 });
jobSchema.index({ village: 1, district: 1 });

jobSchema.virtual('remainingSlots').get(function() {
  return Math.max(0, this.totalRequired - this.filledCount);
});

jobSchema.virtual('fillPercentage').get(function() {
  return Math.min(100, Math.round((this.filledCount / this.totalRequired) * 100));
});

jobSchema.virtual('isFull').get(function() {
  return this.filledCount >= this.totalRequired;
});

jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

export default mongoose.model('Job', jobSchema);