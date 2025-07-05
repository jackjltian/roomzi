import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DollarSign, Calendar, AlertCircle, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import UpcomingPaymentBanner from '@/components/UpcomingPaymentBanner';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

const FinancialAccount = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get name and avatar from user metadata, fallback to email/initials
  const name = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const avatar = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=E0E7FF&color=3730A3`;

  // Mock data
  const totalPaid = 7500;
  const outstanding = 2500;
  const totalRent = 10000;
  const nextRentDue = {
    amount: 2500,
    dueDate: 'July 1, 2024',
  };
  const paymentHistory = [
    { date: 'June 1, 2024', amount: 2500, status: 'Paid' },
    { date: 'May 1, 2024', amount: 2500, status: 'Paid' },
    { date: 'April 1, 2024', amount: 2500, status: 'Paid' },
    { date: 'March 1, 2024', amount: 2500, status: 'Late' },
  ];

  const progress = Math.min(100, Math.round((totalPaid / totalRent) * 100));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

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
                onClick={() => navigate('/tenant/my-house')}
                className="mr-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <h1 className="text-2xl font-bold text-roomzi-blue">Financial Account</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Personalized Greeting */}
        <div className="flex items-center gap-4 mb-2">
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" />
          <div>
            <div className="text-lg font-semibold text-gray-800">Welcome back, {name}!</div>
            <div className="text-sm text-gray-500">Here's a summary of your financial account.</div>
          </div>
        </div>

        {/* Upcoming Payment Banner */}
        <UpcomingPaymentBanner amount={nextRentDue.amount} dueDate={nextRentDue.dueDate} />

        {/* Progress Bar */}
        <Card className="p-6 flex flex-col items-center">
          <div className="w-full mb-2 flex justify-between text-xs text-gray-500">
            <span>Paid</span>
            <span>Total: ${totalRent.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-blue-500 h-3 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="w-full flex justify-between text-sm">
            <span className="font-bold text-green-700">${totalPaid.toLocaleString()}</span>
            <span className="font-bold text-red-700">${outstanding.toLocaleString()} owed</span>
          </div>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 flex flex-col items-center">
            <DollarSign className="w-6 h-6 text-green-600 mb-2" />
            <div className="text-lg font-semibold text-gray-700">Total Paid</div>
            <div className="text-2xl font-bold text-green-700">${totalPaid.toLocaleString()}</div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
            <div className="text-lg font-semibold text-gray-700">Outstanding Balance</div>
            <div className="text-2xl font-bold text-red-700">${outstanding.toLocaleString()}</div>
          </Card>
          <Card className="p-6 flex flex-col items-center">
            <Calendar className="w-6 h-6 text-blue-600 mb-2" />
            <div className="text-lg font-semibold text-gray-700">Upcoming Rent</div>
            <div className="text-2xl font-bold text-blue-700">${nextRentDue.amount.toLocaleString()}</div>
            <div className="text-sm text-gray-500 mt-1">Due {nextRentDue.dueDate}</div>
          </Card>
        </div>

        {/* Payment History Table */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((p, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 pr-4">{p.date}</td>
                    <td className="py-2 pr-4">${p.amount.toLocaleString()}</td>
                    <td className="py-2 pr-4">
                      <Badge className={
                        p.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        p.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Contact/Support Button */}
        <Card className="p-6 flex flex-col items-center">
          <div className="text-lg font-semibold mb-2 flex items-center gap-2">
            <User className="w-5 h-5" /> Need help with your account?
          </div>
          <Button className="roomzi-gradient" onClick={() => alert('Contact support coming soon!')}>
            Contact Support
          </Button>
        </Card>

        {/* Helpful Tips/FAQ */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Tips & FAQ</h3>
          <ul className="list-disc pl-5 text-gray-700 space-y-1">
            <li>Rent is due on the 1st of each month.</li>
            <li>Late payments may incur a fee.</li>
            <li>
              If you have payment issues, <button className="text-blue-600 underline hover:text-blue-800" onClick={() => alert('Contact support coming soon!')}>contact support</button>.
            </li>
            <li>Keep your payment information up to date.</li>
            <li>See our <Link to="/faq" className="text-blue-600 underline">full FAQ</Link> for more.</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default FinancialAccount; 