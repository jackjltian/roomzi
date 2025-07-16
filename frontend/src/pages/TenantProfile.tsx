import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Camera, FileText, CreditCard, Settings, Home, Loader2, Save, X } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { landlordApi, ApiError, apiFetch, getApiBaseUrl, tenantApi } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';
import { supabase } from '@/lib/supabaseClient';

interface TenantProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
  created_at?: string;
  updated_at?: string;
  documents?: string[];
}

const TenantProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);

  const [name, setName] = useState(user?.user_metadata?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [location, setLocation] = useState(user?.user_metadata?.location || '');
  const [saving, setSaving] = useState(false);
  // Removed duplicate saving here

  const [profilePhoto, setProfilePhoto] = useState(user?.user_metadata?.profilePhoto || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<TenantProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await tenantApi.getById(user.id);

        if (result.success && result.data) {
          setProfileData(result.data.data);
          setFormData({
            full_name: result.data.data.full_name || '',
            email: result.data.data.email || '',
            phone: result.data.data.phone || '',
            address: result.data.data.address || '',
          });
          setDocuments(result.data.data.documents || []);
        } else {
          // Create profile if not found
          const createResult = await tenantApi.create(user.id, user.email || '');
          if (createResult.success && createResult.data) {
            setProfileData(createResult.data.data);
            setFormData({
              full_name: user.user_metadata?.full_name || '',
              email: user.email || '',
              phone: '',
              address: '',
            });
            setDocuments([]);
            setEditMode(true);
          }
        }
      } catch (error) {
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

  const handleSwitchToLandlord = async () => {
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
      const profileResult = await landlordApi.create(user.id, user.email || '');

      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Landlord profile already exists - user can proceed');
        } else {
          console.log('✅ New landlord profile created successfully');
        }
      }

      await updateUserMetadata('landlord');
      setUserRole('landlord');

      toast({
        title: "Role Switched",
        description: "Welcome to your landlord dashboard!",
        variant: "default",
      });

      navigate('/landlord');
      window.location.reload();
    } catch (error) {
      let errorMessage = "Unable to switch to landlord role. Please try again.";

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

  const handleSaveChanges = async () => {
    if (!user?.id) return;

    setSaving(true);

    try {
      const updateResult = await tenantApi.update(user.id, {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone || null,
        address: formData.address || null,
        image_url: profilePhoto,
        documents,
      });

      if (updateResult.success) {
        // Always fetch the latest profile data after update
        const refreshed = await tenantApi.getById(user.id);
        if (refreshed.success && refreshed.data) {
          setProfileData(refreshed.data.data);
          setFormData({
            full_name: refreshed.data.data.full_name || '',
            email: refreshed.data.data.email || '',
            phone: refreshed.data.data.phone || '',
            address: refreshed.data.data.address || '',
          });
          setDocuments(refreshed.data.data.documents || []);
        }
        setEditMode(false);
        window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
          detail: {
            fullName: formData.full_name,
            email: formData.email,
            phone: formData.phone || null,
            address: formData.address || null,
            profilePhoto,
          }
        }));
        navigate('/tenant', { state: { profileUpdated: true } });
        toast({
          title: "Success",
          description: "Profile updated successfully!",
          variant: "default",
        });
      } else {
        throw new Error(updateResult.message || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: (error as Error)?.message || 'Failed to save profile changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCameraButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleProfilePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${fileName}`; // use profile-images bucket
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-images') // use profile-images bucket
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data } = supabase.storage.from('profile-images').getPublicUrl(filePath); // use profile-images bucket
      if (!data?.publicUrl) throw new Error('Failed to get public URL');
      // Update user metadata/profile with new photo URL
      await tenantApi.update(user.id, { image_url: data.publicUrl });
      // Always fetch the latest profile data after update
      const refreshed = await tenantApi.getById(user.id);
      if (refreshed.success && refreshed.data) {
        setProfileData(refreshed.data.data);
      }
      toast({
        title: 'Profile Photo Updated',
        description: 'Your new photo has been saved.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Photo Upload Failed',
        description: (error as Error)?.message || 'Could not upload photo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
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

  // Document upload handler for tenant (mirrors landlord)
  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    try {
      const documentPath = await documentUtils.uploadDocument(file, user.id, documentType);
      const newDocuments = [...documents, documentPath];
      setDocuments(newDocuments);
      // Optionally, update profile immediately
      await tenantApi.update(user.id, { documents: newDocuments });
      toast({
        title: "Success",
        description: `${documentType.replace('-', ' ')} document uploaded successfully!`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: (error as Error)?.message || "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    } finally {
      event.target.value = '';
    }
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'credit', label: 'Credit Score', icon: CreditCard },
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
                onClick={() => navigate('/tenant')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Profile</h1>
            </div>
            <Badge variant="secondary">Tenant</Badge>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="p-6 mb-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                {profileData?.image_url ? (
                  <img src={profileData.image_url} alt="Profile" className="w-24 h-24 object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-500" />
                )}
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                onClick={handleCameraButtonClick}
                disabled={uploadingPhoto}
                aria-label="Change profile photo"
              >
                {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleProfilePhotoChange}
              />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {profileData?.full_name || 'Tenant'}
              </h2>
              <p className="text-gray-600">{profileData?.email}</p>
              {profileData?.phone && (
                <p className="text-gray-600">{profileData.phone}</p>
              )}
              {profileData?.address && (
                <p className="text-gray-600">{profileData.address}</p>
              )}
              <Badge className="mt-2 bg-green-100 text-green-800">Verified</Badge>
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
                onClick={handleSwitchToLandlord}
                variant="outline"
                className="flex items-center"
                disabled={switching}
              >
                {switching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Home className="w-4 h-4 mr-2" />
                )}
                {switching ? 'Switching...' : 'Switch to Landlord'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabs */}
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
                    onClick={handleSaveChanges}
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
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input 
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  disabled={!editMode}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input 
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={!editMode}
                />
              </div>
            </div>
          </Card>
        )}
        {/* TODO: add content for other tabs */}
      </div>
    </div>
  );
};

export default TenantProfile;
