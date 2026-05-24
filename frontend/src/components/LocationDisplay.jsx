import React from 'react';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { MapPin, Loader } from 'lucide-react';

const LocationDisplay = () => {
  const { lat, lng, error, loaded } = useGeoLocation();

  if (!loaded) return <Loader className="w-4 h-4 animate-spin" />;
  if (error) return <span className="text-red-500 text-xs">GPS Disabled</span>;

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-xs font-semibold text-white">
      <MapPin className="w-3 h-3" />
      <span>Gwalior, MP</span> {/* In a production app, use lat/lng to fetch city name */}
    </div>
  );
};

export default LocationDisplay;