import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema({
  teacherId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacherName: { type: String, required: true },
  content:     { type: String, required: true },
  village:     { type: String, required: true },
  batchId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Batch', default: null },
  batchName:   { type: String, default: '' },
}, { timestamps: true });

announcementSchema.index({ village: 1, createdAt: -1 });

export default mongoose.model('Announcement', announcementSchema);
