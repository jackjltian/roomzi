import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface ChatRoom {
  id: string;
  tenant_id: string;
  landlord_id: string;
  property_id: string;
  created_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sender_type: 'tenant' | 'landlord';
  created_at: string;
}

export const chatApi = {
  // Create a new chat room
  createChatRoom: async (tenantId: string, landlordId: string, propertyId: string) => {
    try {
      console.log('Creating chat room:', { tenantId, landlordId, propertyId });
      const response = await axios.post(`${API_URL}/chat/rooms`, {
        tenantId,
        landlordId,
        propertyId
      });
      console.log('Chat room created:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      throw error;
    }
  },

  // Get all chat rooms for a user
  getChatRooms: async (userId: string) => {
    try {
      console.log('Fetching chat rooms for user:', userId);
      const response = await axios.get(`${API_URL}/chat/rooms/${userId}`);
      console.log('Chat rooms fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      throw error;
    }
  },

  // Get messages for a chat room
  getMessages: async (roomId: string) => {
    try {
      console.log('Fetching messages for room:', roomId);
      const response = await axios.get(`${API_URL}/chat/rooms/${roomId}/messages`);
      console.log('Messages fetched:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  },

  // Send a message
  sendMessage: async (chatId: string, senderId: string, content: string, senderType: 'tenant' | 'landlord') => {
    try {
      console.log('Sending message:', { chatId, senderId, content, senderType });
      const response = await axios.post(`${API_URL}/chat/messages`, {
        chatId,
        senderId,
        content,
        senderType
      });
      console.log('Message sent:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  },

  // Find or create a chat room
  findOrCreateChatRoom: async (tenantId: string, landlordId: string, propertyId: string) => {
    try {
      const response = await axios.post(`${API_URL}/chat/rooms/find-or-create`, {
        tenantId,
        landlordId,
        propertyId
      });
      return response.data;
    } catch (error) {
      console.error('Error finding or creating chat room:', error);
      throw error;
    }
  }
}; 