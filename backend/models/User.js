import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  mobile: {
    type: String,
    unique: true,
    sparse: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian mobile number'],
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  village:  { type: String, trim: true },
  district: { type: String, trim: true },
  state:    { type: String, trim: true },
  pincode:  { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number], // [lng, lat]
  },
  profileImage: { type: String, default: '' },
  bio:          { type: String, maxlength: 300 },
  categories: [{
    type: String,
    enum: ['farmer','labour','student','teacher','businessman','healthcare','shopkeeper','other'],
  }],
  teacherSubject: { type: String, default: '' },
  teacherQualifications: { type: String, default: '' },
  teacherExperience: { type: String, default: '' },
  teacherContact: { type: String, default: '' },
  isVerified:    { type: Boolean, default: false },
  role:          { type: String, enum: ['user', 'admin'], default: 'user' },
  otp:           { type: String, select: false },
  otpExpiry:     { type: Date,   select: false },
  rememberToken: { type: String, select: false },
  lastLogin:     { type: Date },
  isActive:      { type: Boolean, default: true },
  rating:       { type: Number, default: 0, min: 0, max: 5 },
  totalRatings: { type: Number, default: 0 },
  language:     { type: String, default: 'en', enum: ['en', 'hi'] },
  notifications:{ type: Boolean, default: true },
  orderNotifications: { type: Boolean, default: true },
  serviceNotifications: { type: Boolean, default: true },
  chatNotifications: { type: Boolean, default: true },
  teacherReviews: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

userSchema.index({ location: '2dsphere' });
userSchema.index({ village: 1, district: 1, state: 1 });
userSchema.index({ categories: 1 });

userSchema.pre('save', async function() {
  // 1. Clean location if coordinates are empty/missing to prevent MongoDB GeoJSON index errors
  if (this.location && (!this.location.coordinates || this.location.coordinates.length === 0)) {
    this.location = undefined;
  }

  // 2. Only hash if the password has been modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.otp;
  delete obj.otpExpiry;
  return obj;
};

export default mongoose.model('User', userSchema);