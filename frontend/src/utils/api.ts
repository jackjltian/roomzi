// API Base Configuration
export const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  maxRequests: 10,
  timeWindow: 60000, // 1 minute
  backoffMultiplier: 2,
  maxBackoff: 30000, // 30 seconds
};

// Request tracking
const requestTracker = {
  requests: [] as number[],
  lastBackoff: 0,
};

// Clean old requests
const cleanOldRequests = () => {
  const now = Date.now();
  requestTracker.requests = requestTracker.requests.filter(
    time => now - time < RATE_LIMIT_CONFIG.timeWindow
  );
};

// Check if we're rate limited
const isRateLimited = () => {
  cleanOldRequests();
  return requestTracker.requests.length >= RATE_LIMIT_CONFIG.maxRequests;
};

// Calculate backoff delay
const getBackoffDelay = () => {
  if (requestTracker.lastBackoff === 0) {
    requestTracker.lastBackoff = 1000; // Start with 1 second
  } else {
    requestTracker.lastBackoff = Math.min(
      requestTracker.lastBackoff * RATE_LIMIT_CONFIG.backoffMultiplier,
      RATE_LIMIT_CONFIG.maxBackoff
    );
  }
  return requestTracker.lastBackoff;
};

// Reset backoff on successful request
const resetBackoff = () => {
  requestTracker.lastBackoff = 0;
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

// Generic fetch wrapper with error handling and rate limiting
export const apiFetch = async (url: string, options: RequestInit = {}): Promise<any> => {
  // Check rate limiting
  if (isRateLimited()) {
    const delay = getBackoffDelay();
    console.warn(`Rate limited. Waiting ${delay}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  try {
    // Track this request
    requestTracker.requests.push(Date.now());

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle 429 specifically
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : getBackoffDelay();
        console.warn(`Rate limited by server. Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry the request once
        return apiFetch(url, options);
      }
      
      throw new ApiError(data.message || 'API request failed', response.status, data);
    }

    // Reset backoff on successful request
    resetBackoff();
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

// Cached API responses
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// Cached fetch with TTL
export const cachedApiFetch = async (
  url: string, 
  options: RequestInit = {}, 
  ttl: number = 300000 // 5 minutes default
): Promise<any> => {
  const cacheKey = `${url}-${JSON.stringify(options)}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < cached.ttl) {
    console.log('Using cached response for:', url);
    return cached.data;
  }

  const data = await apiFetch(url, options);
  
  // Cache successful responses
  cache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    ttl
  });

  return data;
};

// Clear cache
export const clearApiCache = () => {
  cache.clear();
};

// Clear expired cache entries
export const cleanupCache = () => {
  const now = Date.now();
  for (const [key, value] of cache.entries()) {
    if (now - value.timestamp > value.ttl) {
      cache.delete(key);
    }
  }
};

// Run cache cleanup every 5 minutes
setInterval(cleanupCache, 300000);

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
      const response = await cachedApiFetch(url, {}, 600000); // Cache for 10 minutes
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
      
      // Clear cache for this tenant
      cache.delete(`${getApiBaseUrl()}/api/tenants/${tenantId}-{}`);
      
      return { success: true, data: response };
    } catch (error) {
      console.error('Error updating tenant profile:', error);
      throw error;
    }
  },

  /**
   * Get tenant's listings
   */
  getListings: async (tenantId: string): Promise<ApiResponse> => {
    try {
      const url = `${getApiBaseUrl()}/api/tenants/${tenantId}/listings`;
      const response = await cachedApiFetch(url, {}, 300000); // Cache for 5 minutes
      return { success: true, data: response };
    } catch (error) {
      console.error('Error fetching tenant listings:', error);
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
      const response = await cachedApiFetch(url, {}, 600000); // Cache for 10 minutes
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
      
      // Clear cache for this landlord
      cache.delete(`${getApiBaseUrl()}/api/landlords/${landlordId}-{}`);
      
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
      const response = await cachedApiFetch(url, {}, 300000); // Cache for 5 minutes
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