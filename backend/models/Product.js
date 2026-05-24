import mongoose from 'mongoose';

// ─── Business Model ──────────────────────────────────────────
const businessSchema = new mongoose.Schema({
  ownerId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['grocery','medical','clinic','fertilizer','electronics','clothing','restaurant',
           'furniture','hardware','agri_equipment','mobile_repair','cyber_cafe',
           'dairy','stationery','salon','transport','other'],
    required: true,
  },
  description: { type: String },
  village:     { type: String },
  district:    { type: String },
  state:       { type: String },
  address:     { type: String },
  location: {
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  contactNumber: { type: String, required: true },
  whatsapp:      { type: String },
  timing:        { type: String },
  logo:          { type: String },
  images:        [String],
  rating:        { type: Number, default: 0 },
  totalRatings:  { type: Number, default: 0 },
  isVerified:    { type: Boolean, default: false },
  isActive:      { type: Boolean, default: true },
  totalViews:    { type: Number, default: 0 },
  totalOrders:   { type: Number, default: 0 },
}, { timestamps: true });

businessSchema.pre('save', function() {
  if (this.location && (!this.location.coordinates || this.location.coordinates.length === 0)) {
    this.location = undefined;
  }
});

businessSchema.index({ location: '2dsphere' });
businessSchema.index({ type: 1, village: 1 });

// ─── Product Model ───────────────────────────────────────────
const productSchema = new mongoose.Schema({
  businessId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Business', required: true },
  sellerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String, required: true },
  description: { type: String },
  category: {
    type: String,
    enum: ['grocery','vegetables','fruits','dairy','fertilizer','seeds','medicine',
           'electronics','clothing','furniture','hardware','agri_equipment',
           'crops','livestock','machinery','other'],
    required: true,
  },
  price:         { type: Number, required: true },
  originalPrice: { type: Number },
  discount:      { type: Number, default: 0 }, // percentage
  stock:         { type: Number, default: 0 },
  unit:          { type: String, default: 'piece' }, // kg, litre, piece etc.
  images:        [String],
  isDeliveryAvailable: { type: Boolean, default: false },
  deliveryRadius:      { type: Number, default: 10 }, // km
  isActive:    { type: Boolean, default: true },
  lowStockAlert: { type: Number, default: 5 },
  views:       { type: Number, default: 0 },
  totalSold:   { type: Number, default: 0 },
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

productSchema.index({ businessId: 1, category: 1 });
productSchema.index({ category: 1, isActive: 1 });

// Auto-set low stock flags
productSchema.virtual('isLowStock').get(function() {
  return this.stock <= this.lowStockAlert && this.stock > 0;
});
productSchema.virtual('isOutOfStock').get(function() {
  return this.stock <= 0;
});
productSchema.virtual('discountedPrice').get(function() {
  if (this.discount > 0) return Math.round(this.price * (1 - this.discount / 100));
  return this.price;
});
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Business = mongoose.model('Business', businessSchema);
const Product  = mongoose.model('Product', productSchema);

// Exporting both models using ES6 syntax
export { Business, Product };