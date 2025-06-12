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
import { toast } from '../ui/use-toast';
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

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'landlord';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  type: 'text' | 'image';
  imageUrl?: string;
  replyTo?: Message;
  reactions: Record<string, string[]>;
  isDeleted?: boolean;
  isEditing?: boolean;
}

interface ChatWindowProps {
  propertyTitle?: string;
  propertyImage?: string;
  landlordName?: string;
  landlordImage?: string;
}

const REACTIONS = [
  { emoji: '👍', icon: ThumbsUp },
  { emoji: '❤️', icon: Heart },
  { emoji: '😂', icon: Laugh },
];

const MAX_MESSAGE_LENGTH = 1000;

export function ChatWindow({ 
  propertyTitle = "Modern Downtown Apartment",
  propertyImage = "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267",
  landlordName,
  landlordImage
}: ChatWindowProps) {
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

  // Update currentLandlordName when landlordName prop changes
  useEffect(() => {
    if (landlordName) {
      setCurrentLandlordName(landlordName);
    }
  }, [landlordName]);

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

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        content: newMessage,
        sender: 'user',
        timestamp: new Date(),
        status: 'sending',
        type: 'text',
        replyTo: replyTo || undefined,
        reactions: {}
      };
      setMessages([...messages, message]);
      setNewMessage('');
      setReplyTo(null);
      
      // Simulate message sending
      setTimeout(() => {
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, status: 'sent' } : m
        ));
        
        // Simulate message delivery
        setTimeout(() => {
          setMessages(prev => prev.map(m => 
            m.id === message.id ? { ...m, status: 'delivered' } : m
          ));
          
          // Simulate message read
          setTimeout(() => {
            setMessages(prev => prev.map(m => 
              m.id === message.id ? { ...m, status: 'read' } : m
            ));
            
            // Simulate landlord typing
            setIsTyping(true);
            setTimeout(() => {
              setIsTyping(false);
              // Simulate landlord response
              const response: Message = {
                id: (Date.now() + 1).toString(),
                content: "Thank you for your interest! I'll get back to you shortly.",
                sender: 'landlord',
                timestamp: new Date(),
                status: 'sent',
                type: 'text',
                reactions: {}
              };
              setMessages(prev => [...prev, response]);
            }, 2000);
          }, 1000);
        }, 1000);
      }, 1000);
    }
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
            if (reactions[key].length === 0) {
              delete reactions[key];
            }
          });
          // Add new reaction
          reactions[reaction] = [...(reactions[reaction] || []), userId];
        }
        return { ...m, reactions };
      }
      return m;
    }));

    // Close the message menu
    setActiveMenuId(null);
    setHoveredMessageId(null);
  };

  const getStatusIcon = (status: Message['status']) => {
    switch (status) {
      case 'sending':
        return <Clock className="h-3 w-3 animate-spin" />;
      case 'sent':
        return <Check className="h-3 w-3" />;
      case 'delivered':
        return <Check className="h-3 w-3" />;
      case 'read':
        return <Check className="h-3 w-3 text-blue-500" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
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
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      const message: Message = {
        id: Date.now().toString(),
        content: "Shared an image",
        sender: 'user',
        timestamp: new Date(),
        status: 'sent',
        type: 'image',
        imageUrl,
        reactions: {}
      };
      setMessages(prev => [...prev, message]);

      // Simulate landlord response for image
      const response: Message = {
        id: (Date.now() + 1).toString(),
        content: "Thanks for sharing the image! I'll take a look at it.",
        sender: 'landlord',
        timestamp: new Date(),
        status: 'sent',
        type: 'text',
        reactions: {}
      };
      setMessages(prev => [...prev, response]);
    };
    reader.readAsDataURL(file);
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (hours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(message => {
      const date = message.timestamp.toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <Card className="w-full h-[500px] flex flex-col">
      {/* Property Context Header */}
      <div className="p-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg overflow-hidden">
            <img
              src={propertyImage}
              alt={propertyTitle}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold truncate">{propertyTitle}</h2>
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