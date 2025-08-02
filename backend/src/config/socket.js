import { Server } from 'socket.io';
import { prisma } from './prisma.js';

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

    // Join a chat room and load messages
    socket.on('join-chat', async (chatId) => {
      socket.join(`chat-${chatId}`);
      console.log(`👥 User ${socket.id} joined chat: ${chatId}`);
      
      try {
        // Load recent messages for the chat
        const messages = await prisma.messages.findMany({
          where: { chat_id: chatId },
          orderBy: { created_at: 'desc' },
          take: 50, // Load last 50 messages
        });
        
        // Send messages to the user who joined
        socket.emit('chat-messages', {
          chatId,
          messages: messages.reverse() // Send in chronological order
        });
      } catch (error) {
        console.error('Error loading chat messages:', error);
        socket.emit('chat-messages-error', { 
          chatId, 
          error: 'Failed to load messages' 
        });
      }
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

    // Handle marking chat as read
    socket.on('mark-chat-read', async (data) => {
      try {
        const { chatId, userId, userType } = data;
        
        if (!['tenant', 'landlord'].includes(userType)) {
          socket.emit('mark-read-error', { error: 'Invalid user type' });
          return;
        }

        const updateField = userType === 'tenant' ? 'tenant_last_read' : 'landlord_last_read';

        await prisma.chats.update({
          where: { id: chatId },
          data: {
            [updateField]: new Date(),
          },
        });

        socket.emit('chat-marked-read', { chatId, success: true });
      } catch (error) {
        console.error('Error marking chat as read:', error);
        socket.emit('mark-read-error', { error: 'Failed to mark chat as read' });
      }
    });

    // Handle new messages with persistence
    socket.on('send-message', async (data) => {
      try {
        // Validate sender_type
        if (!['tenant', 'landlord'].includes(data.senderType)) {
          socket.emit('message-error', { error: 'Invalid sender type' });
          return;
        }

        // Verify chat exists
        const chat = await prisma.chats.findUnique({
          where: { id: data.chatId },
        });

        if (!chat) {
          socket.emit('message-error', { error: 'Chat not found' });
          return;
        }

        // Persist message to database
        const message = await prisma.messages.create({
          data: {
            chat_id: data.chatId,
            sender_id: data.senderId,
            content: data.content,
            sender_type: data.senderType,
            reply_to_id: data.replyToId || null,
          },
        });

        // Broadcast message to all users in the chat room
        console.log(`📡 Broadcasting new-message to chat-${data.chatId}:`, {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          sender_type: message.sender_type,
          created_at: message.created_at,
          reply_to_id: message.reply_to_id,
        });
        io.to(`chat-${data.chatId}`).emit('new-message', {
          id: message.id,
          chat_id: message.chat_id,
          sender_id: message.sender_id,
          content: message.content,
          sender_type: message.sender_type,
          created_at: message.created_at,
          reply_to_id: message.reply_to_id,
        });

        // Send success confirmation to sender
        socket.emit('message-sent', {
          tempId: data.tempId,
          messageId: message.id
        });

      } catch (error) {
        console.error('Error handling message:', error);
        socket.emit('message-error', { 
          error: 'Failed to send message',
          tempId: data.tempId
        });
      }
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