import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";
import { getIO } from "../config/socket.js";

// Get all chats for a user (tenant or landlord)
export const getUserChats = async (req, res) => {
  try {
    const { userId, userType } = req.params; // userType: 'tenant' or 'landlord'

    const where = userType === 'tenant' 
      ? { tenant_id: userId }
      : { landlord_id: userId };

    const chats = await prisma.chats.findMany({
      where,
      include: {
        messages: {
          orderBy: { created_at: "desc" },
          take: 1, // Get only the latest message
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Manually fetch current names from related tables
    const chatsWithCurrentNames = await Promise.all(
      chats.map(async (chat) => {
        // Fetch tenant profile
        const tenantProfile = await prisma.tenant_profiles.findUnique({
          where: { id: chat.tenant_id },
          select: { full_name: true, email: true }
        });

        // Fetch landlord profile
        const landlordProfile = await prisma.landlord_profiles.findUnique({
          where: { id: chat.landlord_id },
          select: { full_name: true, email: true }
        });

        // Fetch listing details
        let listing = null;
        if (chat.property_id) {
          try {
            listing = await prisma.listings.findUnique({
              where: { id: BigInt(chat.property_id) },
              select: {
                id: true,
                title: true,
                address: true,
                city: true,
                state: true,
                price: true,
                images: true
              }
            });
          } catch (error) {
            console.log(`Could not find listing with ID: ${chat.property_id}`);
          }
        }

        return {
          ...chat,
          tenantName: tenantProfile?.full_name || chat.tenant_name || 'Unknown Tenant',
          propertyTitle: listing?.title || chat.property_name || 'Unknown Property',
          landlord_name: landlordProfile?.full_name || chat.landlord_name || 'Unknown Landlord',
          property_details: listing ? {
            address: listing.address,
            city: listing.city,
            state: listing.state,
            price: listing.price,
            images: listing.images
          } : null
        };
      })
    );

    res.json(successResponse(chatsWithCurrentNames, "Chats retrieved successfully"));
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get a specific chat with all messages
export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;

    const chat = await prisma.chats.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { created_at: "asc" },
        },
      },
    });

    if (!chat) {
      return res
        .status(404)
        .json(errorResponse(new Error("Chat not found"), 404));
    }

    // Manually fetch current names from related tables
    const tenantProfile = await prisma.tenant_profiles.findUnique({
      where: { id: chat.tenant_id },
      select: { full_name: true, email: true }
    });

    const landlordProfile = await prisma.landlord_profiles.findUnique({
      where: { id: chat.landlord_id },
      select: { full_name: true, email: true }
    });

    // Fetch listing details
    let listing = null;
    if (chat.property_id) {
      try {
        listing = await prisma.listings.findUnique({
          where: { id: BigInt(chat.property_id) },
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            state: true,
            price: true,
            images: true
          }
        });
      } catch (error) {
        console.log(`Could not find listing with ID: ${chat.property_id}`);
      }
    }

    // Transform the response to include current names
    const chatWithCurrentNames = {
      ...chat,
      tenantName: tenantProfile?.full_name || chat.tenant_name || 'Unknown Tenant',
      landlordName: landlordProfile?.full_name || chat.landlord_name || 'Unknown Landlord',
      propertyTitle: listing?.title || chat.property_name || 'Unknown Property',
      property_details: listing ? {
        address: listing.address,
        city: listing.city,
        state: listing.state,
        price: listing.price,
        images: listing.images
      } : null
    };

    res.json(successResponse(chatWithCurrentNames, "Chat retrieved successfully"));
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create a new chat
export const createChat = async (req, res) => {
  console.log('--- createChat endpoint called ---');
  try {
    const { tenant_id, landlord_id, property_id } = req.body;

    // Check if chat already exists for this combination
    const existingChat = await prisma.chats.findFirst({
      where: {
        tenant_id,
        landlord_id,
        property_id,
      },
    });

    if (existingChat) {
      return res.json(successResponse(existingChat, "Chat already exists"));
    }

    // Fetch current names from related tables for new chats
    console.log('Creating chat with:', { tenant_id, landlord_id, property_id });
    const tenantProfile = await prisma.tenant_profiles.findUnique({
      where: { id: tenant_id },
      select: { full_name: true }
    });
    console.log('Tenant profile lookup result:', tenantProfile);

    const landlordProfile = await prisma.landlord_profiles.findUnique({
      where: { id: landlord_id },
      select: { full_name: true }
    });
    console.log('Landlord profile lookup result:', landlordProfile);

    let listing = null;
    if (property_id) {
      try {
        listing = await prisma.listings.findUnique({
          where: { id: BigInt(property_id) },
          select: { title: true }
        });
        console.log('Listing lookup result:', listing);
      } catch (error) {
        console.log(`Could not find listing with ID: ${property_id}`, error);
      }
    }

    // Create chat with current names
    const chat = await prisma.chats.create({
      data: {
        tenant_id,
        landlord_id,
        property_id,
        tenant_name: tenantProfile?.full_name || null,
        landlord_name: landlordProfile?.full_name || null,
        property_name: listing?.title || null,
      },
    });

    res.status(201).json(successResponse(chat, "Chat created successfully"));
  } catch (error) {
    console.error("Error creating chat:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Send a message in a chat
export const sendMessage = async (req, res) => {
  try {
    const { chat_id, sender_id, content, sender_type, reply_to_id } = req.body;

    // Validate sender_type
    if (!['tenant', 'landlord'].includes(sender_type)) {
      return res.status(400).json(errorResponse(new Error("Invalid sender type"), 400));
    }

    // Verify chat exists
    const chat = await prisma.chats.findUnique({
      where: { id: chat_id },
    });

    if (!chat) {
      return res.status(404).json(errorResponse(new Error("Chat not found"), 404));
    }

    const message = await prisma.messages.create({
      data: {
        chat_id,
        sender_id,
        content,
        sender_type,
        reply_to_id: reply_to_id || null,
      },
    });

    // Emit the message via WebSocket to all users in the chat room
    try {
      const io = getIO();
      io.to(`chat-${chat_id}`).emit('new-message', {
        id: message.id,
        chat_id: message.chat_id,
        sender_id: message.sender_id,
        content: message.content,
        sender_type: message.sender_type,
        created_at: message.created_at,
        reply_to_id: message.reply_to_id,
      });
    } catch (socketError) {
      console.error("WebSocket error:", socketError);
      // Don't fail the request if WebSocket fails
    }

    res.status(201).json(successResponse(message, "Message sent successfully"));
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Get messages for a specific chat
export const getChatMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    const messages = await prisma.messages.findMany({
      where: { chat_id: chatId },
      orderBy: { created_at: "desc" },
      skip,
      take,
    });

    // Reverse to show oldest first
    messages.reverse();

    res.json(successResponse(messages, "Messages retrieved successfully"));
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Delete a chat
export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete all messages first (due to foreign key constraint)
    await prisma.messages.deleteMany({
      where: { chat_id: id },
    });

    // Delete the chat
    await prisma.chats.delete({
      where: { id },
    });

    // Notify users via WebSocket that chat was deleted
    try {
      const io = getIO();
      io.to(`chat-${id}`).emit('chat-deleted', { chatId: id });
    } catch (socketError) {
      console.error("WebSocket error:", socketError);
    }

    res.json(successResponse(null, "Chat deleted successfully"));
  } catch (error) {
    console.error("Error deleting chat:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json(errorResponse(new Error("Chat not found"), 404));
    }
    
    res.status(500).json(errorResponse(error));
  }
};

// Delete a single message by ID
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await prisma.messages.delete({
      where: { id },
    });
    res.json(successResponse(deleted, "Message deleted successfully"));
  } catch (error) {
    console.error("Error deleting message:", error);
    if (error.code === "P2025") {
      return res.status(404).json(errorResponse(new Error("Message not found"), 404));
    }
    res.status(500).json(errorResponse(error));
  }
}; 