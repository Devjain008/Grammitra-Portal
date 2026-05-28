import mongoose from 'mongoose';
import path from 'path';
import { Message, ChatRoom } from '../models/Message.js';
import User from '../models/User.js';

const CONFIG_BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// @desc    Get or create a direct chat room between two users
// @route   POST /api/chat/room
// @access  Private
export const accessChatRoom = async (req, res) => {
  try {
    const userId1 = req.user._id;
    const { userId2 } = req.body;

    if (!userId2) {
      return res.status(400).json({ message: 'Other participant user ID (userId2) is required.' });
    }

    // Block direct chat creation with System Admin
    const targetUser = await User.findById(userId2);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found.' });
    }
    if (targetUser.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Chatting with the System Admin is not allowed.' });
    }

    // Check if a direct room already exists
    let room = await ChatRoom.findOne({
      roomType: 'direct',
      participants: { $all: [userId1, userId2] }
    });

    if (!room) {
      // Create a new room if none exists
      room = await ChatRoom.create({
        participants: [userId1, userId2],
        roomType: 'direct'
      });
    } else {
      room.deletedBy = room.deletedBy || [];
      if (room.deletedBy.some(id => id.toString() === userId1.toString())) {
        room.deletedBy = room.deletedBy.filter(id => id.toString() !== userId1.toString());
        await room.save();
      }
    }

    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all active chat rooms for a user (and auto-provisions village group)
// @route   GET /api/chat/rooms
// @access  Private
export const getUserRooms = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check if user has a village and ensure the village group exists
    if (req.user.village && req.user.village.trim() !== '') {
      const villageName = req.user.village.trim();
      const villageGroupName = `${villageName} Village Group`;

      let villageRoom = await ChatRoom.findOne({
        roomType: 'group',
        roomName: villageGroupName
      });

      if (!villageRoom) {
        // Create the village group room
        villageRoom = await ChatRoom.create({
          roomType: 'group',
          roomName: villageGroupName,
          participants: [userId]
        });
      } else if (!villageRoom.participants.includes(userId)) {
        // Automatically join the user
        villageRoom.participants.push(userId);
        await villageRoom.save();
      }
    }

    // Find all chat rooms where the user is a participant
    const rooms = await ChatRoom.find({
      participants: userId,
      deletedBy: { $ne: userId }
    })
      .populate('participants', 'fullName email mobile village role profileImage bio')
      .sort({ lastMessageAt: -1, updatedAt: -1 });

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a custom group chat room
// @route   POST /api/chat/group
// @access  Private
export const createGroupRoom = async (req, res) => {
  try {
    const { roomName } = req.body;

    if (!roomName || roomName.trim() === '') {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    // Create the group room
    const room = await ChatRoom.create({
      roomType: 'group',
      roomName: roomName.trim(),
      participants: [req.user._id],
      adminIds: [req.user._id]
    });

    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get message history for a specific room
// @route   GET /api/chat/:roomId
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ 
      roomId: req.params.roomId,
      deletedForUsers: { $ne: req.user._id }
    })
      .sort({ createdAt: 1 }); // Oldest to newest for chat UI
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a message (Delete for Me or Delete for Everyone)
// @route   POST /api/chat/message/:messageId/delete
// @access  Private
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteType } = req.body; // 'me' or 'everyone'
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid message ID format.' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found.' });
    }

    if (deleteType === 'everyone') {
      // Only the sender can delete for everyone
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({ message: 'Only the sender can delete this message for everyone.' });
      }
      message.deletedForEveryone = true;
      message.content = 'This message was deleted';
      await message.save();

      // Update room lastMessage if it matches the latest message
      const latestMessage = await Message.findOne({ roomId: message.roomId }).sort({ createdAt: -1 });
      if (latestMessage && latestMessage._id.toString() === message._id.toString()) {
        await ChatRoom.findByIdAndUpdate(message.roomId, {
          lastMessage: 'This message was deleted'
        });
      }

      // Emit socket event to notify other users in the room
      const io = req.app.get('socketio');
      if (io) {
        io.to(message.roomId.toString()).emit('message_deleted', {
          messageId: message._id,
          roomId: message.roomId,
          deletedForEveryone: true
        });
      }
    } else {
      // Delete for me: add user to deletedForUsers array
      if (!message.deletedForUsers.includes(userId)) {
        message.deletedForUsers.push(userId);
        await message.save();
      }
    }

    res.status(200).json({ message: 'Message deleted successfully.', messageId: message._id, deleteType });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a member to a group room (admin only)
