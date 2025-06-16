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

// Tenant API Functions
export const tenantApi = {
  /**
   * Create a new tenant profile
   */
  create: async (userId: string, email: string): Promise<ApiResponse> => {
    try {
      const profileData = createProfileData(userId, email);
      const url = `${getApiBaseUrl()}/api/tenants`;
      
      console.log('Creating tenant profile:', { userId, email });
      
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      console.log('Tenant profile created/updated successfully:', response);
      return { success: true, data: response };
      
    } catch (error) {
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
  update: async (tenantId: string, profileData: Partial<ProfileData>): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/tenants/${tenantId}`;
      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
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
      const profileData = createProfileData(userId, email);
      const url = `${getApiBaseUrl()}/api/landlords`;
      
      console.log('Creating landlord profile:', { userId, email });
      
      const response = await apiFetch(url, {
        method: 'POST',
        body: JSON.stringify(profileData),
      });

      console.log('✅ Landlord profile created/updated successfully:', response);
      return { success: true, data: response };
      
    } catch (error) {
      console.error('❌ Error creating landlord profile:', error);
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
  update: async (landlordId: string, profileData: Partial<ProfileData>): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/landlords/${landlordId}`;
      const response = await apiFetch(url, {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
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

export { ApiError };