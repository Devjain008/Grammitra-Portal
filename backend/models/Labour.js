import mongoose from 'mongoose';

const labourSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:    { type: String, required: true },
  skill: {
    type: String,
    enum: ['electrician','plumber','mason','carpenter','painter','welder','mechanic',
           'construction','driver','cleaner','farmer_labour','tailor','cook','security','other'],
    required: true,
  },
  experience:    { type: Number, default: 0 }, // years
  serviceCharge: { type: Number },             // per day ₹
  chargeType:    { type: String, enum: ['daily','hourly','fixed'], default: 'daily' },
  contactNumber: { type: String, required: true },
  whatsapp:      { type: String },
  village:       { type: String },
  district:      { type: String },
  state:         { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  workingRadius: { type: Number, default: 20 }, // km
  isAvailable:   { type: Boolean, default: true },
  profileImage:  { type: String, default: '' },
  bio:           { type: String },
  rating:        { type: Number, default: 0, min: 0, max: 5 },
  totalRatings:  { type: Number, default: 0 },
  reviews: [{
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name:      String,
    rating:    Number,
    comment:   String,
    createdAt: { type: Date, default: Date.now },
  }],
  completedJobs: { type: Number, default: 0 },
  isVerified:    { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  serviceRequests: [{
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requesterName: String,
    requesterMobile: String,
    village: String,
    coordinates: [Number], // [lng, lat]
    note: String,
    dateTime: Date,
    offerAmount: Number,
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now }
  }],
}, { timestamps: true });

labourSchema.pre('save', function() {
  if (this.location && (!this.location.coordinates || this.location.coordinates.length === 0)) {
    this.location = undefined;
  }
});

labourSchema.index({ location: '2dsphere' });
labourSchema.index({ skill: 1, isAvailable: 1 });
labourSchema.index({ village: 1, district: 1 });

export default mongoose.model('Labour', labourSchema);