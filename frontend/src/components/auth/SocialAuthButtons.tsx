import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook, FaDiscord } from "react-icons/fa";
import { MdEmail } from "react-icons/md";
import { useUser } from "@/context/UserContext";

export const SocialAuthButtons = () => {
  const { userRole } = useUser();

  const handleSocialLogin = async (provider: "google" | "facebook" | "discord") => {
    // Determine redirect URL based on selected role
    let redirectTo = `${window.location.origin}/login`;
    
    // If user has selected a role, we can redirect them directly to their dashboard
    if (userRole === 'tenant') {
      redirectTo = `${window.location.origin}/tenant`;
    } else if (userRole === 'landlord') {
      redirectTo = `${window.location.origin}/landlord`;
    }

    const { error } = await supabase.auth.signInWithOAuth({ 
      provider,
      options: {
        redirectTo,
        queryParams: {
          role: userRole || 'tenant' // Pass role as query parameter
        }
      }
    });

    if (error) {
      console.error('Social login error:', error);
    }
  };

  const handleMagicLink = async () => {
    const email = prompt("Enter your email for a magic link:");
    if (email) {
      let redirectTo = `${window.location.origin}/login`;
      
      if (userRole === 'tenant') {
        redirectTo = `${window.location.origin}/tenant`;
      } else if (userRole === 'landlord') {
        redirectTo = `${window.location.origin}/landlord`;
      }

      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: redirectTo
        }
      });
      
      if (error) {
        alert(error.message);
      } else {
        alert("Check your email for the magic link!");
      }
    }
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <Button variant="outline" onClick={() => handleSocialLogin("google")} className="flex items-center">
        <FcGoogle className="mr-2 text-xl" />
        Continue with Google
      </Button>
      <Button variant="outline" onClick={() => handleSocialLogin("facebook")} className="flex items-center">
        <FaFacebook className="mr-2 text-xl text-blue-600" />
        Continue with Facebook
      </Button>
      <Button variant="outline" onClick={() => handleSocialLogin("discord")} className="flex items-center">
        <FaDiscord className="mr-2 text-xl text-indigo-600" />
        Continue with Discord
      </Button>
      <Button variant="outline" onClick={handleMagicLink} className="flex items-center">
        <MdEmail className="mr-2 text-xl text-gray-600" />
        Continue with Email (Magic Link)
      </Button>
    </div>
  );
};
