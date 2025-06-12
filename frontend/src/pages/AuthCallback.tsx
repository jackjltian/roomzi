import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          navigate('/login');
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          const userRole = user.user_metadata?.role;
          
          // Redirect based on role
          if (userRole === 'tenant') {
            navigate('/tenant');
          } else if (userRole === 'landlord') {
            navigate('/landlord');
          } else {
            // If no role, redirect to role selection
            navigate('/role-selection');
          }
        } else {
          navigate('/login');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/login');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600 text-lg">Completing authentication...</p>
        <p className="mt-2 text-gray-500">Please wait while we redirect you...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
