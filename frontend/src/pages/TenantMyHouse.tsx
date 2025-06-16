
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Home, Calendar, DollarSign, User, Phone, Mail, MapPin } from 'lucide-react';

const TenantMyHouse = () => {
  const navigate = useNavigate();
  const [hasRental, setHasRental] = useState(false); // Set to true to show rental details

  // Mock rental data
  const currentRental = {
    propertyTitle: "Cozy 1BR Apartment",
    address: "123 Oak Street, Downtown",
    landlordName: "Mike Chen",
    landlordPhone: "+1 (555) 987-6543",
    landlordEmail: "mike.chen@email.com",
    rent: 2500,
    leaseStart: "January 1, 2024",
    leaseEnd: "December 31, 2024",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=400&h=300&fit=crop"
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tenant')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">My House</h1>
            </div>
            {hasRental && (
              <Badge className="bg-green-100 text-green-800">Active Rental</Badge>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!hasRental ? (
          // Empty state when no rental
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Current Rental</h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              When you find and rent a property, all the details will appear here. 
              Start browsing to find your perfect home!
            </p>
            <Button onClick={() => navigate('/tenant')} className="roomzi-gradient">
              Browse Properties
            </Button>
          </div>
        ) : (
          // Active rental details
          <div className="space-y-6">
            {/* Property Overview */}
            <Card className="overflow-hidden">
              <div className="aspect-video overflow-hidden">
                <img
                  src={currentRental.image}
                  alt={currentRental.propertyTitle}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                      {currentRental.propertyTitle}
                    </h2>
                    <div className="flex items-center text-gray-600 mb-2">
                      <MapPin className="w-4 h-4 mr-2" />
                      {currentRental.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-roomzi-blue">
                      ${currentRental.rent.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-500">per month</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Lease Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Lease Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease Start Date
                  </label>
                  <p className="text-gray-900">{currentRental.leaseStart}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lease End Date
                  </label>
                  <p className="text-gray-900">{currentRental.leaseEnd}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monthly Rent
                  </label>
                  <p className="text-gray-900">${currentRental.rent.toLocaleString()}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Status
                  </label>
                  <Badge className="bg-green-100 text-green-800">Paid</Badge>
                </div>
              </div>
            </Card>

            {/* Landlord Contact */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Landlord Contact
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-3 text-gray-500" />
                  <span className="font-medium">{currentRental.landlordName}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{currentRental.landlordPhone}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-3 text-gray-500" />
                  <span>{currentRental.landlordEmail}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" className="roomzi-gradient">
                  <Phone className="w-4 h-4 mr-2" />
                  Call Landlord
                </Button>
                <Button size="sm" variant="outline">
                  <Mail className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
              </div>
            </Card>

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Button variant="outline" className="justify-start">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Payment History
                </Button>
                <Button variant="outline" className="justify-start">
                  <Home className="w-4 h-4 mr-2" />
                  Maintenance Request
                </Button>
                <Button variant="outline" className="justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Inspection
                </Button>
                <Button variant="outline" className="justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Lease Renewal
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantMyHouse;
