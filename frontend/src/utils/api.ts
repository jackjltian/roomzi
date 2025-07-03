// API Base Configuration
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

// Types
export interface ProfileData {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  image_url?: string | null;
  address?: string | null;
}

export interface LandlordProfileData extends ProfileData {
  documents?: string[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  alreadyExists?: boolean;
}

// Generic API error handling
class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Generic fetch wrapper with error handling
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(data.message || 'API request failed', response.status, data);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Handle network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ApiError('Network error: Unable to connect to server. Please check your connection.', 0);
    }
    
    throw new ApiError('Unexpected error occurred', 500);
  }
};

// Profile creation helper
const createProfileData = (userId: string, email: string): ProfileData => {
  return {
    id: userId,
    full_name: email.split('@')[0], // Use email prefix as default name
    email: email,
    phone: null,
    image_url: null,
    address: null,
  };
};

// Profile creation helper for landlords
const createLandlordProfileData = (userId: string, email: string): LandlordProfileData => {
  return {
    id: userId,
    full_name: email.split('@')[0], // Use email prefix as default name
    email: email,
    phone: null,
    image_url: null,
    address: null,
    documents: [], // Only landlords have documents
  };
};

// Profile synchronization utility functions
export const profileSyncUtils = {
  /**
   * Get profile data from the opposite role to inherit common fields
   */
  getOppositeProfileData: async (userId: string, currentRole: 'tenant' | 'landlord'): Promise<Partial<ProfileData> | null> => {
    try {
      const oppositeRole = currentRole === 'tenant' ? 'landlord' : 'tenant';
      const result = await profileUtils.getForRole(oppositeRole, userId);
      
      if (result.success && result.data?.data) {
        const oppositeProfile = result.data.data;
        // Return only common fields
        return {
          full_name: oppositeProfile.full_name,
          phone: oppositeProfile.phone,
          image_url: oppositeProfile.image_url,
          address: oppositeProfile.address,
        };
      }
    } catch (error) {
      console.log('No opposite profile found or error fetching:', error);
    }
    return null;
  },

  /**
   * Sync profile data between tenant and landlord profiles
   */
  syncProfiles: async (userId: string, updatedRole: 'tenant' | 'landlord', updatedData: Partial<ProfileData>): Promise<void> => {
    try {
      const oppositeRole = updatedRole === 'tenant' ? 'landlord' : 'tenant';
      
      // Get the opposite profile to check if it exists
      const oppositeResult = await profileUtils.getForRole(oppositeRole, userId);
      
      if (oppositeResult.success && oppositeResult.data?.data) {
        // Update the opposite profile with the new common field data
        const commonFields = {
          full_name: updatedData.full_name,
          phone: updatedData.phone,
          image_url: updatedData.image_url,
          address: updatedData.address,
        };

        // Remove undefined values
        const fieldsToUpdate = Object.fromEntries(
          Object.entries(commonFields).filter(([_, value]) => value !== undefined)
        );

                 if (Object.keys(fieldsToUpdate).length > 0) {
           if (oppositeRole === 'tenant') {
             await tenantApi.update(userId, fieldsToUpdate, true); // Skip sync to avoid infinite loop
           } else {
             await landlordApi.update(userId, fieldsToUpdate, true); // Skip sync to avoid infinite loop
           }
           console.log(`✅ Synced profile data to ${oppositeRole} profile`);
         }
      }
    } catch (error) {
      console.warn('Failed to sync profiles:', error);
      // Don't throw - sync failure shouldn't break the main update
    }
  },
};

