import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Camera, FileText, CreditCard, Settings, Home, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { landlordApi, ApiError, apiFetch, getApiBaseUrl } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';
import { supabase } from '@/lib/supabaseClient';

const TenantProfile = () => {
  const navigate = useNavigate();
  const { currentRole, setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);
  const [name, setName] = useState(user?.user_metadata?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.user_metadata?.phone || '');
  const [location, setLocation] = useState(user?.user_metadata?.location || '');
  const [saving, setSaving] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(user?.user_metadata?.profilePhoto || '');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.log('Switching to landlord role...');
      
      // Step 1: Create landlord profile if needed using centralized API
      const profileResult = await landlordApi.create(user.id, user.email || '');
      
      if (profileResult.success) {
        if (profileResult.alreadyExists) {
          console.log('✅ Landlord profile already exists - user can proceed');
        } else {
          console.log('✅ New landlord profile created successfully');
        }
      }
      
      // Step 2: Update Supabase metadata
      await updateUserMetadata('landlord');
      
      // Step 3: Update local role
      setUserRole('landlord');
      
      // Step 4: Show success and navigate
      toast({
        title: "Role Switched",
        description: "Welcome to your landlord dashboard!",
        variant: "default",
      });
      
      navigate('/landlord');
      
    } catch (error) {
      console.error('Error switching to landlord:', error);
      
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

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const response = await apiFetch(`${getApiBaseUrl()}/api/tenants/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          full_name: name,
          email,
          phone,
          address: location,
          image_url: profilePhoto,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.success) {
        toast({
          title: 'Profile Updated',
          description: 'Your changes have been saved.',
          variant: 'default',
        });
        // Dispatch a custom event for local dashboard update
        window.dispatchEvent(new CustomEvent('tenantProfileUpdated', {
          detail: {
            fullName: name,
            email,
            phone,
            location,
            profilePhoto,
          }
        }));
        navigate('/tenant', { state: { profileUpdated: true } });
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Could not update profile.',
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
      const filePath = `profile-photos/${fileName}`;
      // Show preview immediately
      const localPreview = URL.createObjectURL(file);
      setProfilePhoto(localPreview);
      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;
      // Get public URL
      const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
      if (!data?.publicUrl) throw new Error('Failed to get public URL');
      setProfilePhoto(data.publicUrl); // Update to public URL after upload
      // Update user metadata/profile with new photo URL
      const response = await apiFetch(`/api/tenant/update-profile`, {
        method: 'POST',
        body: JSON.stringify({
          id: user.id,
          profilePhoto: data.publicUrl,
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.success) throw new Error(response.message || 'Failed to update profile photo');
      toast({
        title: 'Profile Photo Updated',
        description: 'Your new photo has been saved.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Photo Upload Failed',
        description: error.message || 'Could not upload photo.',
        variant: 'destructive',
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
    { id: 'credit', label: 'Credit Score', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

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
        <Card className="p-6 mb-6 flex items-center space-x-6">
          <div className="relative">
            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {profilePhoto ? (
                <img src={profilePhoto} alt="Profile" className="w-24 h-24 object-cover" />
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
            <h2 className="text-2xl font-bold text-gray-900">{name || 'Your Name'}</h2>
            <div className="text-gray-600">{email}</div>
            <div className="text-gray-600">{phone}</div>
            <div className="text-gray-600">{location}</div>
            <Badge className="mt-2 bg-green-100 text-green-800">Verified</Badge>
          </div>
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
            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input value={location} onChange={e => setLocation(e.target.value)} />
              </div>
            </div>
            <Button className="mt-4 roomzi-gradient" onClick={handleSaveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Card>
        )}

        {activeTab === 'docs' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Verification Documents</h3>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload Identity Proof</p>
                <Button variant="outline">Choose File</Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload Employment Letter / Enrollment Letter</p>
                <Button variant="outline">Choose File</Button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 mb-2">Upload Rental History</p>
                <Button variant="outline">Choose File</Button>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'credit' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Credit Score</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Upload Credit Score Report</p>
              <Button variant="outline">Choose File</Button>
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
                  <p className="text-sm text-gray-600">Receive updates about matches and messages</p>
                </div>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Privacy Settings</h4>
                  <p className="text-sm text-gray-600">Control who can see your profile</p>
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

export default TenantProfile;
