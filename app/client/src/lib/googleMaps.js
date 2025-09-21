/**
 * Utility to load Google Maps JavaScript API
 */

let isScriptLoaded = false;
let isScriptLoading = false;
let scriptPromise = null;

export const loadGoogleMapsScript = () => {
  if (isScriptLoaded) {
    return Promise.resolve();
  }

  if (isScriptLoading) {
    return scriptPromise;
  }

  isScriptLoading = true;
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    const error = new Error('Google Maps API key is not configured. Please add VITE_GOOGLE_MAPS_API_KEY to your .env file.');
    console.error(error.message);
    return Promise.reject(error);
  }

  scriptPromise = new Promise((resolve, reject) => {
    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      isScriptLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
    };

    script.onerror = () => {
      isScriptLoading = false;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return scriptPromise;
};

/**
 * Geocode a location string to get latitude and longitude
 * With fallback to a basic coordinate estimation for common cities
 */
export const geocodeLocation = (location) => {
  return new Promise((resolve, reject) => {
    if (!window.google || !window.google.maps) {
      reject(new Error('Google Maps API not loaded'));
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: location }, (results, status) => {
      if (status === 'OK' && results && results.length > 0) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address
        });
      } else {
        // If geocoding fails, try to use fallback coordinates for common destinations
        const fallbackCoords = getFallbackCoordinates(location);
        if (fallbackCoords) {
          console.warn(`Geocoding failed (${status}), using fallback coordinates for ${location}`);
          resolve(fallbackCoords);
        } else {
          reject(new Error(`Geocoding failed: ${status}. Please enable Geocoding API in Google Cloud Console.`));
        }
      }
    });
  });
};

/**
 * Fallback coordinates for common destinations when geocoding fails
 * Now includes viewport bounds for better area visualization
 */
