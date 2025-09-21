/**
 * Test component to verify Google Maps integration
 * This can be used in development to test the map functionality
 */
import React from 'react';
import GoogleMap from '../components/ui/GoogleMap';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const MapTest = () => {
  const testDestinations = [
    'Paris, France',
    'Tokyo, Japan',
    'New York, USA',
    'London, UK',
    'Sydney, Australia'
  ];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Google Maps Integration Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This page tests the Google Maps integration with various destinations.
            Make sure you have set up the VITE_GOOGLE_MAPS_API_KEY in your .env file.
          </p>
        </CardContent>
      </Card>

      {testDestinations.map((destination, index) => (
        <div key={destination} className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">
            Test {index + 1}: {destination}
          </h3>
          <GoogleMap 
            destination={destination}
            height="300px"
            zoom={12}
            showLocationInfo={true}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
};

export default MapTest;