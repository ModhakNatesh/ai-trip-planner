import { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsScript, geocodeLocation } from '../../lib/googleMaps';
import { Card, CardContent } from './card';
import { MapPin, AlertTriangle } from 'lucide-react';

const GoogleMap = ({ 
  destination, 
  className = '',
  height = '400px',
  zoom = 5, // Further reduced default zoom to show more area
  showLocationInfo = true,
  showBoundaries = true // New prop to show area boundaries
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const boundsRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationInfo, setLocationInfo] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const initializeMap = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load Google Maps script
        await loadGoogleMapsScript();

        if (!isMounted) return;

        // Geocode the destination
        const coords = await geocodeLocation(destination);
        
        if (!isMounted) return;

        setLocationInfo(coords);

        // Create map with minimal UI elements and enhanced country border styling
        const mapOptions = {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: coords.showFullCountry ? 5 : zoom, // Use lower zoom for full country view
          mapTypeControl: false, // Hide map type control
          streetViewControl: false, // Hide street view control
          fullscreenControl: true, // Keep only fullscreen (expand) button
          zoomControl: false, // Hide zoom controls
          gestureHandling: 'cooperative', // Require ctrl+scroll for zoom
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels',
              stylers: [{ visibility: 'simplified' }]
            },
            {
              featureType: 'administrative.locality',
              elementType: 'labels',
              stylers: [{ visibility: 'on' }]
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#2563eb' }, { weight: 3 }, { visibility: 'on' }]
            },
            {
              featureType: 'administrative.country',
              elementType: 'geometry.fill',
              stylers: [{ color: '#3b82f6' }, { visibility: 'off' }]
            },
            {
              featureType: 'administrative.province',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#60a5fa' }, { weight: 1 }, { visibility: 'on' }]
            },
            // Hide most UI elements via custom styling
            {
              featureType: 'all',
              elementType: 'labels.icon',
              stylers: [{ visibility: 'simplified' }]
            },
            // Enhance water visibility for better country outline
            {
              featureType: 'water',
              elementType: 'geometry',
              stylers: [{ color: '#a7c6ed' }]
            },
            // Make land slightly lighter to emphasize borders
            {
              featureType: 'landscape',
              elementType: 'geometry',
              stylers: [{ lightness: 10 }]
            }
          ],
          // Additional options to minimize UI
          disableDefaultUI: false, // Keep some default UI
          clickableIcons: false, // Disable clickable POI icons
          keyboardShortcuts: false, // Disable keyboard shortcuts
        };

        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);

        // Add custom CSS to hide unwanted UI elements
        const style = document.createElement('style');
        style.textContent = `
          .gm-style-cc { display: none !important; }
          .gm-style .gm-style-cc { display: none !important; }
          .gmnoprint .gm-bundled-control { display: none !important; }
          .gm-style .gm-style-mtc { display: none !important; }
          .gm-style .gm-svpc { display: none !important; }
          .gm-control-active { display: none !important; }
          .gm-bundled-control-on-bottom { display: none !important; }
          .gm-style .gm-fullscreen-control { 
            display: block !important;
            right: 10px !important;
            top: 10px !important;
          }
          /* Hide Google watermark except in fullscreen */
          .gm-style .gm-style-cc:not(.gm-style-cc-expanded) { display: none !important; }
        `;
        document.head.appendChild(style);

        // If fallback coordinates include viewport bounds, use them to show the area
        if (coords.viewport && showBoundaries) {
          const bounds = new window.google.maps.LatLngBounds(
            new window.google.maps.LatLng(coords.viewport.south, coords.viewport.west),
            new window.google.maps.LatLng(coords.viewport.north, coords.viewport.east)
          );
          
          mapInstanceRef.current.fitBounds(bounds);
          
          // For full country view, add a more prominent border highlighting
          if (coords.showFullCountry) {
            // Add country boundary highlighting
            new window.google.maps.Rectangle({
              strokeColor: '#2563eb',
              strokeOpacity: 0.9,
              strokeWeight: 4,
              fillColor: '#3b82f6',
              fillOpacity: 0.05, // Very subtle fill to show the area
              map: mapInstanceRef.current,
              bounds: bounds
            });
          } else {
            // Add only the border outline (no fill) for city/region views
            new window.google.maps.Rectangle({
              strokeColor: '#3b82f6',
              strokeOpacity: 0.8,
              strokeWeight: 3,
              fillColor: '#3b82f6',
              fillOpacity: 0, // No fill, only border
              map: mapInstanceRef.current,
              bounds: bounds
            });
          }
        }

        // Create a smaller, more subtle center marker
        markerRef.current = new window.google.maps.Marker({
          position: { lat: coords.lat, lng: coords.lng },
          map: mapInstanceRef.current,
          title: destination,
          animation: window.google.maps.Animation.DROP,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="8" fill="#3b82f6"/>
                <circle cx="12" cy="12" r="4" fill="white"/>
              </svg>
            `),
            scaledSize: new window.google.maps.Size(24, 24),
            anchor: new window.google.maps.Point(12, 12)
          }
        });

        // Try to get and display city/area boundaries if showBoundaries is enabled
        if (showBoundaries && window.google.maps.places) {
          const service = new window.google.maps.places.PlacesService(mapInstanceRef.current);
          
          const request = {
            query: destination,
            fields: ['geometry', 'name', 'formatted_address', 'place_id']
          };

          service.findPlaceFromQuery(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results && results[0]) {
              const place = results[0];
              
              if (place.geometry.viewport) {
                // Fit the map to show the entire area/city
                mapInstanceRef.current.fitBounds(place.geometry.viewport);
                boundsRef.current = place.geometry.viewport;
                
                // Add a subtle boundary circle to indicate the area
                const bounds = place.geometry.viewport;
                const center = bounds.getCenter();
                const ne = bounds.getNorthEast();
                
                // Calculate approximate radius for the area
                const radius = window.google.maps.geometry.spherical.computeDistanceBetween(center, ne);
                
                new window.google.maps.Circle({
                  strokeColor: '#3b82f6',
                  strokeOpacity: 0.3,
                  strokeWeight: 2,
                  fillColor: '#3b82f6',
                  fillOpacity: 0.1,
                  map: mapInstanceRef.current,
                  center: center,
                  radius: radius * 0.7 // Slightly smaller than viewport for better visual
                });
              }
            }
          });
        }

        // Create info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 8px; max-width: 200px;">
              <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600; color: #1f2937;">
                ${destination}
              </h3>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">
                ${coords.formattedAddress}
              </p>
            </div>
          `
        });

        // Show info window on marker click
        markerRef.current.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current, markerRef.current);
        });

        // Auto-open info window initially
        setTimeout(() => {
          if (isMounted && markerRef.current) {
            infoWindow.open(mapInstanceRef.current, markerRef.current);
          }
        }, 1000);

      } catch (err) {
        console.error('Error initializing map:', err);
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (destination) {
      initializeMap();
    }

    return () => {
      isMounted = false;
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
    };
  }, [destination, zoom, showBoundaries]);

  if (!destination) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <p>No destination specified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-500" />
            <p className="text-sm font-medium text-gray-700 mb-2">Map temporarily unavailable</p>
            
            {error.includes('API project is not authorized') ? (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-left">
                <h4 className="font-medium text-amber-800 mb-2">🔧 Setup Required</h4>
                <div className="text-sm text-amber-700 space-y-1">
                  <p>• Go to <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="underline">Google Cloud Console</a></p>
                  <p>• Enable <strong>Maps JavaScript API</strong> and <strong>Geocoding API</strong></p>
                  <p>• Update the API key restrictions if needed</p>
                </div>
                <p className="text-xs text-amber-600 mt-2">
                  The map will work with fallback coordinates for common destinations
                </p>
              </div>
            ) : (
              <div className="text-xs text-gray-500 mt-1 bg-gray-50 p-2 rounded border-l-4 border-gray-300">
                {error}
              </div>
            )}
            
            {/* Show basic destination info even when map fails */}
            {destination && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">{destination}</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {showLocationInfo && locationInfo && (
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-gray-900">{destination}</h3>
                <p className="text-sm text-gray-600">{locationInfo.formattedAddress}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="text-sm text-gray-600">Loading map...</span>
              </div>
            </div>
          )}
          
          {/* Map Name Overlay */}
          <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg shadow-sm border border-gray-200">
            <span className="text-sm font-medium text-gray-700">{destination}</span>
          </div>
          
          <div 
            ref={mapRef} 
            style={{ height }} 
            className="w-full rounded-b-lg relative google-map-container"
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleMap;