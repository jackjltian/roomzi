import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { STORAGE_KEYS, USER_ROLES, ROUTES, APP_METADATA } from './constants';

/**
 * Get redirect path based on user role
 */
export const getRedirectPath = (user: User | null): string => {
  if (!user) return ROUTES.AUTH;
  
  const role = user.user_metadata?.role || localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE);
  
  if (role === USER_ROLES.TENANT) return ROUTES.TENANT_DASHBOARD;
  if (role === USER_ROLES.LANDLORD) return ROUTES.LANDLORD_DASHBOARD;
  return ROUTES.ROLE_SELECTION;
};

/**
 * Update user metadata with role information
 */
export const updateUserMetadata = async (role: 'tenant' | 'landlord') => {
  const { error } = await supabase.auth.updateUser({
    data: {
      role,
      signup_source: APP_METADATA.SIGNUP_SOURCE,
      profile_completed: true,
      updated_at: new Date().toISOString()
    }
  });
  
  if (error) {
    throw new Error(`Failed to update user metadata: ${error.message}`);
  }
  
  // Also update localStorage for consistency
  localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, role);
};

/**
 * Clear user role from both metadata and localStorage
 */
export const clearUserRole = async () => {
  localStorage.removeItem(STORAGE_KEYS.SELECTED_ROLE);
  
  try {
    await supabase.auth.updateUser({
      data: {
        role: null,
        profile_completed: false,
        updated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to clear user metadata:', error);
    // Don't throw - localStorage clearing succeeded
  }
};

/**
 * Validate user data for profile operations
 */
export const validateUserData = (user: any) => {
  if (!user) {
    throw new Error('User data is missing');
  }
  
  if (!user.id) {
    throw new Error('User ID is missing');
  }
  
  if (!user.email) {
    throw new Error('User email is missing');
  }
  
  return true;
};

/**
 * Get current user role with fallback logic
 */
export const getCurrentUserRole = (user: User | null): 'tenant' | 'landlord' | null => {
  if (!user) return null;
  
  const metadataRole = user.user_metadata?.role;
  const localStorageRole = localStorage.getItem(STORAGE_KEYS.SELECTED_ROLE) as 'tenant' | 'landlord' | null;
  
  // Prefer metadata over localStorage
  if (metadataRole === USER_ROLES.TENANT || metadataRole === USER_ROLES.LANDLORD) {
    // Sync localStorage if different
    if (localStorageRole !== metadataRole) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_ROLE, metadataRole);
    }
    return metadataRole;
  }
  
  return localStorageRole;
}; 