import { useState, useEffect } from 'react';

export const useGeoLocation = () => {
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    error: null,
    loaded: false,
  });

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocation(state => ({ ...state, error: "Geolocation not supported", loaded: true }));
      return;
    }

    const onSuccess = (position) => {
      setLocation({
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        error: null,
        loaded: true,
      });
    };

    const onError = (error) => {
      setLocation(state => ({ ...state, error: error.message, loaded: true }));
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    });
  }, []);

  return location;
};