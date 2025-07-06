import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageCircle, Home, Calendar, User, X } from 'lucide-react';
import { ChatWindow } from '@/components/chat/ChatWindow';

const TenantMatches = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedChat, setSelectedChat] = useState<{
    propertyTitle: string;
    propertyImage: string;
    landlordName: string;
    landlordImage?: string;
    landlordId: string;
    propertyId: string;
  } | null>(null);

  const matches = [
    {
      id: 1,
      propertyId: 'property1',
      landlordId: 'landlord1',
      propertyTitle: "Modern Studio in Downtown",
      landlordName: "Sarah Johnson",
      landlordImage: "https://randomuser.me/api/portraits/women/1.jpg",
      landlord_name: "Sarah Johnson",
      message: "Hi! I'm interested in your property. Can we schedule a viewing?",
      time: "2 hours ago",
      unread: true,
      propertyImage: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300&h=200&fit=crop"
    },
    {
      id: 2,
      propertyId: 'property2',
      landlordId: 'landlord2',
      propertyTitle: "Cozy 1BR Apartment",
      landlordName: "Mike Chen",
      landlordImage: "https://randomuser.me/api/portraits/men/2.jpg",
      landlord_name: "Mike Chen",
      message: "The viewing is confirmed for tomorrow at 3 PM.",
      time: "1 day ago",
      unread: false,
      propertyImage: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=300&h=200&fit=crop"
    },
    {
      id: 3,
      propertyId: 'property3',
      landlordId: 'landlord3',
      propertyTitle: "Shared Room in House",
      landlordName: "Emily Davis",
      landlordImage: "https://randomuser.me/api/portraits/women/3.jpg",
      landlord_name: "Emily Davis",
      message: "Thank you for your interest. Let me know when you're available.",
      time: "3 days ago",
      unread: false,
      propertyImage: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=300&h=200&fit=crop"
    }
  ];

  const handleReply = (match: typeof matches[0]) => {
    setSelectedChat({
      propertyTitle: match.propertyTitle,
      propertyImage: match.propertyImage,
      landlordName: match.landlordName,
      landlordImage: match.landlordImage,
      landlordId: match.landlordId,
      propertyId: match.propertyId,
    });
  };

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
                onClick={() => navigate('/tenant')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Matches</h1>
            </div>
            <Badge variant="secondary">{matches.filter(m => m.unread).length} New</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('matches')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'matches'
                ? 'bg-white text-roomzi-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Messages</span>
          </button>
          <button
            onClick={() => setActiveTab('viewings')}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === 'viewings'
                ? 'bg-white text-roomzi-blue shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span className="text-sm font-medium">Viewings</span>
          </button>
        </div>

        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {matches.map((match) => (
              <Card key={match.id} className="overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <img
                      src={match.propertyImage}
                      alt={match.propertyTitle}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {match.propertyTitle}
                        </h3>
                        {match.unread && (
                          <Badge className="bg-roomzi-blue text-white">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        {match.landlordName}
                      </p>
                      <p className="text-gray-700 mb-2 line-clamp-2">{match.message}</p>
                      <p className="text-xs text-gray-500">{match.time}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      className="roomzi-gradient flex-1"
                      onClick={() => handleReply(match)}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button size="sm" variant="outline">
                      <Home className="w-4 h-4 mr-2" />
                      View Property
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Viewings Tab */}
        {activeTab === 'viewings' && (
          <div className="space-y-4">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upcoming Viewings</h3>
                <Badge className="bg-green-100 text-green-800">1 Scheduled</Badge>
              </div>
              <div className="border-l-4 border-roomzi-blue pl-4">
                <h4 className="font-medium">Cozy 1BR Apartment</h4>
                <p className="text-sm text-gray-600">Tomorrow, 3:00 PM</p>
                <p className="text-sm text-gray-600">with Mike Chen</p>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline">Reschedule</Button>
                  <Button size="sm" variant="destructive">Cancel</Button>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Past Viewings</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-gray-300 pl-4">
                  <h4 className="font-medium">Modern Studio in Downtown</h4>
                  <p className="text-sm text-gray-600">Last week, 2:00 PM</p>
                  <p className="text-sm text-gray-600">with Sarah Johnson</p>
                  <Badge variant="secondary" className="mt-1">Completed</Badge>
                </div>
              </div>
            </Card>
          </div>
        )}

        {matches.length === 0 && (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-500 mb-2">No matches yet</h3>
            <p className="text-gray-400 mb-4">Start browsing properties to connect with landlords</p>
            <Button onClick={() => navigate('/tenant')} className="roomzi-gradient">
              Browse Properties
            </Button>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {selectedChat && (
        <div className="fixed bottom-4 right-4 z-50 w-[400px]">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute -top-2 -right-2 z-10 bg-white rounded-full shadow-md hover:bg-gray-100"
              onClick={() => setSelectedChat(null)}
            >
              <X className="h-4 w-4" />
            </Button>

            <ChatWindow
              propertyTitle={selectedChat.propertyTitle}
              propertyImage={selectedChat.propertyImage}
              landlordName={selectedChat.landlordName}
              landlordImage={selectedChat.landlordImage}
              landlordId={selectedChat.landlordId}
              propertyId={selectedChat.propertyId}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantMatches;
