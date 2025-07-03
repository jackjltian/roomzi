import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, User, Camera, FileText, Settings, UserCheck, Loader2, Upload, Save, X, Download, Trash2, Plus } from 'lucide-react';
import { useUserRole } from '@/hooks/useUserRole';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { tenantApi, landlordApi, ApiError, imageUtils, documentUtils } from '@/utils/api';
import { updateUserMetadata } from '@/utils/auth';

interface LandlordProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
  documents?: string[];
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
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [profileData, setProfileData] = useState<LandlordProfileData | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);

  // Fetch landlord profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.id) return;

      try {
        setLoading(true);
        const result = await landlordApi.getById(user.id);
        
        if (result.success && result.data) {
          setProfileData(result.data.data);
          setDocuments(result.data.data.documents || []);
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
            setDocuments(createResult.data.data.documents || []);
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

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;

    setUploadingDocument(true);
    
    try {
      // Upload document using utility function
      const documentPath = await documentUtils.uploadDocument(file, user.id, documentType);

      // Update profile with new document
      const newDocuments = [...documents, documentPath];
      const updateResult = await landlordApi.update(user.id, {
        documents: newDocuments
      });

      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? {
          ...prev,
          documents: newDocuments
        } : null);
        
        toast({
          title: "Success",
          description: `${documentType.replace('-', ' ')} document uploaded successfully!`,
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to upload document. Please try again.";
      toast({
        title: "Upload Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploadingDocument(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleDocumentDelete = async (documentPath: string) => {
    if (!user?.id) return;

    try {
      // Delete from storage
      await documentUtils.deleteDocument(documentPath);

      // Update profile
      const newDocuments = documents.filter(doc => doc !== documentPath);
      const updateResult = await landlordApi.update(user.id, {
        documents: newDocuments
      });

      if (updateResult.success) {
        setDocuments(newDocuments);
        setProfileData(prev => prev ? {
          ...prev,
          documents: newDocuments
        } : null);
        
        toast({
          title: "Success",
          description: "Document deleted successfully!",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to delete document. Please try again.";
      toast({
        title: "Delete Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleDocumentView = async (documentPath: string) => {
    try {
      const signedUrl = await documentUtils.getDocumentUrl(documentPath);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "View Failed",
        description: "Failed to open document. Please try again.",
        variant: "destructive",
      });
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Verification Documents</h3>
              <Badge variant="outline" className="text-sm">
                {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
              </Badge>
            </div>
            
            {/* Document Upload Sections */}
            <div className="space-y-6">
              {/* Identity Proof Section */}
              <div>
                <h4 className="text-md font-medium mb-3 text-gray-900">Identity Proof</h4>
                <div className="space-y-3">
                  {documents.filter(doc => documentUtils.parseDocumentPath(doc).documentType === 'identity').map((doc, index) => {
                    const { originalName } = documentUtils.parseDocumentPath(doc);
                    return (
                      <div key={index} className="document-item">
                        <div className="document-item-info">
                          <FileText className="w-5 h-5 text-blue-600" />
                          <span className="document-item-name">{originalName}</span>
                        </div>
                        <div className="document-actions">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentView(doc)}
                            className="p-2"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentDelete(doc)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="document-upload-zone">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3 text-sm">
                      Upload government-issued ID (Driver's License, Passport, etc.)
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentUpload(e, 'identity')}
                      className="hidden"
                      id="identity-upload"
                      disabled={uploadingDocument}
                    />
                    <label htmlFor="identity-upload">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploadingDocument}
                        asChild
                      >
                        <span>
                          {uploadingDocument ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {uploadingDocument ? 'Uploading...' : 'Add Identity Document'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Property Ownership Section */}
              <div>
                <h4 className="text-md font-medium mb-3 text-gray-900">Property Ownership</h4>
                <div className="space-y-3">
                  {documents.filter(doc => documentUtils.parseDocumentPath(doc).documentType === 'property').map((doc, index) => {
                    const { originalName } = documentUtils.parseDocumentPath(doc);
                    return (
                      <div key={index} className="document-item">
                        <div className="document-item-info">
                          <FileText className="w-5 h-5 text-green-600" />
                          <span className="document-item-name">{originalName}</span>
                        </div>
                        <div className="document-actions">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentView(doc)}
                            className="p-2"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentDelete(doc)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="document-upload-zone">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3 text-sm">
                      Upload property deeds, ownership certificates, or rental agreements
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentUpload(e, 'property')}
                      className="hidden"
                      id="property-upload"
                      disabled={uploadingDocument}
                    />
                    <label htmlFor="property-upload">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploadingDocument}
                        asChild
                      >
                        <span>
                          {uploadingDocument ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {uploadingDocument ? 'Uploading...' : 'Add Property Document'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>

              {/* Other Documents Section */}
              <div>
                <h4 className="text-md font-medium mb-3 text-gray-900">Other Documents</h4>
                <div className="space-y-3">
                  {documents.filter(doc => {
                    const type = documentUtils.parseDocumentPath(doc).documentType;
                    return type !== 'identity' && type !== 'property';
                  }).map((doc, index) => {
                    const { originalName, documentType } = documentUtils.parseDocumentPath(doc);
                    return (
                      <div key={index} className="document-item">
                        <div className="document-item-info">
                          <FileText className="w-5 h-5 text-purple-600" />
                          <div>
                            <span className="document-item-name block">{originalName}</span>
                            <span className="document-item-type">{documentType.replace('-', ' ')}</span>
                          </div>
                        </div>
                        <div className="document-actions">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentView(doc)}
                            className="p-2"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDocumentDelete(doc)}
                            className="p-2 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div className="document-upload-zone">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600 mb-3 text-sm">
                      Upload insurance documents, certificates, or other relevant files
                    </p>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={(e) => handleDocumentUpload(e, 'other')}
                      className="hidden"
                      id="other-upload"
                      disabled={uploadingDocument}
                    />
                    <label htmlFor="other-upload">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={uploadingDocument}
                        asChild
                      >
                        <span>
                          {uploadingDocument ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4 mr-2" />
                          )}
                          {uploadingDocument ? 'Uploading...' : 'Add Other Document'}
                        </span>
                      </Button>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Help Text */}
            <div className="document-upload-guidelines">
              <h5 className="text-sm font-medium text-blue-900 mb-2">Document Guidelines</h5>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Accepted formats: PDF, JPG, PNG, DOC, DOCX</li>
                <li>• Maximum file size: 10MB per document</li>
                <li>• Documents are stored securely and encrypted</li>
                <li>• Upload clear, readable copies for faster verification</li>
              </ul>
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
