import MailChecker from 'mailchecker';

// Input validation utilities
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return '';
  return input.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
};

export const validateEmail = (email) => {
  const cleanEmail = sanitizeInput(email);
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  // First check basic format
  if (!re.test(cleanEmail)) {
    return false;
  }
  
  // Then check if it's not a disposable email
  return MailChecker.isValid(cleanEmail);
};

export const validateUsername = (username) => {
  const clean = sanitizeInput(username);
  return clean.length >= 3 && clean.length <= 20 && /^[a-zA-Z0-9_]+$/.test(clean);
};

export const validatePassword = (password) => {
  return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
};

// Address validation utilities
export const validateStreet = (street) => {
  const clean = sanitizeInput(street);
  // Street should be at least 5 characters and contain alphanumeric characters
  return clean.length >= 5 && clean.length <= 255 && /^[a-zA-Z0-9\s\-\.,#]+$/.test(clean);
};

export const validateCity = (city) => {
  const clean = sanitizeInput(city);
  // Support international characters (ü, ö, ä, é, etc.) for city names
  // Place hyphen at the end of character class to avoid escape issues
  return clean.length >= 2 && clean.length <= 100 && /^[\p{L}\s'\-]+$/u.test(clean);
};

export const validatePostalCode = (postalCode, country = '') => {
  const clean = sanitizeInput(postalCode);
  
  if (clean.length < 3 || clean.length > 20) {
    return false;
  }
  
  // Basic format validation - alphanumeric with optional spaces and hyphens
  if (!/^[a-zA-Z0-9\s\-]+$/.test(clean)) {
    return false;
  }
  
  // Country-specific validation patterns (common formats)
  const countryPatterns = {
    'US': /^\d{5}(-\d{4})?$/, // US ZIP: 12345 or 12345-6789
    'CA': /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/, // Canadian postal code
    'GB': /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i, // UK postcode
    'DE': /^\d{5}$/, // German postal code (5 digits)
    'FR': /^\d{5}$/, // French postal code (5 digits)
    'IT': /^\d{5}$/, // Italian postal code (5 digits)
    'ES': /^\d{5}$/, // Spanish postal code (5 digits)
    'AU': /^\d{4}$/, // Australian postal code (4 digits)
    'NL': /^\d{4}\s?[A-Z]{2}$/i, // Dutch postal code
  };
  
  // If country is specified and we have a pattern, use it
  if (country && countryPatterns[country.toUpperCase()]) {
    return countryPatterns[country.toUpperCase()].test(clean);
  }
  
  // Otherwise, just check basic format
  return true;
};

export const validateCountry = (country) => {
  const clean = sanitizeInput(country);
  // Country should be 2-100 characters, letters and spaces only
  return clean.length >= 2 && clean.length <= 100 && /^[a-zA-Z\s]+$/.test(clean);
};

export const validateAddress = (address) => {
  const { street, city, postalCode, country } = address;
  
  const errors = {};
  
  if (!validateStreet(street)) {
    errors.street = 'Street address must be 5-255 characters and contain valid characters';
  }
  
  if (!validateCity(city)) {
    errors.city = 'City must be 2-100 characters and contain only letters';
  }
  
  if (!validatePostalCode(postalCode, country)) {
    errors.postalCode = 'Postal code format is invalid for this country';
  }
  
  if (!validateCountry(country)) {
    errors.country = 'Country must be 2-100 characters and contain only letters';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Check if country is supported by OpenPLZ API
export const isAddressVerificationSupported = (country) => {
  const supportedCountries = ['germany', 'deutschland', 'austria', 'österreich', 'switzerland', 'schweiz', 'liechtenstein'];
  return supportedCountries.includes(country.toLowerCase());
};