// @route   POST /api/chat/group/:roomId/add-member
// @access  Private
export const addGroupMember = async (req, res) => {
  try {
    const { userId } = req.body;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group')
      return res.status(404).json({ message: 'Group room not found.' });

    const isParticipant = room.participants.some(id => id.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this group.' });
    }

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (room.onlyAdminsCanAddMembers && !isAdmin) {
      return res.status(403).json({ message: 'Only group admins can add members in this group.' });
    }

    if (!room.participants.includes(userId)) {
      room.participants.push(userId);
      await room.save();
    }
    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove a member from a group room (admin only)
// @route   DELETE /api/chat/group/:roomId/members/:userId
// @access  Private
export const removeGroupMember = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group')
      return res.status(404).json({ message: 'Group room not found.' });

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: 'Only group admins can remove members.' });

    room.participants = room.participants.filter(p => p.toString() !== req.params.userId);
    await room.save();
    res.status(200).json({ message: 'Member removed.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student requests to join a group
// @route   POST /api/chat/group/:roomId/request-join
// @access  Private
export const requestJoinGroup = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group')
      return res.status(404).json({ message: 'Group room not found.' });

    const alreadyIn = room.participants.some(p => p.toString() === req.user._id.toString());
    if (alreadyIn) return res.status(400).json({ message: 'You are already a member.' });

    const alreadyRequested = room.joinRequests && room.joinRequests.some(
      r => r.userId && r.userId.toString() === req.user._id.toString() && r.status === 'pending'
    );
    if (alreadyRequested) return res.status(400).json({ message: 'Join request already sent.' });

    room.joinRequests = room.joinRequests || [];
    room.joinRequests.push({ userId: req.user._id, fullName: req.user.fullName });
    await room.save();
    res.status(200).json({ message: 'Join request sent.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin approves or rejects a group join request
// @route   PUT /api/chat/group/:roomId/join-requests/:requestId
// @access  Private (Group Admin)
export const approveGroupRequest = async (req, res) => {
  try {
    const { action } = req.body; // 'approve' or 'reject'
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group')
      return res.status(404).json({ message: 'Group room not found.' });

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: 'Only group admins can approve requests.' });

    const request = room.joinRequests && room.joinRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ message: 'Request not found.' });

    if (action === 'approve') {
      request.status = 'approved';
      if (!room.participants.some(p => p.toString() === request.userId.toString())) {
        room.participants.push(request.userId);
      }
    } else {
      request.status = 'rejected';
    }

    await room.save();
    res.status(200).json({ message: `Request ${action}d.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get group join requests (admin only)
// @route   GET /api/chat/group/:roomId/join-requests
// @access  Private (Group Admin)
export const getGroupJoinRequests = async (req, res) => {
  try {
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group')
      return res.status(404).json({ message: 'Group room not found.' });

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) return res.status(403).json({ message: 'Only group admins can view requests.' });

    const pending = (room.joinRequests || []).filter(r => r.status === 'pending');
    res.status(200).json(pending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Rename group room (admin only)
// @route   PUT /api/chat/group/:roomId/name
// @access  Private
export const renameGroup = async (req, res) => {
  try {
    const { roomName } = req.body;
    if (!roomName || roomName.trim() === '') {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group') {
      return res.status(404).json({ message: 'Group room not found.' });
    }

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can rename the group.' });
    }

    room.roomName = roomName.trim();
    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add group member by Indian mobile number (admin only)
// @route   POST /api/chat/group/:roomId/add-member-mobile
// @access  Private
export const addGroupMemberByMobile = async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    const targetUser = await User.findOne({ mobile: mobile.trim() });
    if (!targetUser) {
      return res.status(404).json({ message: 'User with this mobile number not found.' });
    }

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group') {
      return res.status(404).json({ message: 'Group room not found.' });
    }

    const isParticipant = room.participants.some(id => id.toString() === req.user._id.toString());
    if (!isParticipant) {
      return res.status(403).json({ message: 'You are not a participant in this group.' });
    }

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (room.onlyAdminsCanAddMembers && !isAdmin) {
      return res.status(403).json({ message: 'Only group admins can add members in this group.' });
    }

    if (!room.participants.includes(targetUser._id)) {
      room.participants.push(targetUser._id);
      await room.save();
    }

    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Make group member an admin (admin only)
// @route   POST /api/chat/group/:roomId/make-admin
// @access  Private
export const makeGroupAdmin = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ message: 'Target user ID is required.' });
    }

    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group') {
      return res.status(404).json({ message: 'Group room not found.' });
    }

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can assign other admins.' });
    }

    if (!room.participants.includes(targetUserId)) {
      return res.status(400).json({ message: 'User is not a member of this group.' });
    }

    if (!room.adminIds.includes(targetUserId)) {
      room.adminIds.push(targetUserId);
      await room.save();
    }

    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Exit a group room
// @route   POST /api/chat/group/:roomId/exit
// @access  Private
export const exitGroup = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group') {
      return res.status(404).json({ message: 'Group room not found.' });
    }

    room.participants = room.participants.filter(p => p.toString() !== userId.toString());

    const wasAdmin = room.adminIds && room.adminIds.some(id => id.toString() === userId.toString());
    if (wasAdmin) {
      room.adminIds = room.adminIds.filter(id => id.toString() !== userId.toString());
    }

    if (room.participants.length > 0 && room.adminIds.length === 0) {
      room.adminIds.push(room.participants[0]);
    }

    await room.save();
    res.status(200).json({ message: 'Exited group successfully.', roomId: room._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle pin room
// @route   POST /api/chat/room/:roomId/pin
// @access  Private
export const togglePinRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    room.pinnedBy = room.pinnedBy || [];
    const isPinned = room.pinnedBy.some(id => id.toString() === userId.toString());

    if (isPinned) {
      room.pinnedBy = room.pinnedBy.filter(id => id.toString() !== userId.toString());
    } else {
      room.pinnedBy.push(userId);
    }

    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle archive room
// @route   POST /api/chat/room/:roomId/archive
// @access  Private
export const toggleArchiveRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    room.archivedBy = room.archivedBy || [];
    const isArchived = room.archivedBy.some(id => id.toString() === userId.toString());

    if (isArchived) {
      room.archivedBy = room.archivedBy.filter(id => id.toString() !== userId.toString());
    } else {
      room.archivedBy.push(userId);
    }

    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear chat history for current user
// @route   POST /api/chat/room/:roomId/clear
// @access  Private
export const clearChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const { roomId } = req.params;

    await Message.updateMany(
      { roomId, deletedForUsers: { $ne: userId } },
      { $addToSet: { deletedForUsers: userId } }
    );

    res.status(200).json({ message: 'Chat history cleared successfully.', roomId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Search a user by mobile number (for starting a direct chat)
// @route   GET /api/chat/search-user?mobile=XXXXXXXXXX
// @access  Private
export const searchUserByMobile = async (req, res) => {
  try {
    const { mobile } = req.query;
    if (!mobile || mobile.trim() === '') {
      return res.status(400).json({ message: 'Mobile number is required.' });
    }

    const found = await User.findOne({ mobile: mobile.trim() })
      .select('fullName mobile profileImage bio village district state role categories');

    if (!found) {
      return res.status(404).json({ message: 'No user found with this mobile number.' });
    }

    res.status(200).json(found);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload a file/media for a chat message
// @route   POST /api/chat/upload
// @access  Private
export const uploadChatFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded.' });
    }

    const { roomId, senderName, type } = req.body;
    if (!roomId) {
      return res.status(400).json({ message: 'roomId is required.' });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    if (room.roomType === 'group' && room.onlyAdminsCanSendMessages) {
      const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
      if (!isAdmin) {
        return res.status(403).json({ message: 'Only admins can send messages/files in this group.' });
      }
    }

    const mime = req.file.mimetype;
    let msgType = type || 'file';
    if (!type) {
      if (mime.startsWith('image/')) msgType = 'image';
      else if (mime.startsWith('video/')) msgType = 'video';
      else if (mime.startsWith('audio/')) msgType = 'audio';
    }

    // Build file URL â€” served as static from /uploads/chat/
    const fileUrl = `${CONFIG_BASE_URL}/uploads/chat/${req.file.filename}`;

    // Create the message in DB
    const newMessage = await Message.create({
      roomId,
      senderId: req.user._id,
      senderName: senderName || req.user.fullName,
      content: req.file.originalname,   // content = filename for display
      type: msgType,
      fileUrl,
      fileName: req.file.originalname,
      fileMimeType: mime,
    });

    // Update room lastMessage
    await ChatRoom.findByIdAndUpdate(roomId, {
      lastMessage: `ðŸ“Ž ${req.file.originalname}`,
      lastMessageAt: new Date()
    });

    // Broadcast via socket
    const io = req.app.get('socketio');
    if (io) {
      io.to(roomId).emit('receive_message', { ...newMessage.toObject(), roomId });
    }

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update group settings (admin only)
// @route   PUT /api/chat/group/:roomId/settings
// @access  Private
export const updateGroupSettings = async (req, res) => {
  try {
    const { onlyAdminsCanAddMembers, onlyAdminsCanSendMessages } = req.body;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room || room.roomType !== 'group') {
      return res.status(404).json({ message: 'Group room not found.' });
    }

    const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === req.user._id.toString());
    if (!isAdmin) {
      return res.status(403).json({ message: 'Only group admins can update group settings.' });
    }

    if (onlyAdminsCanAddMembers !== undefined) {
      room.onlyAdminsCanAddMembers = onlyAdminsCanAddMembers;
    }
    if (onlyAdminsCanSendMessages !== undefined) {
      room.onlyAdminsCanSendMessages = onlyAdminsCanSendMessages;
    }

    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');

    // Notify all participants in the group via socket that settings have changed
    const io = req.app.get('socketio');
    if (io) {
      io.to(room._id.toString()).emit('room_settings_updated', room);
    }

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle mute room
// @route   POST /api/chat/room/:roomId/mute
// @access  Private
export const toggleMuteRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    room.mutedBy = room.mutedBy || [];
    const isMuted = room.mutedBy.some(id => id.toString() === userId.toString());

    if (isMuted) {
      room.mutedBy = room.mutedBy.filter(id => id.toString() !== userId.toString());
    } else {
      room.mutedBy.push(userId);
    }

    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle block room
// @route   POST /api/chat/room/:roomId/block
// @access  Private
export const toggleBlockRoom = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    room.blockedBy = room.blockedBy || [];
    const isBlocked = room.blockedBy.some(id => id.toString() === userId.toString());

    if (isBlocked) {
      room.blockedBy = room.blockedBy.filter(id => id.toString() !== userId.toString());
    } else {
      room.blockedBy.push(userId);
    }

    await room.save();
    await room.populate('participants', 'fullName email mobile village role profileImage bio');
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete chat room for user
// @route   POST /api/chat/room/:roomId/delete-chat
// @access  Private
export const deleteChat = async (req, res) => {
  try {
    const userId = req.user._id;
    const room = await ChatRoom.findById(req.params.roomId);
    if (!room) {
      return res.status(404).json({ message: 'Chat room not found.' });
    }

    room.deletedBy = room.deletedBy || [];
    if (!room.deletedBy.some(id => id.toString() === userId.toString())) {
      room.deletedBy.push(userId);
    }

    await Message.updateMany(
      { roomId: room._id, deletedForUsers: { $ne: userId } },
      { $addToSet: { deletedForUsers: userId } }
    );

    await room.save();
    res.status(200).json({ message: 'Chat deleted successfully.', roomId: room._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
