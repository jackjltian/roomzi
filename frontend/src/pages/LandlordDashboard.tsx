import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Home, User, Settings, MapPin, Calendar, MessageCircle, Plus, LogOut, Wrench } from 'lucide-react';
import { sampleProperties, Property } from '@/data/sampleProperties';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { useToast } from '@/hooks/use-toast';

const LandlordDashboard = () => {
  const [properties, setProperties] = useState<Property[]>(sampleProperties);
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [pendingMaintenanceCount, setPendingMaintenanceCount] = useState(0);
  const [showBanner, setShowBanner] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [newlySignedLeases, setNewlySignedLeases] = useState<any[]>([]);

  // Get user's name from metadata or email
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Landlord';
  const userId = user?.id || '';

  const handleCreateListing = () => {
    navigate('/create-listing');
  };

  const handleManageListing = (listingId) => {
    navigate(`/manage-listing/${listingId}`);
  }

  const handleViewPayments = () => {
    navigate('/payments');
  }

  const totalIncome = properties.reduce((sum, property) => property.landlord_id === userId ? sum + property.price : sum, 0);
  const occupiedProperties = properties.filter(p => p.landlord_id === userId && !p.available).length;

  useEffect(() => {
    async function fetchProperties() {
      if (!userId) return;
      
      console.log('Fetching properties for user ID:', userId);
      
      const response = await fetch(`http://localhost:3001/api/landlords/${userId}/listings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });
      const data = await response.json();
      console.log('API response:', data);
      
      if (response.ok) {
        // The backend returns data wrapped in successResponse format
        const listings = data.data || data;
        console.log('Filtered listings:', listings);
        setProperties(listings);
      } else {
        console.error('Failed to fetch properties:', data);
      }
    }

    fetchProperties();
  }, [userId]);

  useEffect(() => {
    async function fetchPendingMaintenance() {
      if (!userId) return;
      const lastSeen = localStorage.getItem('maintenance_last_seen') || '0';
      const { data, error } = await supabase
        .from('maintenance_requests')
        .select('createdAt', { count: 'exact' })
        .eq('landlordId', userId)
        .eq('status', 'Pending');
      if (!error && data) {
        const newRequests = data.filter((r) => new Date(r.createdAt).getTime() > Number(lastSeen));
        setPendingMaintenanceCount(newRequests.length);
        setShowBanner(newRequests.length > 0);
      }
    }

    async function checkForUnreadMessages() {
      if (!userId) return;
      try {
        const response = await apiFetch(`${getApiBaseUrl()}/api/chats/user/${userId}/landlord`);
        const chatArray = response?.data;
        if (chatArray && Array.isArray(chatArray)) {
          const unreadCount = chatArray.filter((chat: any) => chat.unread).length;
          setUnreadMessageCount(unreadCount);
        }
      } catch (err) {
        setUnreadMessageCount(0);
      }
    }

    async function checkForNewlySignedLeases() {
      if (!userId) return;
      try {
        // Fetch all leases for this landlord's properties
        const listingsResponse = await fetch(`${getApiBaseUrl()}/api/landlords/${userId}/listings`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
        });
        
        if (!listingsResponse.ok) return;
        
        const listingsData = await listingsResponse.json();
        const listings = listingsData.data || listingsData;
        
        // Get leases for each listing
        const allLeases: any[] = [];
        for (const listing of listings) {
          try {
            // Check if there's a lease for this listing by property ID
            const leaseResponse = await fetch(`${getApiBaseUrl()}/api/leases/listing/${listing.id}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              },
              credentials: 'include',
            });
            
            if (leaseResponse.ok) {
              const leaseData = await leaseResponse.json();
              if (leaseData.data && Array.isArray(leaseData.data)) {
                allLeases.push(...leaseData.data);
              } else if (leaseData.data) {
                allLeases.push(leaseData.data);
              }
            }
          } catch (err) {
            console.error(`Error fetching leases for listing ${listing.id}:`, err);
          }
        }
        
        // Filter for signed leases that haven't been seen by landlord
        const unseenSignedLeases = allLeases.filter((lease: any) => {
          // Only show banner for leases that are signed AND haven't been seen by landlord
          return lease.signed === true && lease.landlordseen === false;
        });
        
        // Set the unseen signed leases for banner display
        setNewlySignedLeases(unseenSignedLeases);
      } catch (err) {
        console.error('Error checking for newly signed leases:', err);
      }
    }

    fetchPendingMaintenance();
    checkForUnreadMessages();
    checkForNewlySignedLeases();
  }, [userId, toast]);



  // Refresh data when component comes into focus
  useEffect(() => {
    const handleFocus = () => {
      if (userId) {
        async function checkForUnreadMessages() {
          try {
            const response = await apiFetch(`${getApiBaseUrl()}/api/chats/user/${userId}/landlord`);
            const chatArray = response?.data;
            if (chatArray && Array.isArray(chatArray)) {
              const unreadCount = chatArray.filter((chat: any) => chat.unread).length;
              setUnreadMessageCount(unreadCount);
            }
          } catch (err) {
            setUnreadMessageCount(0);
          }
        }
        checkForUnreadMessages();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [userId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 pb-24">
      {/* Newly Signed Leases Banner */}
      {newlySignedLeases.length > 0 && (
        <div className="bg-green-50 border-b border-green-200 p-4">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎉</span>
                <div>
                  <h3 className="font-semibold text-green-800">Congratulations!</h3>
                  <p className="text-sm text-green-700">
                    {newlySignedLeases.length === 1 ? (
                      <>
                        {newlySignedLeases[0].tenant_profiles?.full_name || newlySignedLeases[0].tenant_name || newlySignedLeases[0].tenantName || 'Tenant'} signed lease for {newlySignedLeases[0].listings?.title || newlySignedLeases[0].property_name || newlySignedLeases[0].propertyName || 'Property'}!
                      </>
                    ) : (
                      `${newlySignedLeases.length} new lease${newlySignedLeases.length === 1 ? ' has' : 's have'} been signed!`
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-800 hover:bg-green-100"
                onClick={async () => {
                  // Mark all unseen leases as seen
                  if (newlySignedLeases.length > 0) {
                    try {
                      const leaseIds = newlySignedLeases.map(lease => lease.id);
                      await fetch(`${getApiBaseUrl()}/api/leases/mark-seen`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json'
                        },
                        credentials: 'include',
                        body: JSON.stringify({ leaseIds })
                      });
                    } catch (err) {
                      console.error('Error marking leases as seen:', err);
                    }
                  }
                  setNewlySignedLeases([]);
                }}
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

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

        {/* Notification banner for pending requests */}
        {showBanner && (
          <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded mb-4 flex items-center gap-2 shadow">
            <Wrench className="w-5 h-5" />
            {pendingMaintenanceCount} new maintenance request{pendingMaintenanceCount > 1 ? 's' : ''}!
            <Button size="sm" variant="link" onClick={() => {
              navigate('/landlord/maintenance-requests');
            }}>
              View
            </Button>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 mb-1">Total Properties</p>
                <p className="text-3xl font-bold">{properties.filter(property => property.landlord_id === userId).length}</p>
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
              <Button className="w-12 h-12 bg-green-400 rounded-lg flex items-center justify-center hover:bg-green-600" onClick={handleViewPayments}>
                <Calendar className="w-6 h-6 text-white" />
              </Button>
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
                  src={Array.isArray(property.images) ? property.images[0] : JSON.parse(property.images)[0]}
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
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => handleManageListing(property.id)}>
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
            className="flex-col h-auto py-2 relative"
            onClick={() => navigate('/landlord/matches')}
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Matches</span>
            {unreadMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 animate-pulse min-w-[18px] text-center">
                {unreadMessageCount}
              </span>
            )}
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
            className="flex-col h-auto py-2 relative"
            onClick={() => navigate('/landlord/maintenance-requests')}
          >
            <Wrench className="w-5 h-5 mb-1" />
            <span className="text-xs">Maintenance</span>
            {pendingMaintenanceCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                {pendingMaintenanceCount}
              </span>
            )}
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
