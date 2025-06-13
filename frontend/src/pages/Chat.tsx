import React, { useState, useEffect } from 'react';
import { ChatWindow } from '../components/chat/ChatWindow';
import { chatApi, ChatRoom } from '@/api/chat';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';

// Temporary user ID for testing
const TEMP_USER_ID = "123";
const TEMP_LANDLORD_ID = "456";

export default function Chat() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [selectedChatRoom, setSelectedChatRoom] = useState<ChatRoom | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchChatRooms();
  }, []);

  const fetchChatRooms = async () => {
    try {
      setIsLoading(true);
      const rooms = await chatApi.getChatRooms(TEMP_USER_ID);
      console.log('Fetched chat rooms:', rooms);
      setChatRooms(rooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      toast({
        title: "Error",
        description: "Failed to load chat rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatRoomSelect = (room: ChatRoom) => {
    console.log('Selected chat room:', room);
    setSelectedChatRoom(room);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="grid grid-cols-12 gap-6">
        {/* Chat Rooms List */}
        <div className="col-span-3">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">Chats</h2>
            <div className="space-y-2">
              {chatRooms.map((room) => (
                <Button
                  key={room.id}
                  variant={selectedChatRoom?.id === room.id ? "default" : "ghost"}
                  className="w-full justify-start"
                  onClick={() => handleChatRoomSelect(room)}
                >
                  <Avatar className="h-8 w-8 mr-2">
                    <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                      {room.landlord_id.charAt(0)}
                    </div>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Property {room.property_id}</p>
                    <p className="text-sm text-muted-foreground">
                      {room.tenant_id === TEMP_USER_ID ? 'Landlord' : 'Tenant'}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </Card>
        </div>

        {/* Chat Window */}
        <div className="col-span-9">
          {selectedChatRoom ? (
            <ChatWindow
              chatRoomId={selectedChatRoom.id}
              propertyTitle={`Property ${selectedChatRoom.property_id}`}
              landlordName={selectedChatRoom.landlord_id === TEMP_USER_ID ? 'You' : 'Landlord'}
            />
          ) : (
            <Card className="h-[500px] flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg text-muted-foreground">Select a chat to start messaging</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 