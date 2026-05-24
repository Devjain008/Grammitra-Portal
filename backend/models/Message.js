import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  roomId:    { type: mongoose.Schema.Types.ObjectId, ref: 'ChatRoom', required: true, index: true },
  senderId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderName:{ type: String },
  content:   { type: String, default: '' },
  type:      { type: String, enum: ['text','image','video','audio','file','system'], default: 'text' },
  fileUrl:   { type: String },
  fileName:  { type: String },
  fileMimeType: { type: String },
  isRead:    { type: Boolean, default: false },
  readAt:    { type: Date },
  deletedForEveryone: { type: Boolean, default: false },
  deletedForUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

messageSchema.index({ roomId: 1, createdAt: -1 });

const chatRoomSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  roomType:     { type: String, enum: ['direct','group','support'], default: 'direct' },
  roomName:     { type: String }, // for groups
  lastMessage:  { type: String },
  lastMessageAt:{ type: Date },
  unreadCount:  { type: Map, of: Number, default: {} },
  adminIds:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // group admins
  joinRequests: [{
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fullName:    { type: String },
    requestedAt: { type: Date, default: Date.now },
    status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
  }],
  pinnedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  archivedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  onlyAdminsCanAddMembers: { type: Boolean, default: false },
  onlyAdminsCanSendMessages: { type: Boolean, default: false },
}, { timestamps: true });

chatRoomSchema.index({ participants: 1 });

const Message = mongoose.model('Message', messageSchema);
const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);

export { Message, ChatRoom };