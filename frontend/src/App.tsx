import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import RoleSelection from "./pages/RoleSelection";
import TenantDashboard from "./pages/TenantDashboard";
import TenantProfile from "./pages/TenantProfile";
import TenantMatches from "./pages/TenantMatches";
import TenantMyHouse from "./pages/TenantMyHouse";
import LandlordDashboard from "./pages/LandlordDashboard";
import LandlordProfile from "./pages/LandlordProfile";
import PropertyDetails from "./pages/PropertyDetails";
import CreateListing from "./pages/CreateListing";
import UserProvider from "./context/UserContext";
import SignUp from "./pages/SignUp";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import AuthCallback from "./pages/AuthCallback";
import { RoleProtectedRoute } from "./components/auth/RoleProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/role-selection" element={<RoleSelection />} />
              <Route 
                path="/signup" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <SignUp />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/login" 
                element={
                  <ProtectedRoute requireAuth={false}>
                    <Login />
                  </ProtectedRoute>
                } 
              />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* Role-protected routes */}
              <Route 
                path="/tenant/*" 
                element={
                  <RoleProtectedRoute requiredRole="tenant">
                    <Routes>
                      <Route path="/" element={<TenantDashboard />} />
                      <Route path="profile" element={<TenantProfile />} />
                      <Route path="matches" element={<TenantMatches />} />
                      <Route path="my-house" element={<TenantMyHouse />} />
                    </Routes>
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/landlord/*" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <Routes>
                      <Route path="/" element={<LandlordDashboard />} />
                      <Route path="profile" element={<LandlordProfile />} />
                    </Routes>
                  </RoleProtectedRoute>
                } 
              />
              <Route 
                path="/property/:id" 
                element={
                  <ProtectedRoute>
                    <PropertyDetails />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/create-listing" 
                element={
                  <RoleProtectedRoute requiredRole="landlord">
                    <CreateListing />
                  </RoleProtectedRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
