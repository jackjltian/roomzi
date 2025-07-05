import { Server } from 'socket.io';

let io;

export const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:8080",
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('🔌 User connected:', socket.id);

    // Join a chat room
    socket.on('join-chat', (chatId) => {
      socket.join(`chat-${chatId}`);
      console.log(`👥 User ${socket.id} joined chat: ${chatId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(`chat-${chatId}`);
      console.log(`👋 User ${socket.id} left chat: ${chatId}`);
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      socket.to(`chat-${data.chatId}`).emit('user-typing', {
        userId: data.userId,
        userName: data.userName
      });
    });

    // Handle stop typing
    socket.on('stop-typing', (data) => {
      socket.to(`chat-${data.chatId}`).emit('user-stop-typing', {
        userId: data.userId
      });
    });

    // Handle new messages
    socket.on('send-message', (data) => {
      socket.to(`chat-${data.chatId}`).emit('new-message', {
        id: data.id,
        chat_id: data.chatId,
        sender_id: data.senderId,
        content: data.content,
        sender_type: data.senderType,
        created_at: data.createdAt
      });
    });

    socket.on('disconnect', () => {
      console.log('🔌 User disconnected:', socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}; 