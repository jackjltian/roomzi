import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Image, MapPin, User, Calendar, Settings, MessageCircle, ChartArea, BarChart } from 'lucide-react';
import Map from '@/components/Map';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { useAuth } from '@/context/AuthContext';
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
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [mapboxToken, setMapboxToken] = useState<string>('');
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [property, setProperty] = useState(null);
    const [loading, setLoading] = useState(true);
    const [payments, setPayments] = useState([]);
    
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
                if (response.ok) {
                    // Fetch tenant names for each payment
                    const paymentsWithTenant = await Promise.all(
                        data.map(async (payment) => {
                            let tenantName = 'Unknown Tenant';
                            
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
                                        if (tenantData.success && tenantData.data) {
                                            tenantName = tenantData.data.full_name;
                                        }
                                    }
                                } catch (error) {
                                    console.error('Error fetching tenant name:', error);
                                }
                            }
                            
                            return {
                                ...payment,
                                tenantName
                            };
                        })
                    );
                    
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
    }, [property]);

    if (loading) return <div>Loading...</div>;
    if (!property) return <div>Property not found</div>;

    const images = parseImages(property.images);
    const requirements = parseArrayField(property.requirements);
    const amenities = parseArrayField(property.amenities);
    const houseRules = parseArrayField(property.houseRules);

    // Process payment data for the chart
    const monthlyData = {};
    payments.forEach(payment => {
        try {
            const date = new Date(payment.date);
            const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = 0;
            }
            const amount = parseFloat(payment.amount) || 0;
            monthlyData[monthYear] += amount;
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
                label: 'Monthly Payments',
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



                    {/* Enhanced Image Gallery */}
                    <div className="mb-8">
                        <div className="aspect-[16/10] rounded-xl overflow-hidden mb-4 shadow-lg">
                            <img
                                src={images[currentImageIndex]}
                                alt={property.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            {images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                                    currentImageIndex === index 
                                        ? 'border-blue-500 shadow-md scale-105' 
                                        : 'border-gray-200 hover:border-blue-300'
                                    }`}
                                >
                                    <img
                                        src={image}
                                        alt={`${property.title} ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Property Info Grid */}
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            
                            {/* Basic Info */}
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h1 className="text-3xl font-bold text-gray-900">{property.title}</h1>
                                    <Badge variant="secondary" className="text-lg px-4 py-2 capitalize bg-blue-100 text-blue-700">
                                        {property.type}
                                    </Badge>
                                </div>
                                
                                <div className="flex items-center text-gray-600 mb-4">
                                    <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                                    <span className="text-lg">{property.address}, {property.city}, {property.state} {property.zipCode}</span>
                                </div>

                                <div className="flex items-center text-gray-600 mb-6">
                                    <Home className="w-5 h-5 mr-2 text-blue-500" />
                                    <span className="text-lg">
                                        {property.bedrooms} bedroom{property.bedrooms !== 1 ? 's' : ''} • 
                                        {property.bathrooms} bathroom{property.bathrooms !== 1 ? 's' : ''} • 
                                        {property.area} sq ft
                                    </span>
                                </div>

                                <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8">
                                    ${property.price.toLocaleString()}
                                    <span className="text-xl font-normal text-gray-500">/month</span>
                                </div>
                            </div>

                            {/* Description */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Description</h2>
                                <p className="text-gray-700 leading-relaxed text-lg">{property.description}</p>
                            </Card>

                            {/* Amenities */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Amenities</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {amenities.map((amenity, index) => (
                                    <div key={index} className="flex items-center p-2 bg-blue-50 rounded-lg">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                                        <span className="text-gray-700 font-medium">{amenity}</span>
                                    </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Requirements */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Tenant Requirements</h2>
                                <div className="space-y-3">
                                    {requirements.map((requirement, index) => (
                                    <div key={index} className="flex items-center p-2 bg-yellow-50 rounded-lg">
                                        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                                        <span className="text-gray-700">{requirement}</span>
                                    </div>
                                    ))}
                                </div>
                            </Card>

                            {/* House Rules */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">House Rules</h2>
                                <div className="space-y-3">
                                    {houseRules.map((rule, index) => (
                                    <div key={index} className="flex items-center p-2 bg-red-50 rounded-lg">
                                        <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                                        <span className="text-gray-700">{rule}</span>
                                    </div>
                                    ))}
                                </div>
                            </Card>

                            {/* Actions */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h2 className="text-xl font-semibold mb-4 text-gray-900">Actions</h2>
                                <div className="space-y-3">
                                    <Button className="w-full">
                                        Edit Status
                                    </Button>
                                    <Button className="w-full">
                                        View Lease Agreement
                                    </Button>
                                </div>
                            </Card>

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
                                                        <p className="text-sm text-gray-600">Status: {payment.status}</p>
                                                    </div>
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

                        {/* Enhanced Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            {/* Contact Card */}
                            <Card className="p-6 sticky top-24 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                            <h3 className="text-lg font-semibold mb-4">Contact Tenants</h3>
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                                    <User className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{property.landlordName}</p>
                                    <p className="text-sm text-gray-600">{property.landlordPhone}</p>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Button 
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-md"
                                    onClick={() => setIsChatOpen(true)}
                                >
                                    Send Message
                                </Button>
                                <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200">
                                <Calendar className="w-4 h-4 mr-2" />
                                    Schedule Viewing
                                </Button>
                                <Button variant="outline" className="w-full hover:bg-blue-50 border-blue-200">
                                    Call Now
                                </Button>
                            </div>
                            </Card>

                            {/* Chat Dialog */}
                            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
                                <DialogContent className="max-w-2xl h-[80vh] p-0">
                                    <ChatWindow 
                                        propertyTitle={property.title}
                                        propertyImage={images[0]}
                                        landlordName={property.landlordName}
                                        landlordId={property.landlordId}
                                        chatRoomId={undefined}
                                        propertyId={property.id}
                                    />
                                </DialogContent>
                            </Dialog>

                            {/* Enhanced Map */}
                            <Card className="p-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                                <h3 className="text-lg font-semibold mb-4">Location</h3>
                                <div className="aspect-square rounded-lg overflow-hidden">
                                    {mapboxToken ? (
                                    <Map 
                                        properties={[property]} 
                                        onPropertyClick={() => {}}
                                        mapboxToken={mapboxToken}
                                    />
                                    ) : (
                                    <div className="h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-4">
                                        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
                                        <p className="text-center text-gray-500 text-sm mb-3">Enter Mapbox token to view map</p>
                                        <input
                                            type="text"
                                            placeholder="Mapbox token..."
                                            value={mapboxToken}
                                            onChange={(e) => setMapboxToken(e.target.value)}
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
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