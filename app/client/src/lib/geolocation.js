// Geolocation utility functions
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location access denied by user'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location information is unavailable'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out'));
            break;
          default:
            reject(new Error('An unknown error occurred while retrieving location'));
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  });
};

export const getLocationName = async (latitude, longitude) => {
  try {
    // Using a free geocoding service (OpenStreetMap Nominatim)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'AI-Trip-Planner'
        }
      }
    );
    
    if (!response.ok) {
      throw new Error('Geocoding service unavailable');
    }

    const data = await response.json();
    
    // Extract city, state/region, and country
    const address = data.address;
    const city = address.city || address.town || address.village || address.municipality;
    const state = address.state || address.province || address.region;
    const country = address.country;

    if (city && country) {
      return state ? `${city}, ${state}, ${country}` : `${city}, ${country}`;
    } else if (country) {
      return country;
    } else {
      return 'Unknown Location';
    }
  } catch (error) {
    console.error('Error getting location name:', error);
    return 'Unknown Location';
  }
};

export const getUserLocation = async () => {
  const coords = await getCurrentLocation();
  const locationName = await getLocationName(coords.latitude, coords.longitude);
  
  return {
    ...coords,
    name: locationName
  };
};