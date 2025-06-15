import React, { useState, useRef, useEffect } from 'react';
import { Card } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { 
  Image, 
  Send, 
  Paperclip, 
  Smile, 
  ChevronDown,
  Copy,
  Reply,
  MoreVertical,
  Clock,
  X,
  ThumbsUp,
  Heart,
  Laugh,
  Trash2,
  Edit2,
  Check,
  AlertCircle
} from 'lucide-react';
import { EmojiPicker } from './EmojiPicker';
import { toast } from '@/hooks/use-toast';
import { chatApi, Message as ApiMessage } from '@/api/chat';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { useAuth } from '@/context/AuthContext';
import { getCurrentUserRole } from '@/utils/auth';

interface ChatWindowProps {
  propertyTitle?: string;
  propertyImage?: string;
  landlordName?: string;
  landlordImage?: string;
  chatRoomId?: string;
  landlordId?: string;
  propertyId?: string;
  isFullPage?: boolean;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'landlord' | 'other';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type: 'text' | 'image';
  imageUrl?: string;
  replyTo?: Message;
  reactions: Record<string, string[]>;
  isDeleted?: boolean;
  isEditing?: boolean;
}

const REACTIONS = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '😂', icon: Laugh },
];

const MAX_MESSAGE_LENGTH = 1000;

