import React from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function GoogleMapsProvider({ children }) {
  return (
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}>
      {children}
    </APIProvider>
  );
}
