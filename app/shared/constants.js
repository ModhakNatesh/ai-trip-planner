// Constants shared between client and server

export const TRIP_STATUSES = {
  PLANNING: 'planning',
  PLANNED: 'planned',
  IN_PROGRESS: 'in-progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const TRAVEL_STYLES = {
  BUDGET: 'budget',
  MID_RANGE: 'mid-range',
  LUXURY: 'luxury',
  BACKPACKING: 'backpacking',
  FAMILY: 'family',
  SOLO: 'solo',
  BUSINESS: 'business',
  ADVENTURE: 'adventure'
};

export const BUDGET_RANGES = {
  UNDER_500: 'under-500',
  RANGE_500_1000: '500-1000',
  RANGE_1000_2500: '1000-2500',
  RANGE_2500_5000: '2500-5000',
  OVER_5000: 'over-5000'
};

export const INTERESTS = [
  'Adventure',
  'Architecture',
  'Art',
  'Beaches',
  'Cities',
  'Culture',
  'Food',
  'History',
  'Mountains',
  'Museums',
  'Nature',
  'Nightlife',
  'Photography',
  'Shopping',
  'Sports',
  'Wildlife'
];

export const CURRENCIES = {
  USD: { code: 'USD', symbol: '$', name: 'US Dollar' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
};

export const API_ENDPOINTS = {
  AUTH: {
    VERIFY_TOKEN: '/api/auth/verify-token',
    GET_USER: '/api/auth/user',
    UPDATE_USER: '/api/auth/user'
  },
  TRIPS: {
    GET_ALL: '/api/trips',
    CREATE: '/api/trips',
    GET_BY_ID: (id) => `/api/trips/${id}`,
    UPDATE: (id) => `/api/trips/${id}`,
    DELETE: (id) => `/api/trips/${id}`,
    GENERATE_ITINERARY: (id) => `/api/trips/${id}/generate-itinerary`
  },
  GENERAL: {
    HELLO: '/api/hello',
    STATUS: '/api/status',
    HEALTH: '/health'
  }
};

export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  FORBIDDEN: 'Access denied.',
  NOT_FOUND: 'The requested resource was not found.',
  SERVER_ERROR: 'Internal server error. Please try again later.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  RATE_LIMIT: 'Too many requests. Please wait before trying again.'
};

export const SUCCESS_MESSAGES = {
  TRIP_CREATED: 'Trip created successfully!',
  TRIP_UPDATED: 'Trip updated successfully!',
  TRIP_DELETED: 'Trip deleted successfully!',
  ITINERARY_GENERATED: 'Itinerary generated successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};