import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, User, Camera, FileText, Settings, UserCheck, Loader2 } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tenantApi, ApiError } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';

const LandlordProfile = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [switching, setSwitching] = useState(false);

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

  const tabs = [
    { id: 'info', label: 'Personal Info', icon: User },
    { id: 'docs', label: 'Documents', icon: FileText },
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
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-12 h-12 text-gray-500" />
              </div>
              <Button
                size="sm"
                className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
              >
                <Camera className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">Sarah Johnson</h2>
              <p className="text-gray-600">sarah.johnson@email.com</p>
              <p className="text-gray-600">+1 (555) 123-4567</p>
              <Badge className="mt-2 bg-green-100 text-green-800">Verified Landlord</Badge>
            </div>
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
                <Input defaultValue="Sarah Johnson" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input defaultValue="sarah.johnson@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input defaultValue="+1 (555) 123-4567" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <Input defaultValue="New York, NY" />
              </div>
            </div>
            <Button className="mt-4 roomzi-gradient">Save Changes</Button>
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
                <p className="text-gray-600 mb-2">Upload Property Ownership Documents</p>
                <Button variant="outline">Choose File</Button>
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
