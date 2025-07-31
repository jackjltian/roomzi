import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Home, User, Settings, MessageCircle, Search, Grid, Map as MapIcon, LogOut, Calendar as CalendarIcon, XCircle, CheckCircle, Clock } from 'lucide-react';
import { Property } from '@/data/sampleProperties';
import { useNavigate, useLocation } from 'react-router-dom';
import Map from '@/components/Map';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/utils/api';
import { getApiBaseUrl, getLeasesForTenant } from '@/utils/api';
import UpcomingPaymentBanner from '@/components/UpcomingPaymentBanner';

// Helper to safely parse JSON fields
const parseMaybeJson = (value, fallback = []) => {
  if (typeof value === 'string') {
    try {
      if (!value || value === 'null' || value === 'undefined') return fallback;
      return JSON.parse(value);
    } catch (e) {
      console.warn('Failed to parse JSON:', value, e);
      // Not a JSON string, return as array with the string or fallback
      return value ? [value] : fallback;
    }
  }
  if (Array.isArray(value)) return value;
  return fallback;
};

const TenantDashboard = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    profilePhoto: '',
  });
  const location = useLocation();
  const [viewings, setViewings] = useState([]);
  const [loadingViewings, setLoadingViewings] = useState(true);

  // Add mock lease state
  const [hasNewLease, setHasNewLease] = useState(false); // now real data
  const [leaseId, setLeaseId] = useState<string | null>(null);

  // Debug: Log current user info
  useEffect(() => {
    console.log('🔍 Current user info:', {
      id: user?.id,
      email: user?.email,
      role: user?.user_metadata?.role
    });
  }, [user]);

  useEffect(() => {
    fetchProperties();
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (location.state && location.state.profileUpdated) {
      fetchProfile();
      // Clear the state so it doesn't refetch on every render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    if (location.state && location.state.leaseSigned) {
      setHasNewLease(false);
      // Clear the state so it doesn't refetch on every render
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  useEffect(() => {
    const handleFocus = () => {
      fetchProfile();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const handleProfileUpdated = (e: any) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };
    window.addEventListener('tenantProfileUpdated', handleProfileUpdated);
    return () => window.removeEventListener('tenantProfileUpdated', handleProfileUpdated);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const fetchViewings = async () => {
    if (!user) return;
    setLoadingViewings(true);
    try {
      // Fetch all requests for this tenant
      const res = await apiFetch(`${getApiBaseUrl()}/api/viewings/tenant?tenantId=${user.id}`);
      setViewings(res);
    } catch (err) {
      setViewings([]);
    } finally {
      setLoadingViewings(false);
    }
  };

  useEffect(() => {
    fetchViewings();
  }, [user]);

  useEffect(() => {
    // Fetch leases for the current tenant
    const fetchLeases = async () => {
      if (!user?.id) return;
      try {
        const response = await getLeasesForTenant(user.id);
        if (response.success && Array.isArray(response.data)) {
          const unsignedLease = response.data.find((lease: any) => lease.signed === false);
          if (unsignedLease) {
            setHasNewLease(true);
            setLeaseId(unsignedLease.id);
          } else {
            setHasNewLease(false);
            setLeaseId(null);
          }
        }
      } catch (err) {
        setHasNewLease(false);
        setLeaseId(null);
      }
    };
    fetchLeases();
  }, [user]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await apiFetch(`${getApiBaseUrl()}/api/listings`);
      if (response.success) {
        // Transform the API response to match our Property interface
        const transformedProperties = response.data.map((listing: any) => ({
          id: listing.id,
          title: listing.title,
          address: listing.address,
          city: listing.city,
          state: listing.state,
          zipCode: listing.zip_code,
          price: listing.price,
          type: listing.type.toLowerCase(),
          bedrooms: listing.bedrooms,
          bathrooms: listing.bathrooms,
          area: listing.area,
          images: parseMaybeJson(listing.images, []),
          description: listing.description,
          amenities: parseMaybeJson(listing.amenities, []),
          landlordId: listing.landlord_id,
          landlordName: listing.landlord_name,
          landlordPhone: listing.landlord_phone,
          coordinates: (() => {
            try {
              if (!listing.coordinates || listing.coordinates === 'null') return { lat: 0, lng: 0 };
              if (typeof listing.coordinates === 'string') {
                return JSON.parse(listing.coordinates);
              }
              return listing.coordinates;
            } catch (e) {
              console.warn('Failed to parse coordinates:', listing.coordinates, e);
              return { lat: 0, lng: 0 };
            }
          })(),
          available: listing.available,
          leaseType: listing.lease_type,
          requirements: parseMaybeJson(listing.requirements, []),
          houseRules: parseMaybeJson(listing.house_rules, []),
        }));
        setProperties(transformedProperties);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch properties. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast({
        title: "Error",
        description: "Failed to fetch properties. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await apiFetch(`${getApiBaseUrl()}/api/tenants/${user.id}`);
      if (response.success && response.data) {
        const data = response.data.data;
        setProfile({
          fullName: data.full_name || '',
          email: data.email || '',
          phone: data.phone || '',
          location: data.address || '',
          profilePhoto: data.image_url || '',
        });
      }
    } catch (err) {
      // Optionally show a toast or log error
    }
  };

  const filteredProperties = properties.filter(property => {
    const matchesSearch = property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         property.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = selectedType === 'all' || property.type === selectedType;

    let matchesPrice = true;
    if (priceRange === 'under-2000') matchesPrice = property.price < 2000;
    else if (priceRange === '2000-4000') matchesPrice = property.price >= 2000 && property.price <= 4000;
    else if (priceRange === 'over-4000') matchesPrice = property.price > 4000;

    return matchesSearch && matchesType && matchesPrice;
  });

  const handlePropertyClick = (propertyId: string) => {
    navigate(`/property/${propertyId}`);
  };

  // Filter requests: show all except 'Closed', but always show 'Approved' as reminders
  const approvedRequests = viewings.filter(v => v.status === 'Approved');
  const otherRequests = viewings.filter(v => v.status !== 'Closed' && v.status !== 'Approved');

  // Helper to format date safely
  const formatDateSafe = (dateString: string) => {
    if (!dateString) return 'Not set';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Not set' : d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Lease Notification Banner */}
      {hasNewLease && leaseId && (
        <div
          className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 cursor-pointer flex items-center justify-between"
          onClick={() => navigate(`/tenant/lease/${leaseId}`)}
        >
          <span>📄 You have a new lease to review and sign!</span>
          <button
            className="ml-4 text-yellow-700 underline text-sm"
            onClick={e => { e.stopPropagation(); setHasNewLease(false); }}
          >Dismiss</button>
        </div>
      )}
      {/* Enhanced Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Room<span className="text-yellow-500">zi</span>
              </h1>
              <Badge variant="secondary" className="ml-3 bg-blue-100 text-blue-700">Tenant</Badge>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/tenant/profile')}
                className="hover:bg-blue-50"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
        {/* Tenant Profile Info */}
        <Card className="p-6 mb-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt="Profile" className="w-20 h-20 object-cover" />
            ) : (
              <User className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">{profile.fullName || 'Your Name'}</h2>
            <div className="text-gray-600 text-sm">{profile.email}</div>
            <div className="text-gray-600 text-sm">{profile.phone}</div>
            <div className="text-gray-600 text-sm">{profile.location}</div>
          </div>
          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={() => navigate('/tenant/profile')}>
              <Settings className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </Card>

        {/* Enhanced Welcome Section */}
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">Find Your Perfect Home</h2>
          <p className="text-gray-600 text-lg">Discover amazing properties with our enhanced search and map view</p>
        </div>

        {/* Upcoming Payment Banner */}
        <UpcomingPaymentBanner amount={2500} dueDate="July 1, 2024" />

        {/* Viewing Requests Section */}
        <Card className="p-6 mb-6 shadow-lg bg-white/80 backdrop-blur-sm border-0">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 flex items-center">
            <CalendarIcon className="w-5 h-5 mr-2 text-blue-500" />
            Your Viewing Requests
          </h2>
          {loadingViewings ? (
            <div className="text-gray-500">Loading...</div>
          ) : viewings.length === 0 ? (
            <div className="text-gray-500">No viewing requests yet.</div>
          ) : (
            <div className="space-y-4">
              {/* Approved requests as reminders */}
              {approvedRequests.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-green-50">
                  <div>
                    <div className="font-medium">{v.listings?.title || 'Property'}</div>
                    <div className="text-sm text-gray-600">
                      Requested: {formatDateSafe(v.requestedDateTime)}
                    </div>
                    <div className="text-xs text-blue-700">
                      Proposed: {v.proposedDateTime ? formatDateSafe(v.proposedDateTime) : 'Not set'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700">Approved</span>
                  </div>
                </div>
              ))}
              {/* Other requests */}
              {otherRequests.map((v) => (
                <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border bg-gray-50">
                  <div>
                    <div className="font-medium">{v.listings?.title || 'Property'}</div>
                    <div className="text-sm text-gray-600">
                      Requested: {formatDateSafe(v.requestedDateTime)}
                    </div>
                    <div className="text-xs text-blue-700">
                      Proposed: {v.proposedDateTime ? formatDateSafe(v.proposedDateTime) : 'Not set'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {v.status === 'Pending' && <Clock className="w-4 h-4 text-yellow-500" />}
                    {v.status === 'Declined' && <XCircle className="w-4 h-4 text-red-500" />}
                    {v.status === 'Proposed' && <Clock className="w-4 h-4 text-blue-500" />}
                    <span className={`text-sm font-semibold ${v.status === 'Pending' ? 'text-yellow-600' : v.status === 'Declined' ? 'text-red-600' : v.status === 'Proposed' ? 'text-blue-700' : 'text-gray-500'}`}>{v.status}</span>
                  </div>
                  {v.status === 'Proposed' && (
                    <div className="flex gap-2">
                      <Button size="sm" onClick={async () => {
                        await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Approved' }) });
                        fetchViewings();
                      }}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Declined' }) });
                        fetchViewings();
                      }}>Decline</Button>
                    </div>
                  )}
                  {v.status !== 'Closed' && (
                    <Button size="sm" variant="outline" onClick={async () => {
                      await apiFetch(`${getApiBaseUrl()}/api/viewings/${v.id}`, { method: 'PATCH', body: JSON.stringify({ status: 'Closed' }) });
                      fetchViewings();
                    }}>Close Request</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Enhanced Search and Filters */}
        <Card className="p-6 mb-6 shadow-lg bg-white/80 backdrop-blur-sm border-0">
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by location, property name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[120px] hover:border-blue-300 transition-colors"
              >
                <option value="all">All Types</option>
                <option value="room">Room</option>
                <option value="apartment">Apartment</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
              </select>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[140px] hover:border-blue-300 transition-colors"
              >
                <option value="all">All Prices</option>
                <option value="under-2000">Under $2,000</option>
                <option value="2000-4000">$2,000 - $4,000</option>
                <option value="over-4000">Over $4,000</option>
              </select>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="flex items-center gap-2"
              >
                <Grid className="w-4 h-4" />
                Grid View
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="flex items-center gap-2"
              >
                <MapIcon className="w-4 h-4" />
                Map View
              </Button>
            </div>
            <p className="text-gray-600 text-sm">
              {filteredProperties.length} of {properties.length} properties
            </p>
          </div>
        </Card>

        {/* Content Area */}
        {viewMode === 'map' ? (
          <Card className="h-[70vh] overflow-hidden shadow-lg">
            <Map 
              properties={filteredProperties} 
              onPropertyClick={handlePropertyClick}
              mapboxToken={mapboxToken}
            />
            {!mapboxToken && (
              <div className="absolute bottom-4 right-4 z-10">
                <input
                  type="text"
                  placeholder="Enter Mapbox token..."
                  value={mapboxToken}
                  onChange={(e) => setMapboxToken(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md bg-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </Card>
        ) : loading ? (
          <div className="flex items-center justify-center h-[70vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading properties...</p>
            </div>
          </div>
        ) : filteredProperties.length > 0 ? (
          /* Enhanced Properties Grid */
          <div className="grid lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <Card 
                key={property.id} 
                className="overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] bg-white border-0 shadow-lg group"
                onClick={() => handlePropertyClick(property.id)}
              >
                <div className="aspect-[4/3] overflow-hidden relative">
                  <img
                    src={property.images[0]}
                    alt={property.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge variant="secondary" className="bg-white/90 text-gray-700 capitalize backdrop-blur-sm">
                      {property.type}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-1 group-hover:text-blue-600 transition-colors">
                    {property.title}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-3">
                    <MapPin className="w-4 h-4 mr-2 shrink-0 text-blue-500" />
                    <span className="text-sm line-clamp-1">{property.address}, {property.city}</span>
                  </div>

                  <div className="flex items-center text-gray-600 mb-4">
                    <Home className="w-4 h-4 mr-2 shrink-0 text-blue-500" />
                    <span className="text-sm">
                      {property.bedrooms} bed • {property.bathrooms} bath • {property.area} sq ft
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                      ${property.price.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">/month</span>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md hover:shadow-lg transition-all">
                      View Details
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-500 mb-4">
              <Home className="w-20 h-20 mx-auto mb-6 opacity-50" />
              <h3 className="text-xl font-medium mb-2">No properties found</h3>
              <p className="text-gray-400">Try adjusting your search criteria or filters</p>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 px-4 py-2 shadow-xl">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 text-blue-600 hover:bg-blue-50"
            onClick={() => navigate('/tenant')}
          >
            <Home className="w-5 h-5 mb-1" />
            <span className="text-xs font-medium">Browse</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 hover:bg-blue-50"
            onClick={() => navigate('/tenant/matches')}
          >
            <MessageCircle className="w-5 h-5 mb-1" />
            <span className="text-xs">Matches</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 hover:bg-blue-50"
            onClick={() => navigate('/tenant/my-house')}
          >
            <MapPin className="w-5 h-5 mb-1" />
            <span className="text-xs">My House</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex-col h-auto py-2 hover:bg-blue-50"
            onClick={() => navigate('/tenant/profile')}
          >
            <Settings className="w-5 h-5 mb-1" />
            <span className="text-xs">Profile</span>
          </Button>
        </div>
      </nav>
    </div>
  );
};

export default TenantDashboard;
