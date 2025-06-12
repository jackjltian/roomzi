import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: 'tenant' | 'landlord';
}

export const RoleProtectedRoute = ({ children, requiredRole }: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRoleChecked(true);
    }
  }, [loading, user]);

  // Show loading while checking authentication
  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  const userRole = user.user_metadata?.role;
  
  if (userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    if (userRole === 'tenant') {
      return <Navigate to="/tenant" replace />;
    } else if (userRole === 'landlord') {
      return <Navigate to="/landlord" replace />;
    } else {
      // If no role is set, redirect to role selection
      return <Navigate to="/role-selection" replace />;
    }
  }

  return <>{children}</>;
};
