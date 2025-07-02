import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, DollarSign, FileText, CheckCircle, Clock, UploadCloud } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const initialMockPayments = [
  {
    id: 1,
    amount: 2500,
    date: '2024-05-01',
    status: 'Approved',
    proof: 'proof1.pdf',
    proofUrl: '',
  },
  {
    id: 2,
    amount: 2500,
    date: '2024-04-01',
    status: 'Pending',
    proof: 'proof2.pdf',
    proofUrl: '',
  },
  {
    id: 3,
    amount: 2500,
    date: '2024-03-01',
    status: 'Rejected',
    proof: 'proof3.pdf',
    proofUrl: '',
  },
];

const statusColor = {
  Approved: 'text-green-600',
  Pending: 'text-yellow-600',
  Rejected: 'text-red-600',
};

const statusIcon = {
  Approved: <CheckCircle className="w-4 h-4 mr-1 text-green-600" />,
  Pending: <Clock className="w-4 h-4 mr-1 text-yellow-600" />,
  Rejected: <Clock className="w-4 h-4 mr-1 text-red-600" />,
};

const Payments = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const tenantId = user?.id;
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payments, setPayments] = useState(initialMockPayments);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAmount(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData();
    formData.append('tenantId', tenantId);
    formData.append('amount', amount);
    if (file) formData.append('proof', file);

    const response = await fetch('/api/payments', {
      method: 'POST',
      body: formData,
    });

    setSubmitting(false);
    setShowForm(false);
    setAmount('');
    setFile(null);

    if (response.ok) {
      alert("Payment request successfully submitted. Waiting for landlord's approval.");
      // Re-fetch payments from backend
      fetch(`/api/payments/tenant/${tenantId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) setPayments(data.payments);
        });
    } else {
      alert('Failed to submit payment.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-8">
      <Card className="w-full max-w-2xl p-8">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mr-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h2 className="text-2xl font-bold text-roomzi-blue">Payments</h2>
        </div>
        <div className="mb-6">
          <Button className="roomzi-gradient w-full" onClick={() => setShowForm(!showForm)}>
            Make a Payment
          </Button>
        </div>
        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-6 mb-8 border rounded-md p-6 bg-gray-50">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <div className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2 text-gray-400" />
                <Input
                  type="number"
                  min="0"
                  step="10.00"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={handleAmountChange}
                  required
                  className="w-full text-center hide-number-input-arrows"
                  style={{ appearance: 'textfield', MozAppearance: 'textfield', WebkitAppearance: 'none' }}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Proof of Payment</label>
              <div className="flex items-center">
                <UploadCloud className="w-5 h-5 mr-2 text-gray-400" />
                <Input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  required
                />
              </div>
              {file && <div className="mt-2 text-sm text-gray-600">Selected: {file.name}</div>}
            </div>
            <Button type="submit" className="roomzi-gradient w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Payment'}
            </Button>
          </form>
        )}
        <div className="space-y-4">
          {payments.map(payment => (
            <Card key={payment.id} className="p-4 flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <DollarSign className="w-6 h-6 text-blue-500" />
                <div>
                  <div className="text-lg font-semibold">${payment.amount.toLocaleString()}</div>
                  <div className="text-gray-500 text-sm">{payment.date}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2 md:mt-0">
                <span className={`flex items-center font-medium ${statusColor[payment.status]}`}>{statusIcon[payment.status]}{payment.status}</span>
                {payment.proofUrl ? (
                  <a href={payment.proofUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-600 hover:underline text-sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View Proof
                  </a>
                ) : (
                  <a href="#" className="flex items-center text-blue-600 hover:underline text-sm">
                    <FileText className="w-4 h-4 mr-1" />
                    View Proof
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Payments; 