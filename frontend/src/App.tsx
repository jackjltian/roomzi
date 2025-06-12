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
import Chat from "./pages/Chat";
import UserProvider from "./context/UserContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <UserProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/role-selection" element={<RoleSelection />} />
            <Route path="/tenant" element={<TenantDashboard />} />
            <Route path="/tenant/profile" element={<TenantProfile />} />
            <Route path="/tenant/matches" element={<TenantMatches />} />
            <Route path="/tenant/my-house" element={<TenantMyHouse />} />
            <Route path="/landlord" element={<LandlordDashboard />} />
            <Route path="/landlord/profile" element={<LandlordProfile />} />
            <Route path="/property/:id" element={<PropertyDetails />} />
            <Route path="/create-listing" element={<CreateListing />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </UserProvider>
  </QueryClientProvider>
);

export default App;
