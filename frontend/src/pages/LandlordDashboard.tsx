import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, User, Settings, MapPin, Calendar, MessageCircle, Plus, LogOut } from 'lucide-react';
import { sampleProperties, Property } from '@/data/sampleProperties';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const LandlordDashboard = () => {
  const [properties, setProperties] = useState<Property[]>(sampleProperties);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const handleCreateListing = () => {
    navigate('/create-listing');
  };

  const totalIncome = properties.reduce((sum, property) => sum + property.price, 0);
  const occupiedProperties = properties.filter(p => !p.available).length;

  // Get user's name from metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Landlord';

  useEffect(() => {
    async function fetchProperties() {
      const response = await fetch('http://localhost:3001/api/landlord/get-listings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      const data = await response.json();
      if (response.ok) {
        setProperties(data);
      }
    }

    fetchProperties();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-roomzi-blue">Room<span className="text-yellow-500">zi</span></h1>
              <Badge className="ml-3 bg-green-100 text-green-800">Landlord</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/landlord/profile')}
                className="hover:bg-green-50"
              >
                <User className="w-4 h-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/landlord/chats')}
                className="hover:bg-blue-50"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Messages
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => signOut()}
                className="hover:bg-red-50 text-red-600"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back, {userName}!</h2>
            <p className="text-gray-600">Manage your properties and connect with tenants</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Total Properties</p>
                <p className="text-3xl font-bold">{properties.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-400 rounded-lg flex items-center justify-center">
                <Home className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 mb-1">Monthly Income</p>
                <p className="text-3xl font-bold">${totalIncome.toLocaleString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">Occupied Units</p>
                <p className="text-3xl font-bold">{occupiedProperties}</p>
              </div>
              <div className="w-12 h-12 bg-purple-400 rounded-lg flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </Card>
        </div>

        {/* My Properties Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">My Properties</h2>
          <Button onClick={handleCreateListing} className="roomzi-gradient shadow-lg hover:shadow-xl">
            <Plus className="w-4 h-4 mr-2" />
            Add New Property
          </Button>
        </div>

        {/* Properties Grid */}
        <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-8">
          {properties.map((property) => (
            <Card key={property.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 bg-white">
              <div className="aspect-video overflow-hidden">
                <img
                  src={property.images}
                  alt={property.title}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900 line-clamp-1">{property.title}</h3>
                  <Badge 
                    variant={property.available ? "default" : "secondary"}
                    className={property.available ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                  >
                    {property.available ? 'Available' : 'Occupied'}
                  </Badge>
                </div>
                
                <div className="flex items-center text-gray-600 mb-3">
                  <MapPin className="w-4 h-4 mr-2 shrink-0" />
                  <span className="text-sm line-clamp-1">{property.address}, {property.city}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-4">
                  <Home className="w-4 h-4 mr-2 shrink-0" />
                  <span className="text-sm">
                    {property.bedrooms} bed • {property.bathrooms} bath • {property.area} sq ft
                  </span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-2xl font-bold text-roomzi-blue">
                    ${property.price.toLocaleString()}
                    <span className="text-sm font-normal text-gray-500">/month</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    Manage
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive">
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {properties.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-4">
              <Home className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No properties yet</h3>
              <p>Create your first listing to get started</p>
            </div>
            <Button onClick={handleCreateListing} className="roomzi-gradient mt-4">
              Create Your First Listing
            </Button>
          </div>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 shadow-lg">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 text-roomzi-blue"
            onClick={() => navigate('/landlord')}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs">Properties</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2"
            onClick={() => {/* Navigate to matches */}}
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Matches</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2"
            onClick={handleCreateListing}
          >
            <Plus className="w-5 h-5 mb-1" />
            <span className="text-xs">Add Listing</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2"
            onClick={() => navigate('/landlord/profile')}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default LandlordDashboard;
