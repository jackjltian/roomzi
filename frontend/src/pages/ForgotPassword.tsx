import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FaHome } from "react-icons/fa";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password reset email sent! Check your inbox.");
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
      <div 
        className="absolute inset-0 bg-gradient-to-br from-blue-100/60 to-indigo-200/60" 
        style={{ zIndex: 1 }} 
      />
      <div className="relative z-10 bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        {/* Roomzi Brand */}
        <div className="flex items-center justify-center mb-2">
          <FaHome className="text-roomzi-blue text-3xl mr-2" />
          <span className="text-3xl font-extrabold text-roomzi-blue select-none">
            Room
            <span className="text-yellow-400">zi</span>
          </span>
        </div>
        <h2 className="text-xl font-semibold mb-2 text-center text-gray-900">
          Reset Your Password
        </h2>
        <p className="text-gray-600 mb-6 text-center">
          Enter your email address and we'll send you a reset link
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full"
          />
          
          {error && <div className="text-red-500 text-sm text-center">{error}</div>}
          {message && <div className="text-green-600 text-sm text-center">{message}</div>}
          
          <Button type="submit" className="w-full py-3 text-lg font-semibold">
            Send Reset Link
          </Button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500">Remember your password? </span>
          <Button 
            variant="link" 
            className="text-roomzi-blue font-semibold p-0 h-auto" 
            onClick={() => navigate("/login")}
          >
            Log in
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