export function ChatWindow({ 
  propertyTitle,
  propertyImage = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  landlordName,
  landlordImage,
  chatRoomId: initialChatRoomId,
  landlordId,
  propertyId,
  isFullPage = false
}: ChatWindowProps) {
  const { user } = useAuth();
  const userRole = getCurrentUserRole(user);
  const [chatRoomId, setChatRoomId] = useState<string | undefined>(initialChatRoomId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [currentLandlordName, setCurrentLandlordName] = useState(() => landlordName || 'Landlord');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // On mount, try to find an existing chat room and fetch messages
  useEffect(() => {
    const tryFindChatRoom = async () => {
      if (!chatRoomId && user && landlordId && propertyId) {
        const tenant_id = userRole === 'tenant' ? user.id : undefined;
        const landlord_id = userRole === 'tenant' ? landlordId : user.id;
        try {
          const chatRoom = await chatApi.findOrCreateChatRoom(
            tenant_id,
            landlord_id,
            propertyId
          );
          if (chatRoom && chatRoom.id) {
            setChatRoomId(chatRoom.id);
            await fetchMessages(chatRoom.id);
          }
        } catch (e) {
          // Ignore if not found, only create on send
        }
      }
    };
    tryFindChatRoom();
    // eslint-disable-next-line
  }, []);

  // Fetch messages when chatRoomId changes
  useEffect(() => {
    if (chatRoomId) {
      fetchMessages(chatRoomId);
    }
  }, [chatRoomId]);

  const fetchMessages = async (roomId: string) => {
    try {
      setIsLoading(true);
      const apiMessages = await chatApi.getMessages(roomId);
      const formattedMessages = apiMessages.map((msg: ApiMessage) => ({
        id: msg.id,
        content: msg.content,
        sender: msg.sender_id === user?.id ? 'user' : 'other',
        timestamp: new Date(msg.created_at),
        status: 'sent',
        type: 'text',
        reactions: {}
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!user?.id) {
      toast({
        title: "Error",
        description: "You must be logged in to send messages",
        variant: "destructive",
      });
      return;
    }

    if (!userRole) {
      toast({
        title: "Error",
        description: "You must have a valid role to send messages",
        variant: "destructive",
      });
      return;
    }

    let roomId = chatRoomId;

    // If no chatRoomId, find or create one
    if (!roomId) {
      try {
        const tenant_id = userRole === 'tenant' ? user.id : undefined;
        const landlord_id = userRole === 'tenant' ? landlordId : user.id;
        const chatRoom = await chatApi.findOrCreateChatRoom(
          tenant_id,
          landlord_id,
          propertyId
        );
        roomId = chatRoom.id;
        setChatRoomId(roomId);
        await fetchMessages(roomId);
      } catch (error) {
        toast({
          title: "Error",
          description: "Could not create or find chat room.",
          variant: "destructive",
        });
        return;
      }
    }

    const tempMessage: Message = {
      id: Date.now().toString(),
      content: newMessage,
      sender: userRole === 'tenant' ? 'user' : 'landlord',
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
      replyTo: replyTo || undefined,
      reactions: {}
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    setReplyTo(null);

    try {
      const sentMessage = await chatApi.sendMessage(
        roomId!,
        user.id,
        newMessage,
        userRole,
        landlordId
      );

      // After sending, re-fetch all messages to ensure correct sender alignment
      await fetchMessages(roomId!);
    } catch (error: any) {
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id 
          ? { ...m, status: 'error' }
          : m
      ));
      toast({
        title: "Error Sending Message",
        description: error.response?.data?.message || error.message || "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle scroll events to show/hide scroll button
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setShowScrollButton(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleEditMessage = (message: Message) => {
    setEditingMessage(message);
    setNewMessage(message.content);
  };

  const handleSaveEdit = () => {
    if (editingMessage && newMessage.trim()) {
      setMessages(prev => prev.map(m => 
        m.id === editingMessage.id 
          ? { ...m, content: newMessage.trim(), isEditing: false }
          : m
      ));
      setNewMessage('');
      setEditingMessage(null);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(messages.map(msg => 
      msg.id === messageId 
        ? { ...msg, isDeleted: true, content: '' }
        : msg
    ));
    setActiveMenuId(null);
  };

  const handleMessageClick = (messageId: string) => {
    setActiveMenuId(activeMenuId === messageId ? null : messageId);
  };

  const handleMessageMouseEnter = (messageId: string) => {
    setHoveredMessageId(messageId);
  };

  const handleMessageMouseLeave = () => {
    setHoveredMessageId(null);
  };

  const handleReaction = (messageId: string, reaction: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = { ...m.reactions };
        const userId = 'user'; // In a real app, this would be the actual user ID

        // If user already reacted with this emoji, remove it
        if (reactions[reaction]?.includes(userId)) {
          if (reactions[reaction].length === 1) {
            delete reactions[reaction];
          } else {
            reactions[reaction] = reactions[reaction].filter(id => id !== userId);
          }
        } else {
          // Remove user's previous reaction if any
          Object.keys(reactions).forEach(key => {
            reactions[key] = reactions[key].filter(id => id !== userId);
          });
          // Add new reaction
          reactions[reaction] = [...(reactions[reaction] || []), userId];
        }

        return { ...m, reactions };
      }
      return m;
    }));
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3" />;
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <Check className="h-3 w-3" />;
      case 'read':
        return <Check className="h-3 w-3" />;
      case 'error':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Handle file upload
      console.log('File selected:', file);
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {};
    messages.forEach(message => {
      const date = message.timestamp.toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  // When rendering messages, filter out 'other' messages that are in 'sending' status
  const displayedMessages = messages.filter(msg => !(msg.status === 'sending' && msg.sender !== 'user'));

  const messageGroups = groupMessagesByDate(displayedMessages);

  return (
    <Card className={`w-full ${isFullPage ? 'h-full' : 'h-[500px]'} flex flex-col`}>
      {/* Property Context Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            <img
              src={propertyImage}
              alt={propertyTitle || "Modern Downtown Apartment"}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{propertyTitle || "Modern Downtown Apartment"}</h2>
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
                <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs">
                  {currentLandlordName.charAt(0)}
                </div>
              </Avatar>
              <span className="text-xs text-gray-600">{currentLandlordName}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                Online
              </Badge>
            </div>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea 
        className="flex-1 p-3 bg-gray-50"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="space-y-4">
          {Object.entries(messageGroups).map(([date, messages]) => (
            <div key={date} className="space-y-3">
              <div className="flex items-center justify-center">
                <Badge variant="secondary" className="text-xs">
                  {date === new Date().toLocaleDateString() ? 'Today' : date}
                </Badge>
              </div>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex items-end gap-2 max-w-[80%] group ${
                      message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <Avatar className="h-6 w-6">
                      <div className="h-full w-full bg-primary/10 flex items-center justify-center text-xs">
                        {message.sender === 'user' ? 'U' : currentLandlordName.charAt(0)}
                      </div>
                    </Avatar>
                    <div
                      className={`rounded-lg p-2 relative ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-white shadow-sm'
                      }`}
                      onClick={() => handleMessageClick(message.id)}
                      onMouseEnter={() => handleMessageMouseEnter(message.id)}
                      onMouseLeave={handleMessageMouseLeave}
                    >
                      {message.replyTo && (
                        <div className="text-xs opacity-70 mb-1 border-l-2 pl-2 border-current">
                          Replying to: {message.replyTo.content}
                        </div>
                      )}
                      {message.type === 'image' && message.imageUrl ? (
                        <img 
                          src={message.imageUrl} 
                          alt="Shared image" 
                          className="max-w-[180px] rounded-lg mb-1"
                        />
                      ) : null}
                      {message.isDeleted ? (
                        <p className={`text-sm italic ${
                          message.sender === 'user' 
                            ? 'text-primary-foreground/70' 
                            : 'text-gray-600'
                        }`}>This message was deleted</p>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
                      <div className="flex items-center gap-1 mt-0.5">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <span className="text-[10px] opacity-70">
                                {formatTimestamp(message.timestamp)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{message.timestamp.toLocaleString()}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        {message.sender === 'user' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <span className="text-[10px] opacity-70">
                                  {getStatusIcon(message.status)}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{message.status.charAt(0).toUpperCase() + message.status.slice(1)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                      {/* Reactions */}
                      {Object.entries(message.reactions).length > 0 && (
                        <div className={`absolute -bottom-3 flex gap-0.5 ${
                          message.sender === 'user' ? '-left-3' : '-right-3'
                        }`}>
                          {Object.entries(message.reactions).map(([reaction, userIds]) => (
                            <Badge 
                              key={reaction} 
                              variant="secondary" 
                              className={`text-xs px-1.5 py-0.5 ${
                                message.sender === 'user'
                                  ? 'bg-white/90 text-primary shadow-sm'
                                  : (userIds as string[]).includes('user')
                                    ? 'bg-primary/20 text-primary'
                                    : ''
                              }`}
                            >
                              {reaction} {(userIds as string[]).length}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div 
                        id={`message-menu-${message.id}`}
                        className={`absolute right-0 top-0 -mr-8 rounded-lg shadow-lg border p-1 min-w-[120px] z-50 ${
                          message.sender === 'user' 
                            ? 'bg-primary text-primary-foreground' 
                            : 'bg-white'
                        } ${
                          activeMenuId === message.id || hoveredMessageId === message.id ? 'block' : 'hidden'
                        }`}
                      >
                        {message.sender === 'user' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-xs h-7 ${
                                message.sender === 'user' 
                                  ? 'hover:bg-primary-foreground/20' 
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditMessage(message);
                              }}
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`w-full justify-start text-xs h-7 text-red-400 hover:text-red-300 ${
                                message.sender === 'user' 
                                  ? 'hover:bg-primary-foreground/20' 
                                  : 'hover:bg-gray-100'
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteMessage(message.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              Delete
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-xs h-7 ${
                            message.sender === 'user' 
                              ? 'hover:bg-primary-foreground/20' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setReplyTo(message);
                          }}
                        >
                          <Reply className="h-3 w-3 mr-2" />
                          Reply
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`w-full justify-start text-xs h-7 ${
                            message.sender === 'user' 
                              ? 'hover:bg-primary-foreground/20' 
                              : 'hover:bg-gray-100'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(message.content);
                            toast({
                              title: "Copied to clipboard",
                              description: "Message content has been copied.",
                            });
                          }}
                        >
                          <Copy className="h-3 w-3 mr-2" />
                          Copy
                        </Button>
                        <div className={`px-2 py-1.5 border-t mt-1 ${
                          message.sender === 'user' 
                            ? 'border-primary-foreground/20' 
                            : 'border-gray-200'
                        }`}>
                          <div className="flex gap-1 justify-center">
                            {REACTIONS.map(({ emoji, icon: Icon }) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="icon"
                                className={`h-6 w-6 ${
                                  message.sender === 'user' 
                                    ? 'hover:bg-primary-foreground/20' 
                                    : 'hover:bg-gray-100'
                                } ${
                                  message.reactions[emoji]?.includes('user') 
                                    ? 'bg-primary/20 text-primary' 
                                    : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReaction(message.id, emoji);
                                }}
                              >
                                <Icon className="h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ))}
          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-100" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-200" />
              </div>
              <span>{currentLandlordName} is typing...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Scroll to Bottom Button */}
      {showScrollButton && (
        <Button 
          variant="secondary"
          size="icon" 
          className="absolute bottom-20 right-6 rounded-full shadow-lg"
          onClick={scrollToBottom}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      )}

      {/* Input Area */}
      <div className="p-3 border-t bg-white">
        {replyTo && (
          <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-md">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Replying to: {replyTo.content}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => setReplyTo(null)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        {editingMessage && (
          <div className="flex items-center justify-between mb-2 p-2 bg-gray-50 rounded-md">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Editing message</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={() => {
                setEditingMessage(null);
                setNewMessage('');
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="shrink-0 h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <EmojiPicker onEmojiSelect={handleEmojiSelect} />
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={editingMessage ? "Edit your message..." : "Type a message..."}
            className="h-8 text-sm"
          />
          <Button 
            onClick={editingMessage ? handleSaveEdit : handleSendMessage}
            size="icon"
            className="shrink-0 h-8 w-8 bg-primary hover:bg-primary/90"
            disabled={!newMessage.trim()}
          >
            {editingMessage ? <Check className="h-4 w-4" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
} 