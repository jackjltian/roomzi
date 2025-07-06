import { prisma } from "../config/prisma.js";
import { successResponse, errorResponse } from "../utils/response.js";

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
        tenant_profile: {
          select: { full_name: true }
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Add tenantName field to each chat
    const chatsWithTenantName = chats.map(chat => ({
      ...chat,
      tenantName: chat.tenant_profile?.full_name || chat.tenant_id,
    }));

    res.json(successResponse(chatsWithTenantName, "Chats retrieved successfully"));
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

    res.json(successResponse(chat, "Chat retrieved successfully"));
  } catch (error) {
    console.error("Error fetching chat:", error);
    res.status(500).json(errorResponse(error));
  }
};

// Create a new chat
export const createChat = async (req, res) => {
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

    // Fetch names from related tables
    const tenant = await prisma.tenant_profiles.findUnique({ where: { id: tenant_id } });
    const landlord = await prisma.landlord_profiles.findUnique({ where: { id: landlord_id } });
    const property = await prisma.listings.findUnique({ where: { id: property_id } });

    const chat = await prisma.chats.create({
      data: {
        tenant_id,
        landlord_id,
        property_id,
        tenant_name: tenant ? tenant.full_name : null,
        landlord_name: landlord ? landlord.full_name : null,
        property_name: property ? property.title : null,
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
    const { chat_id, sender_id, content, sender_type } = req.body;

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
      },
    });

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

    res.json(successResponse(null, "Chat deleted successfully"));
  } catch (error) {
    console.error("Error deleting chat:", error);
    
    if (error.code === "P2025") {
      return res.status(404).json(errorResponse(new Error("Chat not found"), 404));
    }
    
    res.status(500).json(errorResponse(error));
  }
}; 