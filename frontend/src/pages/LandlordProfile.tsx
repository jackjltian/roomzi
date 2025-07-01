import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Camera, FileText, Settings, UserCheck, Loader2, Upload, Save, X } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tenantApi, landlordApi, ApiError, imageUtils } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';

interface LandlordProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
}

const LandlordProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [profileData, setProfileData] = useState<LandlordProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });

  // Fetch landlord profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await landlordApi.getById(user.id);
        
        if (result.success && result.data) {
          setProfileData(result.data.data);
          setFormData({
            full_name: result.data.data.full_name || '',
            email: result.data.data.email || '',
            phone: result.data.data.phone || '',
            address: result.data.data.address || '',
          });
        } else {
          // Profile doesn't exist, create a basic one
          const createResult = await landlordApi.create(user.id, user.email || '');
          if (createResult.success && createResult.data) {
            setProfileData(createResult.data.data);
            setFormData({
              full_name: user.user_metadata?.full_name || '',
              email: user.email || '',
              phone: '',
              address: '',
            });
            setEditMode(true); // Automatically enter edit mode for new profiles
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, toast]);

  const handleSwitchToTenant = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in first.",
        variant: "destructive",
      });
      return;
    }

    setSwitching(true);
    
    try {
      console.log('Switching to tenant role...');
      
      // Step 1: Create tenant profile if needed using centralized API
      const profileResult = await tenantApi.create(user.id, user.email || '');
      
      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Tenant profile already exists - user can proceed');
        } else {
          console.log('✅ New tenant profile created successfully');
        }
      }
      
      // Step 2: Update Supabase metadata
      await updateUserMetadata('tenant');
      
      // Step 3: Update local role
      setUserRole('tenant');
      
      // Step 4: Show success and navigate
      toast({
        title: "Role Switched",
        description: "Welcome to your tenant dashboard!",
        variant: "default",
      });
      
      navigate('/tenant');
      
    } catch (error) {
      console.error('Error switching to tenant:', error);
      
      let errorMessage = "Unable to switch to tenant role. Please try again.";
      
      if (error instanceof ApiError) {
        if (error.status === 0) {
          errorMessage = "Unable to connect to server. Please check your internet connection.";
        } else {
          errorMessage = error.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Switch Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingImage(true);
    
    try {
      // Upload image using utility function
      const imageUrl = await imageUtils.uploadProfileImage(file, user.id);

      // Update profile with new image URL
      const updateResult = await landlordApi.update(user.id, {
        image_url: imageUrl
      });

      if (updateResult.success) {
        setProfileData(prev => prev ? {
          ...prev,
          image_url: imageUrl
        } : null);
        
        toast({
          title: "Success",
          description: "Profile picture updated successfully!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload profile picture. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    setSaving(true);
    
    try {
      const updateResult = await landlordApi.update(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
      });

      if (updateResult.success) {
        setProfileData(prev => prev ? {
          ...prev,
          ...formData,
          phone: formData.phone || null,
          address: formData.address || null,
        } : null);
        
        setEditMode(false);
        
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save profile changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (profileData) {
      setFormData({
        full_name: profileData.full_name || '',
        email: profileData.email || '',
        phone: profileData.phone || '',
        address: profileData.address || '',
      });
    }
    setEditMode(false);
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-roomzi-blue" />
          <p className="text-gray-600">Loading profile...</p>
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
              <h1 className="text-2xl font-bold text-roomzi-blue">Profile</h1>
            </div>
            <Badge className="bg-green-100 text-green-800">Landlord</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage 
                  src={profileData?.image_url || undefined} 
                  alt={profileData?.full_name || 'Profile'}
                />
                <AvatarFallback className="bg-gray-200 text-gray-500 text-xl">
                  {profileData?.full_name ? profileData.full_name.split(' ').map(n => n[0]).join('').toUpperCase() : <User className="w-12 h-12" />}
                </AvatarFallback>
              </Avatar>
              <label htmlFor="profile-image-upload">
                <Button
                  size="sm"
                  className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                  disabled={uploadingImage}
                  asChild
                >
                  <span>
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </span>
                </Button>
              </label>
              <input
                id="profile-image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData?.full_name || 'Landlord'}
              </h2>
              <p className="text-gray-600">{profileData?.email}</p>
              {profileData?.phone && (
                <p className="text-gray-600">{profileData.phone}</p>
              )}
              {profileData?.address && (
                <p className="text-gray-600">{profileData.address}</p>
              )}
              <Badge className="mt-2 bg-green-100 text-green-800">Verified Landlord</Badge>
            </div>
            <div className="flex gap-2">
              {!editMode && (
                <Button
                  onClick={() => setEditMode(true)}
                  variant="outline"
                  className="flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              )}
              <Button
                onClick={handleSwitchToTenant}
                variant="outline"
                className="flex items-center"
                disabled={switching}
              >
                {switching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4 mr-2" />
                )}
                {switching ? 'Switching...' : 'Switch to Tenant'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-roomzi-blue shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              {editMode && (
                <div className="flex gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    variant="outline"
                    size="sm"
                    className="flex items-center"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    size="sm"
                    className="flex items-center roomzi-gradient"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!editMode}
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={!editMode}
                  type="email"
                  placeholder="Enter your email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode}
                  type="tel"
                  placeholder="Enter your phone number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <Input
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editMode}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            {!editMode && (
              <Button 
                className="mt-4 roomzi-gradient"
                onClick={() => setEditMode(true)}
              >
                Edit Information
              </Button>
            )}
          </Card>
        )}

        {activeTab === 'docs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload Identity Proof</p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload Property Ownership Documents</p>
                <Button variant="outline">
                  <Upload className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Email Notifications</h4>
                  <p className="text-sm text-gray-600">Receive updates about inquiries and bookings</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Property Visibility</h4>
                  <p className="text-sm text-gray-600">Control who can see your listings</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Account Settings</h4>
                  <p className="text-sm text-gray-600">Change password and security settings</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LandlordProfile;
