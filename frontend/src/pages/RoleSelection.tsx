
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Home, User, Users } from 'lucide-react';
import { useUser } from '@/context/UserContext';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { setUserRole } = useUser();

  const handleRoleSelect = (role: 'tenant' | 'landlord') => {
    setUserRole(role);
    if (role === 'tenant') {
      navigate('/tenant');
    } else {
      navigate('/landlord');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Room<span className="text-roomzi-blue">zi</span>
          </h1>
          <p className="text-xl text-gray-600">
            How would you like to get started?
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 animate-slide-up">
          <Card 
            className="p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-roomzi-blue"
            onClick={() => handleRoleSelect('tenant')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-8 h-8 text-roomzi-blue" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">I'm a Renter</h3>
            <p className="text-gray-600 mb-6">
              Looking for a room, apartment, or house to rent
            </p>
            <Button className="w-full roomzi-gradient text-white font-semibold py-3 rounded-lg">
              Find Properties
            </Button>
          </Card>

          <Card 
            className="p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-roomzi-blue"
            onClick={() => handleRoleSelect('landlord')}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Home className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">I'm a Landlord</h3>
            <p className="text-gray-600 mb-6">
              I have properties to rent out and manage
            </p>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">
              List Property
            </Button>
          </Card>

          <Card 
            className="p-8 text-center hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-2 hover:border-gray-300"
            onClick={() => handleRoleSelect('tenant')}
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-semibold mb-4 text-gray-900">Just Looking</h3>
            <p className="text-gray-600 mb-6">
              Exploring options and getting familiar with the platform
            </p>
            <Button 
              variant="outline" 
              className="w-full border-2 font-semibold py-3 rounded-lg hover:bg-gray-50"
            >
              Browse Properties
            </Button>
          </Card>
        </div>

        <div className="text-center mt-8">
          <p className="text-gray-500">
            Don't worry, you can always switch between roles later
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
