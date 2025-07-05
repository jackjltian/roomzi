import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Home, Image } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';
import CameraButton from '@/components/ui/camera-button';

const CreateListing = () => {
  const { user } = useAuth();

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    type: 'room',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    bedrooms: 1,
    bathrooms: 1,
    area: '',
    price: '',
    description: '',
    leaseType: 'long-term',
    amenities: [],
    requirements: '',
    houseRules: '',
    images: [] as File[],
    landlordId: user.id
  });

  const propertyTypes = [
    { value: 'room', label: 'Room' },
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condo' }
  ];

  const commonAmenities = [
    'WiFi', 'Kitchen', 'Laundry', 'Parking', 'Balcony', 'Gym', 
    'Pool', 'Concierge', 'Pet Friendly', 'Garden', 'Storage'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newFiles]
      }));
    }
  };

  const handleDeleteFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const uploadImages = async (files: File[]) => {
    const imageUrls: string[] = [];
    
    for (let file of files) {
      const path = `images/${Date.now()}_${file.name}`;
      console.log("Uploading image to path:", path);

      // Check if buckets exist
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) {
        console.error(bucketsError);
        throw new Error("Failed to check storage buckets");
      }

      // Check if listings bucket exists
      const listingsBucket = buckets.find(b => b.name === 'listings');
      if (!listingsBucket) {
        throw new Error("Storage bucket 'listings' does not exist.");
      }

      const { error: uploadError } = await supabase.storage
        .from('listings')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error(uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from('listings').getPublicUrl(path);
      imageUrls.push(data.publicUrl);
    }

    return imageUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      let imageUrls = [];

      if (formData.images.length > 0) {
        imageUrls = await uploadImages(formData.images);
      }

      const payload = {
        ...formData,
        images: imageUrls
      };
      
      console.log('Creating listing:', payload);

      const response = await fetch('http://localhost:3001/api/landlord/create-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing.');
      }

      const result = await response.json();
      console.log('Listing created successfully:', result);

      navigate('/landlord');
    } catch (error) {
      console.error('Error creating listing:', error);
      alert(error.message || 'Failed to create listing.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
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
            <h1 className="text-2xl font-bold text-roomzi-blue">Create Listing</h1>
            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Basic Information</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title">Property Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="e.g., Cozy Downtown Studio"
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Property Type</Label>
                <select
                  id="type"
                  value={formData.type}
                  onChange={(e) => handleInputChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue"
                  required
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* Image Upload Section */}
            <div className="mt-6">
              <Label>Property Images</Label>
              <div className="flex items-center gap-4 mt-2">
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadFile}
                  className="w-auto"
                />
                <CameraButton
                  onImageSelect={(file) => {
                    setFormData(prev => ({
                      ...prev,
                      images: [...prev.images, file]
                    }));
                  }}
                />
              </div>
              {/* Preview selected images */}
              <div className="flex flex-wrap gap-4 mt-4">
                {formData.images.map((file, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={URL.createObjectURL(file)}
                      alt={`Selected ${idx}`}
                      className="w-24 h-24 object-cover rounded shadow"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteFile(idx)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Location */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Location</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="123 Main Street"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="San Francisco"
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="CA"
                  required
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="94102"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Property Details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Property Details</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <select
                  id="bedrooms"
                  value={formData.bedrooms}
                  onChange={(e) => handleInputChange('bedrooms', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue"
                >
                  {[1, 2, 3, 4, 5].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <select
                  id="bathrooms"
                  value={formData.bathrooms}
                  onChange={(e) => handleInputChange('bathrooms', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue"
                >
                  {[1, 1.5, 2, 2.5, 3, 3.5, 4].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="area">Area (sq ft)</Label>
                <Input
                  id="area"
                  type="number"
                  value={formData.area}
                  onChange={(e) => handleInputChange('area', e.target.value)}
                  placeholder="800"
                  required
                />
              </div>
            </div>
          </Card>

          {/* Pricing & Lease */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Pricing & Lease Terms</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="price">Monthly Rent ($)</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="2500"
                  required
                />
              </div>
              <div>
                <Label htmlFor="leaseType">Lease Type</Label>
                <select
                  id="leaseType"
                  value={formData.leaseType}
                  onChange={(e) => handleInputChange('leaseType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue"
                >
                  <option value="long-term">Long-term</option>
                  <option value="short-term">Short-term</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Description */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Description</h2>
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your property, highlight key features, location benefits..."
              rows={4}
              required
            />
          </Card>

          {/* Amenities */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {commonAmenities.map(amenity => (
                <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.amenities.includes(amenity)}
                    onChange={() => handleAmenityToggle(amenity)}
                    className="rounded text-roomzi-blue focus:ring-roomzi-blue"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
          </Card>

          {/* Requirements & Rules */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-6">Tenant Requirements & House Rules</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="requirements">Tenant Requirements</Label>
                <Textarea
                  id="requirements"
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  placeholder="e.g., Good credit score, No smoking, Proof of income..."
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="houseRules">House Rules</Label>
                <Textarea
                  id="houseRules"
                  value={formData.houseRules}
                  onChange={(e) => handleInputChange('houseRules', e.target.value)}
                  placeholder="e.g., No pets, Quiet hours 10pm-8am, No parties..."
                  rows={4}
                />
              </div>
            </div>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/landlord')}>
              Cancel
            </Button>
            <Button type="submit" className="roomzi-gradient">
              <Home className="w-4 h-4 mr-2" />
              Create Listing
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateListing;
