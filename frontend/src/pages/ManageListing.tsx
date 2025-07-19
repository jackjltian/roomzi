import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, FileText } from 'lucide-react';
import { apiFetch, getApiBaseUrl } from '@/utils/api';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
} from 'chart.js';
import LandlordPayments from './LandlordPayments';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend
);

// Helper to safely parse images field
function parseImages(images) {
  if (Array.isArray(images)) return images;
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) return parsed;
      return [images];
    } catch {
      return [images];
    }
  }
  return [];
}

// Helper to safely parse array-like fields (requirements, amenities, houseRules)
function parseArrayField(field) {
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      const parsed = JSON.parse(field);
      if (Array.isArray(parsed)) return parsed;
      if (field.includes(',')) return field.split(',').map(s => s.trim());
      return [field];
    } catch {
      if (field.includes(',')) return field.split(',').map(s => s.trim());
      return [field];
    }
  }
  return [];
}

const ManageListing = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    const [refreshKey, setRefreshKey] = useState(0);
    
    useEffect(() => {
        const fetchProperty = async () => {
            try {
                setLoading(true);
                const response = await apiFetch(`${getApiBaseUrl()}/api/listings/${id}`);
                if (response.success) {
                    const data = response.data;
                    setProperty({
                        ...data,
                        houseRules: data.house_rules,
                        landlordName: data.landlord_name,
                        landlordPhone: data.landlord_phone,
                        landlordId: data.landlord_id,
                        zipCode: data.zip_code,
                        leaseType: data.lease_type,
                        images: data.images,
                        amenities: data.amenities,
                        requirements: data.requirements,
                        coordinates: data.coordinates,
                        // Add more mappings as needed
                    });
                } else {
                    setProperty(null);
                }
            } catch (error) {
                setProperty(null);
            } finally {
                setLoading(false);
            }
        };
        fetchProperty();
    }, [id]);

    useEffect(() => {
        if (!property) return;
        const fetchPayments = async () => {
            try {
                const response = await fetch(`http://localhost:3001/api/landlords/payments/${property.id}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                });
                const data = await response.json();
                console.log('Payment data structure:', data);
                if (response.ok) {
                    // Fetch tenant names for each payment with better error handling
                    const paymentsWithTenant = await Promise.all(
                        data.map(async (payment) => {
                            let tenantName = `Tenant ${payment.tenantId ? payment.tenantId.slice(0, 8) : 'Unknown'}`;
                            
                            if (payment.tenantId) {
                                try {
                                    const tenantResponse = await fetch(`http://localhost:3001/api/tenants/${payment.tenantId}`, {
                                        method: 'GET',
                                        headers: {
                                            'Content-Type': 'application/json'
                                        },
                                        credentials: 'include',
                                    });
                                    
                                    if (tenantResponse.ok) {
                                        const tenantData = await tenantResponse.json();
                                        console.log('Tenant response:', tenantData);
                                        
                                        if (tenantData.success && tenantData.data && tenantData.data.full_name) {
                                            tenantName = tenantData.data.full_name;
                                        } else if (tenantData.data && tenantData.data.full_name) {
                                            tenantName = tenantData.data.full_name;
                                        }
                                    } else {
                                        console.warn(`Failed to fetch tenant ${payment.tenantId}: ${tenantResponse.status}`);
                                        // Keep the default tenant name
                                    }
                                } catch (error) {
                                    console.warn('Error fetching tenant name:', error);
                                    // Keep the default tenant name
                                }
                            }
                            
                            return {
                                ...payment,
                                tenantName
                            };
                        })
                    );
                    
                    // Show all payments regardless of status
                    setPayments(paymentsWithTenant);
                } else if (response.status === 404) {
                    console.log(`No payments found for listing ${property.id}`)
                }
            } catch (error) {
                console.log("Error fetching payments")
                setPayments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchPayments();
    }, [property, refreshKey]);

    if (loading) return <div>Loading...</div>;
    if (!property) return <div>Property not found</div>;

    // Process payment data for the chart
    const monthlyData = {};
    payments.forEach(payment => {
        try {
            if (payment.status == 'Approved') {
                const date = new Date(payment.date);
                const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = 0;
                }
                const amount = parseFloat(payment.amount) || 0;
                monthlyData[monthYear] += amount;
            }
        } catch (error) {
            console.error('Error processing payment for chart:', error);
        }
    });

    // Sort the monthly data chronologically
    const sortedEntries = Object.entries(monthlyData).sort((a, b) => {
        const dateA = new Date(a[0]);
        const dateB = new Date(b[0]);
        return dateA.getTime() - dateB.getTime();
    });

    const sortedLabels = sortedEntries.map(([label]) => label);
    const sortedData = sortedEntries.map(([, value]) => value);

    const chartData = {
        labels: sortedLabels.length > 0 ? sortedLabels : ['No Data'],
        datasets: [
            {
                label: 'Approved Payments',
                data: sortedData.length > 0 ? sortedData : [0],
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1,
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Monthly Payment Income',
            },
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return '$' + value.toLocaleString();
                    }
                }
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Button 
                        variant="ghost" 
                        onClick={() => navigate('/landlord')}
                        className="flex items-center"
                    >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Dashboard
                    </Button>
                    <h1 className="text-2xl font-bold text-roomzi-blue">Manage Listing</h1>
                    <div className="w-32"></div> {/* Spacer for centering */}
                </div>
                </div>
            </header>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 pb-20">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                    {/* Property Info Grid */}
                    <div className="grid lg:grid-cols-3 gap-8 mb-8">
                        <div className="lg:col-span-3 space-y-6">
                            {/* Actions */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Actions</h2>
                                <div className="space-x-3">
                                    <Button className="w-fit">
                                        View Tenant Details
                                    </Button>
                                    <Button className="w-fit" onClick={() => navigate(`/landlord/lease-agreement/${property.id}`)}>
                                        View Lease Agreement
                                    </Button>
                                </div>
                            </Card>

                            <LandlordPayments 
                                listingId={property?.id} 
                                onPaymentStatusChange={() => setRefreshKey(prev => prev + 1)}
                            />

                            {/* Monthly Income */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Monthly Income</h2>
                                <div>
                                    {payments.length > 0 ? (
                                        <Bar data={chartData} options={chartOptions} />
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No payment data available for this listing
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* Payment History */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Payment History</h2>
                                <div>
                                    {payments.length > 0 ? (
                                        payments.map((payment, index) => (
                                            <div key={payment.id || `payment-${index}`} className="border-b border-gray-200 py-3">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <p className="font-semibold">${parseFloat(payment.amount).toFixed(2)}</p>
                                                        <p className="text-sm text-gray-600">{new Date(payment.date).toLocaleDateString()}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-gray-600">{payment.tenantName || 'Unknown Tenant'}</p>
                                                        <div className="flex items-center justify-end mt-1">
                                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                                payment.status === 'Approved' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : payment.status === 'Pending'
                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {payment.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-end mt-2">
                                                    {payment.proofUrl ? (
                                                        <a 
                                                            href={`http://localhost:3001${payment.proofUrl}`} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="flex items-center text-blue-600 hover:underline text-sm"
                                                        >
                                                            <FileText className="w-4 h-4 mr-1" />
                                                            View Proof
                                                        </a>
                                                    ) : (
                                                        <span className="flex items-center text-gray-400 text-sm">
                                                            <FileText className="w-4 h-4 mr-1" />
                                                            No Proof
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-8">
                                            No payment history available for this listing
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManageListing;