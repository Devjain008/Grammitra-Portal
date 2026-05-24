import express from 'express';
import {
  accessChatRoom, getMessages, getUserRooms, createGroupRoom, deleteMessage,
  addGroupMember, removeGroupMember, requestJoinGroup, approveGroupRequest, getGroupJoinRequests,
  renameGroup, addGroupMemberByMobile, makeGroupAdmin, exitGroup, togglePinRoom, toggleArchiveRoom, clearChat,
  searchUserByMobile, uploadChatFile, updateGroupSettings
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// All chat routes require authentication
router.use(protect);

router.post('/room', accessChatRoom);
router.get('/rooms', getUserRooms);
router.post('/group', createGroupRoom);
router.post('/message/:messageId/delete', deleteMessage);

// User search by mobile (for starting direct chat)
router.get('/search-user', searchUserByMobile);

// File/media upload for chat messages
router.post('/upload', upload.single('file'), uploadChatFile);

// Group management
router.post('/group/:roomId/add-member', addGroupMember);
router.post('/group/:roomId/add-member-mobile', addGroupMemberByMobile);
router.delete('/group/:roomId/members/:userId', removeGroupMember);
router.post('/group/:roomId/request-join', requestJoinGroup);
router.get('/group/:roomId/join-requests', getGroupJoinRequests);
router.put('/group/:roomId/join-requests/:requestId', approveGroupRequest);
router.put('/group/:roomId/name', renameGroup);
router.post('/group/:roomId/make-admin', makeGroupAdmin);
router.post('/group/:roomId/exit', exitGroup);
router.put('/group/:roomId/settings', updateGroupSettings);

// Room Actions (Pin, Archive, Clear)
router.post('/room/:roomId/pin', togglePinRoom);
router.post('/room/:roomId/archive', toggleArchiveRoom);
router.post('/room/:roomId/clear', clearChat);

router.get('/:roomId', getMessages);

export default router;