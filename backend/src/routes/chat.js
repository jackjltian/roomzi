import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Create a new chat room
router.post('/rooms', async (req, res) => {
  try {
    const { tenantId, landlordId, propertyId } = req.body;

    // Check if chat room already exists
    const { data: existingRoom } = await supabase
      .from('chats')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('landlord_id', landlordId)
      .eq('property_id', propertyId)
      .single();

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // Create new chat room
    const { data: newRoom, error } = await supabase
      .from('chats')
      .insert([
        {
          tenant_id: tenantId,
          landlord_id: landlordId,
          property_id: propertyId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(newRoom);
  } catch (error) {
    console.error('Error creating chat room:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all chat rooms for a user (either as tenant or landlord)
router.get('/rooms/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('Fetching chat rooms for user:', userId);

    const { data: rooms, error } = await supabase
      .from('chats')
      .select('*')
      .or(`tenant_id.eq.${userId},landlord_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    console.log('Query result:', { rooms, error });

    if (error) throw error;
    res.json(rooms || []); // Return empty array if no rooms found
  } catch (error) {
    console.error('Error fetching chat rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a specific chat room
router.get('/rooms/:roomId/messages', async (req, res) => {
  try {
    const { roomId } = req.params;

    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', roomId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message
router.post('/messages', async (req, res) => {
  try {
    const { chatId, senderId, content, senderType } = req.body;

    const { data: message, error } = await supabase
      .from('messages')
      .insert([
        {
          chat_id: chatId,
          sender_id: senderId,
          content,
          sender_type: senderType, // 'tenant' or 'landlord'
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Find or create a chat room
router.post('/rooms/find-or-create', async (req, res) => {
  try {
    const { tenantId, landlordId, propertyId } = req.body;

    // Check if chat room already exists
    const { data: existingRoom } = await supabase
      .from('chats')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('landlord_id', landlordId)
      .eq('property_id', propertyId)
      .single();

    if (existingRoom) {
      return res.json(existingRoom);
    }

    // Create new chat room
    const { data: newRoom, error } = await supabase
      .from('chats')
      .insert([
        {
          tenant_id: tenantId,
          landlord_id: landlordId,
          property_id: propertyId,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (error) throw error;
    res.json(newRoom);
  } catch (error) {
    console.error('Error in find-or-create chat room:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router; 