// Tenant API Functions
export const tenantApi = {
  /**
   * Create a new tenant profile
   */
  create: async (userId: string, email: string): Promise<ApiResponse> => {
    try {
      // Try to get data from landlord profile to inherit common fields
      const landlordData = await profileSyncUtils.getOppositeProfileData(userId, 'tenant');
      
      const profileData = createProfileData(userId, email);
      
      // Inherit data from landlord profile if available
      if (landlordData) {
        Object.assign(profileData, {
          full_name: landlordData.full_name || profileData.full_name,
          phone: landlordData.phone || profileData.phone,
          image_url: landlordData.image_url || profileData.image_url,
          address: landlordData.address || profileData.address,
        });
        console.log('✅ Inherited profile data from landlord profile');
      }
      
      const url = `${getApiBaseUrl()}/api/tenants`;
      
      console.log('Creating tenant profile:', { userId, email });
      
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      console.log('Tenant profile created successfully:', response);
      return { success: true, data: response };
      
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle existing profile cases
        if (error.status === 400 && error.data?.message?.includes('already exists')) {
          console.log('Tenant profile already exists - this is fine');
          return { success: true, alreadyExists: true };
        }
        if (error.status === 409) {
          console.log('Tenant profile already exists (409) - this is fine');
          return { success: true, alreadyExists: true };
        }
      }
      
      console.error('Error creating tenant profile:', error);
      throw error;
    }
  },

  /**
   * Get tenant profile by ID
   */
  getById: async (tenantId: string): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/tenants/${tenantId}`;
      const response = await apiFetch(url);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching tenant profile:', error);
      throw error;
    }
  },

  /**
   * Update tenant profile
   */
  update: async (tenantId: string, profileData: Partial<ProfileData>, skipSync = false): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/tenants/${tenantId}`;
      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Sync the updated data to landlord profile (only if not already syncing)
      if (!skipSync) {
        await profileSyncUtils.syncProfiles(tenantId, 'tenant', profileData);
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      throw error;
    }
  },
};

// Landlord API Functions
export const landlordApi = {
  /**
   * Create a new landlord profile
   */
  create: async (userId: string, email: string): Promise<ApiResponse> => {
    try {
      // Try to get data from tenant profile to inherit common fields
      const tenantData = await profileSyncUtils.getOppositeProfileData(userId, 'landlord');
      
      const profileData = createLandlordProfileData(userId, email);
      
      // Inherit data from tenant profile if available
      if (tenantData) {
        Object.assign(profileData, {
          full_name: tenantData.full_name || profileData.full_name,
          phone: tenantData.phone || profileData.phone,
          image_url: tenantData.image_url || profileData.image_url,
          address: tenantData.address || profileData.address,
        });
        console.log('✅ Inherited profile data from tenant profile');
      }
      
      const url = `${getApiBaseUrl()}/api/landlords`;
      
      console.log('Creating landlord profile:', { userId, email });
      
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      console.log('Landlord profile created successfully:', response);
      return { success: true, data: response };
      
    } catch (error) {
      if (error instanceof ApiError) {
        // Handle existing profile cases
        if (error.status === 400 && error.data?.message?.includes('already exists')) {
          console.log('Landlord profile already exists - this is fine');
          return { success: true, alreadyExists: true };
        }
        if (error.status === 409) {
          console.log('Landlord profile already exists (409) - this is fine');
          return { success: true, alreadyExists: true };
        }
      }
      
      console.error('Error creating landlord profile:', error);
      throw error;
    }
  },

  /**
   * Get landlord profile by ID
   */
  getById: async (landlordId: string): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/landlords/${landlordId}`;
      const response = await apiFetch(url);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching landlord profile:', error);
      throw error;
    }
  },

  /**
   * Update landlord profile
   */
  update: async (landlordId: string, profileData: Partial<LandlordProfileData>, skipSync = false): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/landlords/${landlordId}`;
      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });

      // Sync the updated data to tenant profile (only if not already syncing)
      if (!skipSync) {
        const { documents, ...commonFields } = profileData;
        await profileSyncUtils.syncProfiles(landlordId, 'landlord', commonFields);
      }

      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating landlord profile:', error);
      throw error;
    }
  },

  /**
   * Get landlord's listings
   */
  getListings: async (landlordId: string): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/landlords/${landlordId}/listings`;
      const response = await apiFetch(url);
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching landlord listings:', error);
      throw error;
    }
  },
};

// Profile utility functions
export const profileUtils = {
  /**
   * Create profile for specified role
   */
  createForRole: async (role: 'tenant' | 'landlord', userId: string, email: string): Promise<ApiResponse> => {
    if (role === 'tenant') {
      return tenantApi.create(userId, email);
    } else if (role === 'landlord') {
      return landlordApi.create(userId, email);
    } else {
      throw new Error(`Invalid role: ${role}`);
    }
  },

  /**
   * Get profile for specified role
   */
  getForRole: async (role: 'tenant' | 'landlord', userId: string): Promise<ApiResponse> => {
    if (role === 'tenant') {
      return tenantApi.getById(userId);
    } else if (role === 'landlord') {
      return landlordApi.getById(userId);
    } else {
      throw new Error(`Invalid role: ${role}`);
    }
  },
};

// Health check
export const healthApi = {
  check: async (): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/health`;
      const response = await apiFetch(url);
      return { success: true, data: response };
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  },
};

