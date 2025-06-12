import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SocialAuthButtons } from "@/components/auth/SocialAuthButtons";
import { FaHome } from "react-icons/fa";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabaseClient";

const SignUp = () => {
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { userRole } = useUser();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Starting signup process...'); // Debug log
      
      // Sign up user with metadata including role and full name
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.fullName,
            phone: form.phone,
            role: userRole || 'tenant'
          },
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      console.log('Signup response:', { data, error: signUpError }); // Debug log

      if (signUpError) {
        throw signUpError;
      }

      console.log('Signup successful, navigating to login...'); // Debug log

      // Show success message and redirect
      navigate("/login", { 
        state: { 
          message: "Please check your email to verify your account before logging in.",
          type: "success"
        }
      });
    } catch (error: any) {
      console.error('Signup error:', error); // Debug log
      setError(error.message || 'An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Background Illustration */}
      <img
        src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
        alt="Roomzi background"
        className="absolute inset-0 w-full h-full object-cover opacity-30"
        style={{ zIndex: 0 }}
      />
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-indigo-200/60" style={{ zIndex: 1 }} />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Roomzi Brand */}
        <div className="flex items-center justify-center mb-2">
          <FaHome className="text-roomzi-blue text-3xl mr-2" />
          <span className="text-3xl font-extrabold text-roomzi-blue select-none">
            Room
            <span className="text-yellow-400">zi</span>
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center text-gray-900">Create your Roomzi account</h2>
        <p className="text-gray-600 mb-6 text-center">Sign up to get started as a {userRole || 'tenant'}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input 
            name="fullName" 
            placeholder="Full Name" 
            value={form.fullName} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
          <Input 
            name="phone" 
            placeholder="Phone" 
            value={form.phone} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
          <Input 
            name="email" 
            type="email" 
            placeholder="Email" 
            value={form.email} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
          <Input 
            name="password" 
            type="password" 
            placeholder="Password" 
            value={form.password} 
            onChange={handleChange} 
            required 
            disabled={loading}
          />
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          <Button 
            type="submit" 
            className="w-full py-3 text-lg font-semibold" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
        <div className="my-6 flex items-center justify-center">
          <span className="h-px w-16 bg-gray-200" />
          <span className="mx-3 text-gray-400 text-sm">or sign up with</span>
          <span className="h-px w-16 bg-gray-200" />
        </div>
        <SocialAuthButtons />
        <div className="mt-6 text-center">
          <span className="text-gray-500">Already have an account? </span>
          <Button 
            variant="link" 
            className="text-roomzi-blue font-semibold p-0 h-auto" 
            onClick={() => navigate("/login")}
            disabled={loading}
          >
            Log in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
