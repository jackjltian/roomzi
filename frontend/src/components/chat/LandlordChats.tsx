import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getCurrentUserRole } from '@/utils/auth';
import { chatApi } from '@/api/chat';
import { ChatWindow } from './ChatWindow';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { ArrowLeft, MessageCircle, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Chat {
  id: string;
  tenant_id: string;
  landlord_id: string;
  property_id: string;
  created_at: string;
  tenantName?: string;
  propertyTitle?: string;
  property_name?: string;
  tenant_name?: string;
  lastMessage?: string;
  propertyImage?: string;
}

export function LandlordChats() {
  const { user } = useAuth();
  const userRole = getCurrentUserRole(user);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (user && userRole === 'landlord') {
      fetchChats();
    }
  }, [user, userRole]);

  const fetchChats = async () => {
    setLoading(true);
    try {
      const landlordId = user?.id;
      const data = await chatApi.getChatRooms(landlordId);
      const chats = Array.isArray(data) ? data : data.data;
      setChats(chats);
    } catch (error) {
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and searched chats
  const filteredChats = chats.filter(chat => {
    const searchTerm = search.toLowerCase();
    return (
      (chat.propertyTitle?.toLowerCase().includes(searchTerm) || 
       `Property ${chat.property_id}`.toLowerCase().includes(searchTerm)) ||
      (chat.tenantName?.toLowerCase().includes(searchTerm) || 
       chat.tenant_id.toLowerCase().includes(searchTerm)) ||
      (chat.lastMessage?.toLowerCase().includes(searchTerm))
    );
  });

  // Header
  if (selectedChat) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedChat(null)}
                  className="mr-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Button>
                <h1 className="text-2xl font-bold text-roomzi-blue">Messages</h1>
              </div>
            </div>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ChatWindow
            chatRoomId={selectedChat.id}
            propertyTitle={selectedChat.propertyTitle || selectedChat.property_name}
            landlordName={user?.email || 'You'}
            tenantName={selectedChat.tenant_name}
            propertyId={selectedChat.property_id}
            landlordId={selectedChat.landlord_id}
            isFullPage={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/landlord')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Messages</h1>
            </div>
            {/* Optionally, add a badge for new/unread messages */}
          </div>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and filter bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-2">
          <input
            type="text"
            placeholder="Search by tenant, property, or message..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full md:w-80 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <div className="flex gap-2 mt-2 md:mt-0">
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={filter === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
          </div>
        </div>
        <div className="space-y-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Loading chats...</div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-12">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <Button onClick={() => navigate('/landlord')} className="roomzi-gradient">
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          ) : (
            filteredChats.map((chat) => (
              <Card key={chat.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="p-6 flex items-start space-x-4">
                  <img
                    src={chat.propertyImage || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop'}
                    alt={chat.propertyTitle || chat.property_id}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {chat.property_name}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Tenant:</span> {chat.tenant_name}
                    </p>
                    <p className="text-gray-700 mb-2 line-clamp-2">
                      {chat.lastMessage ? chat.lastMessage : ''}
                    </p>
                    <p className="text-xs text-gray-500">Started: {new Date(chat.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button 
                      size="sm" 
                      className="roomzi-gradient"
                      onClick={() => setSelectedChat(chat)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (window.confirm('Are you sure you want to delete this chat? This cannot be undone.')) {
                          try {
                            await chatApi.deleteChatRoom(chat.id, user?.id);
                            setChats(prev => prev.filter(c => c.id !== chat.id));
                          } catch (err) {
                            alert('Failed to delete chat.');
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 