// Image upload utility functions
export const imageUtils = {
  /**
   * Upload profile image to Supabase storage
   */
  uploadProfileImage: async (file: File, userId: string): Promise<string> => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file.');
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Please upload an image smaller than 5MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    const filePath = `profile-images/${fileName}`;

    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw new Error("Failed to check storage buckets");
    }

    // Check if profile-images bucket exists
    const profileBucket = buckets.find(b => b.name === 'profile-images');
    if (!profileBucket) {
      // Create the bucket if it doesn't exist
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('profile-images', {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880 // 5MB
        });
      
      if (createBucketError) {
        console.error('Error creating profile-images bucket:', createBucketError);
        throw new Error("Failed to create storage bucket for profile images");
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Delete profile image from Supabase storage
   */
  deleteProfileImage: async (imageUrl: string): Promise<void> => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Extract file path from URL
    const urlParts = imageUrl.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'profile-images');
    if (bucketIndex === -1) return;
    
    const filePath = urlParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('profile-images')
      .remove([`profile-images/${filePath}`]);

    if (error) {
      console.error('Error deleting image:', error);
      // Don't throw error as this is not critical
    }
  }
};

// Document upload utility functions
export const documentUtils = {
  /**
   * Upload document to Supabase storage
   */
  uploadDocument: async (file: File, userId: string, documentType: string): Promise<string> => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    // Validate file type (allow common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Please upload a PDF, image, or Word document.');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Please upload a document smaller than 10MB.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}_${documentType}_${Date.now()}.${fileExt}`;
    const filePath = `documents/${fileName}`;

    // Check if buckets exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      throw new Error("Failed to check storage buckets");
    }

    // Check if documents bucket exists
    const documentsBucket = buckets.find(b => b.name === 'documents');
    if (!documentsBucket) {
      // Create the bucket if it doesn't exist
      const { error: createBucketError } = await supabase
        .storage
        .createBucket('documents', {
          public: false, // Documents should be private
          allowedMimeTypes: allowedTypes,
          fileSizeLimit: 10485760 // 10MB
        });
      
      if (createBucketError) {
        console.error('Error creating documents bucket:', createBucketError);
        throw new Error("Failed to create storage bucket for documents");
      }
    }

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      throw uploadError;
    }

    // Return the file path (not public URL since it's private)
    return filePath;
  },

  /**
   * Get signed URL for document viewing
   */
  getDocumentUrl: async (filePath: string): Promise<string> => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    const { data, error } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) {
      throw error;
    }

    return data.signedUrl;
  },

  /**
   * Delete document from Supabase storage
   */
  deleteDocument: async (filePath: string): Promise<void> => {
    const { supabase } = await import('@/lib/supabaseClient');
    
    const { error } = await supabase.storage
      .from('documents')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  },

  /**
   * Extract document type and filename from file path
   */
  parseDocumentPath: (filePath: string) => {
    const fileName = filePath.split('/').pop() || '';
    const parts = fileName.split('_');
    if (parts.length >= 3) {
      const documentType = parts[1];
      const originalName = parts.slice(2).join('_');
      return { documentType, originalName };
    }
    return { documentType: 'unknown', originalName: fileName };
  }
};

export { ApiError };