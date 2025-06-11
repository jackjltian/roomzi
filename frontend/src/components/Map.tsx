import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Property } from '@/data/sampleProperties';
import { Card } from '@/components/ui/card';
import { MapPin, Home } from 'lucide-react';

interface MapProps {
  properties: Property[];
  onPropertyClick: (propertyId: string) => void;
  mapboxToken?: string;
}

const Map: React.FC<MapProps> = ({ properties, onPropertyClick, mapboxToken }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-79.3832, 43.6532], // Toronto center
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    properties.forEach((property) => {
      const markerElement = document.createElement('div');
      markerElement.className = 'map-marker';
      markerElement.innerHTML = `
        <div class="bg-roomzi-blue text-white px-2 py-1 rounded-lg shadow-lg text-sm font-semibold cursor-pointer hover:bg-blue-700 transition-colors">
          $${property.price.toLocaleString()}
        </div>
      `;

      markerElement.addEventListener('click', () => setSelectedProperty(property));

      new mapboxgl.Marker(markerElement)
        .setLngLat([property.coordinates.lng, property.coordinates.lat])
        .addTo(map.current!);
    });

    return () => map.current?.remove();
  }, [properties, mapboxToken]);

  if (!mapboxToken) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-8">
        <MapPin className="w-16 h-16 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Map View Requires Mapbox Token</h3>
        <p className="text-gray-500 text-center mb-4">
          To use the map functionality, please enter your Mapbox public token below.
          Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-roomzi-blue underline">mapbox.com</a>
        </p>
        <input
          type="text"
          placeholder="Enter your Mapbox public token..."
          value={tokenInput}
          onChange={(e) => setTokenInput(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-roomzi-blue"
        />
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {selectedProperty && (
        <div className="absolute top-4 left-4 z-10">
          <Card className="p-4 bg-white shadow-lg max-w-sm">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 line-clamp-1">{selectedProperty.title}</h3>
              <button
                onClick={() => setSelectedProperty(null)}
                className="text-gray-400 hover:text-gray-600 ml-2"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{selectedProperty.city}</span>
            </div>

            <div className="flex items-center text-gray-600 mb-3">
              <Home className="w-4 h-4 mr-1" />
              <span className="text-sm">
                {selectedProperty.bedrooms} bed • {selectedProperty.bathrooms} bath
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-roomzi-blue">
                ${selectedProperty.price.toLocaleString()}
                <span className="text-sm font-normal text-gray-500">/month</span>
              </div>
              <button
                onClick={() => onPropertyClick(selectedProperty.id)}
                className="px-3 py-1 bg-roomzi-blue text-white rounded-md text-sm hover:bg-blue-700 transition-colors"
              >
                View Details
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Map;