const getFallbackCoordinates = (location) => {
  const normalizedLocation = location.toLowerCase().trim();
  
  const fallbackCoords = {
    // Major Cities with viewport bounds
    'paris': { 
      lat: 48.8566, 
      lng: 2.3522, 
      formattedAddress: 'Paris, France',
      viewport: { north: 48.9021, south: 48.8155, east: 2.4699, west: 2.2243 }
    },
    'paris, france': { 
      lat: 48.8566, 
      lng: 2.3522, 
      formattedAddress: 'Paris, France',
      viewport: { north: 48.9021, south: 48.8155, east: 2.4699, west: 2.2243 }
    },
    'london': { 
      lat: 51.5074, 
      lng: -0.1278, 
      formattedAddress: 'London, UK',
      viewport: { north: 51.6723, south: 51.2868, east: 0.3340, west: -0.5103 }
    },
    'london, uk': { 
      lat: 51.5074, 
      lng: -0.1278, 
      formattedAddress: 'London, UK',
      viewport: { north: 51.6723, south: 51.2868, east: 0.3340, west: -0.5103 }
    },
    'new york': { 
      lat: 40.7128, 
      lng: -74.0060, 
      formattedAddress: 'New York, NY, USA',
      viewport: { north: 40.9175, south: 40.4774, east: -73.7004, west: -74.2591 }
    },
    'new york, usa': { 
      lat: 40.7128, 
      lng: -74.0060, 
      formattedAddress: 'New York, NY, USA',
      viewport: { north: 40.9175, south: 40.4774, east: -73.7004, west: -74.2591 }
    },
    'tokyo': { 
      lat: 35.6762, 
      lng: 139.6503, 
      formattedAddress: 'Tokyo, Japan',
      viewport: { north: 35.8986, south: 35.4531, east: 139.9691, west: 139.3314 }
    },
    'tokyo, japan': { 
      lat: 35.6762, 
      lng: 139.6503, 
      formattedAddress: 'Tokyo, Japan',
      viewport: { north: 35.8986, south: 35.4531, east: 139.9691, west: 139.3314 }
    },
    'berlin': { 
      lat: 52.5200, 
      lng: 13.4050, 
      formattedAddress: 'Berlin, Germany',
      viewport: { north: 52.6755, south: 52.3382, east: 13.7611, west: 13.0884 }
    },
    'berlin, germany': { 
      lat: 52.5200, 
      lng: 13.4050, 
      formattedAddress: 'Berlin, Germany',
      viewport: { north: 52.6755, south: 52.3382, east: 13.7611, west: 13.0884 }
    },
    'germany': {
      lat: 51.1657, 
      lng: 10.4515, 
      formattedAddress: 'Germany',
      viewport: { north: 55.0581, south: 47.2701, east: 15.0419, west: 5.8663 }
    },
    
    // Indian Cities and Country with viewport bounds
    'bengaluru': { 
      lat: 12.9716, 
      lng: 77.5946, 
      formattedAddress: 'Bengaluru, Karnataka, India',
      viewport: { north: 13.1394, south: 12.7343, east: 77.8820, west: 77.3826 }
    },
    'bangalore': { 
      lat: 12.9716, 
      lng: 77.5946, 
      formattedAddress: 'Bengaluru, Karnataka, India',
      viewport: { north: 13.1394, south: 12.7343, east: 77.8820, west: 77.3826 }
    },
    'mumbai': { 
      lat: 19.0760, 
      lng: 72.8777, 
      formattedAddress: 'Mumbai, Maharashtra, India',
      viewport: { north: 19.2695, south: 18.8930, east: 72.9781, west: 72.7774 }
    },
    'delhi': { 
      lat: 28.6139, 
      lng: 77.2090, 
      formattedAddress: 'New Delhi, India',
      viewport: { north: 28.8836, south: 28.4043, east: 77.3466, west: 77.1025 }
    },
    'new delhi': { 
      lat: 28.6139, 
      lng: 77.2090, 
      formattedAddress: 'New Delhi, India',
      viewport: { north: 28.8836, south: 28.4043, east: 77.3466, west: 77.1025 }
    },
    'chennai': { 
      lat: 13.0827, 
      lng: 80.2707, 
      formattedAddress: 'Chennai, Tamil Nadu, India',
      viewport: { north: 13.2544, south: 12.8349, east: 80.3231, west: 80.1671 }
    },
    'hyderabad': { 
      lat: 17.3850, 
      lng: 78.4867, 
      formattedAddress: 'Hyderabad, Telangana, India',
      viewport: { north: 17.5562, south: 17.2146, east: 78.6490, west: 78.2249 }
    },
    'pune': { 
      lat: 18.5204, 
      lng: 73.8567, 
      formattedAddress: 'Pune, Maharashtra, India',
      viewport: { north: 18.6369, south: 18.4088, east: 73.9673, west: 73.7394 }
    },
    'goa': { 
      lat: 15.2993, 
      lng: 74.1240, 
      formattedAddress: 'Goa, India',
      viewport: { north: 15.8081, south: 14.8973, east: 74.3132, west: 73.7802 }
    },
    // Full India country view
    'india': {
      lat: 20.5937, 
      lng: 78.9629, 
      formattedAddress: 'India',
      viewport: { north: 37.6, south: 6.4, east: 97.25, west: 68.7 }
    }
  };
  
  // Try exact match first
  if (fallbackCoords[normalizedLocation]) {
    return fallbackCoords[normalizedLocation];
  }
  
  // For any Indian destination, show full India view if it contains "india" or common Indian city patterns
  const indianCities = ['bengaluru', 'bangalore', 'mumbai', 'delhi', 'chennai', 'hyderabad', 'pune', 'goa', 'kolkata', 'jaipur', 'ahmedabad', 'kochi'];
  const isIndianDestination = normalizedLocation.includes('india') || 
                             indianCities.some(city => normalizedLocation.includes(city)) ||
                             normalizedLocation.includes('bengal') ||
                             normalizedLocation.includes('karnataka') ||
                             normalizedLocation.includes('maharashtra') ||
                             normalizedLocation.includes('tamil nadu') ||
                             normalizedLocation.includes('kerala') ||
                             normalizedLocation.includes('rajasthan') ||
                             normalizedLocation.includes('gujarat');
  
  if (isIndianDestination) {
    // Return full India view for any Indian destination
    return {
      lat: 20.5937, 
      lng: 78.9629, 
      formattedAddress: `${location} (India)`,
      viewport: { north: 37.6, south: 6.4, east: 97.25, west: 68.7 },
      showFullCountry: true
    };
  }
  
  // Try partial match for other destinations
  for (const key in fallbackCoords) {
    if (normalizedLocation.includes(key) || key.includes(normalizedLocation)) {
      return fallbackCoords[key];
    }
  }
  
  return null;
};