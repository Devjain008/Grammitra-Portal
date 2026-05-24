import { Message, ChatRoom } from '../models/Message.js';

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 User Connected via Socket: ${socket.id}`);

    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(userId);
      console.log(`🔌 User ${userId} joined their private notification room`);
    }

    // Join a specific chat room
    socket.on('join_room', (roomId) => {
      socket.join(roomId);
      console.log(`User Joined Room: ${roomId}`);
    });

    // Handle sending a new message
    socket.on('send_message', async (data) => {
      try {
        const room = await ChatRoom.findById(data.roomId);
        if (room && room.roomType === 'group' && room.onlyAdminsCanSendMessages) {
          const isAdmin = room.adminIds && room.adminIds.some(id => id.toString() === data.senderId.toString());
          if (!isAdmin) {
            socket.emit('error', { message: 'Only admins can send messages in this group.' });
            return;
          }
        }
        // Save to database
        const newMessage = await Message.create({
          roomId: data.roomId,
          senderId: data.senderId,
          senderName: data.senderName,
          content: data.content,
        });

        // Update the room's last message and get participants
        const updatedRoom = await ChatRoom.findByIdAndUpdate(data.roomId, {
          lastMessage: data.content,
          lastMessageAt: new Date()
        }, { new: true });

        // Broadcast to everyone in the room INCLUDING the sender so they get the real DB _id
        io.to(data.roomId).emit('receive_message', { ...newMessage.toObject(), roomId: data.roomId });

        // Also emit to each participant's private channel so they get notifications on any page
        if (updatedRoom && updatedRoom.participants) {
          updatedRoom.participants.forEach(pId => {
            if (pId.toString() !== data.senderId.toString()) {
              io.to(pId.toString()).emit('receive_message', { ...newMessage.toObject(), roomId: data.roomId });
            }
          });
        }
      } catch (error) {
        console.error("Socket Message Error:", error);
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(data.roomId).emit('user_typing', data.senderName);
    });

    // WebRTC call signaling
    socket.on('call:initiate', (data) => {
      // data: { calleeId, callerId, callerName, callerImage, callType, offer, roomId }
      io.to(data.calleeId).emit('call:incoming', {
        callerId: data.callerId,
        callerName: data.callerName,
        callerImage: data.callerImage,
        callType: data.callType,
        offer: data.offer,
        roomId: data.roomId
      });
    });

    socket.on('call:answer', (data) => {
      // data: { callerId, answer }
      io.to(data.callerId).emit('call:answered', {
        answer: data.answer
      });
    });

    socket.on('call:ice-candidate', (data) => {
      // data: { targetId, candidate }
      io.to(data.targetId).emit('call:ice-candidate', {
        candidate: data.candidate,
        senderId: userId
      });
    });

    socket.on('call:reject', (data) => {
      // data: { callerId }
      io.to(data.callerId).emit('call:rejected');
    });

    socket.on('call:end', (data) => {
      // data: { targetId }
      io.to(data.targetId).emit('call:ended');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User Disconnected: ${socket.id}`);
    });
  });
};