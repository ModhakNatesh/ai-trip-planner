// Validation utilities shared between client and server
import validator from 'validator';

export const validateEmail = (email) => {
  if (!email) return { isValid: false, error: 'Email is required' };
  if (!validator.isEmail(email)) return { isValid: false, error: 'Invalid email format' };
  return { isValid: true };
};

export const validatePassword = (password) => {
  if (!password) return { isValid: false, error: 'Password is required' };
  if (password.length < 6) return { isValid: false, error: 'Password must be at least 6 characters' };
  return { isValid: true };
};

export const validateTripData = (tripData) => {
  const errors = [];

  if (!tripData.destination || tripData.destination.trim().length < 2) {
    errors.push('Destination must be at least 2 characters long');
  }

  if (!tripData.startDate) {
    errors.push('Start date is required');
  }

  if (!tripData.endDate) {
    errors.push('End date is required');
  }

  if (tripData.startDate && tripData.endDate) {
    const startDate = new Date(tripData.startDate);
    const endDate = new Date(tripData.endDate);
    
    if (startDate >= endDate) {
      errors.push('End date must be after start date');
    }

    if (startDate < new Date()) {
      errors.push('Start date cannot be in the past');
    }
  }

  if (tripData.budget && (tripData.budget < 0 || tripData.budget > 1000000)) {
    errors.push('Budget must be between 0 and 1,000,000');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUserData = (userData) => {
  const errors = [];

  if (userData.name && userData.name.trim().length < 2) {
    errors.push('Name must be at least 2 characters long');
  }

  if (userData.email) {
    const emailValidation = validateEmail(userData.email);
    if (!emailValidation.isValid) {
      errors.push(emailValidation.error);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};