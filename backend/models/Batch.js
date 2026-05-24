import mongoose from 'mongoose';

const attendanceRecordSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  present:  { type: Boolean, default: false }
}, { _id: false });

const attendanceDaySchema = new mongoose.Schema({
  date:    { type: String, required: true }, // 'YYYY-MM-DD'
  records: [attendanceRecordSchema]
}, { _id: false });

const feeSchema = new mongoose.Schema({
  label:   { type: String, required: true },
  amount:  { type: Number, required: true },
  dueDate: { type: String } // 'YYYY-MM-DD'
}, { _id: true });

const studentInBatchSchema = new mongoose.Schema({
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email:    { type: String },
  fullName: { type: String },
  joinedAt: { type: Date, default: Date.now },
  feesPaid: { type: Map, of: Boolean, default: {} }  // feeId -> paid
}, { _id: false });

const joinRequestSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email:       { type: String },
  fullName:    { type: String },
  requestedAt: { type: Date, default: Date.now },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { _id: true });

const batchSchema = new mongoose.Schema({
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String },
  batchName:   { type: String, required: true, trim: true },
  className:   { type: String, required: true }, // e.g., '10th', 'Sem 4'
  subject:     { type: String, default: '' },
  village:     { type: String, trim: true },
  students:    [studentInBatchSchema],
  joinRequests:[joinRequestSchema],
  chatRoomId:  { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', default: null },
  fees:        [feeSchema],
  attendance:  [attendanceDaySchema],
  isActive:    { type: Boolean, default: true }
}, { timestamps: true });

batchSchema.index({ teacherId: 1 });
batchSchema.index({ village: 1 });

export default mongoose.model('Batch', batchSchema);
