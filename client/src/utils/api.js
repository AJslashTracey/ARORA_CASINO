// Secure API utility with proper headers and error handling
// In production (same origin), use '/api'. In dev, Vite proxies /api to the server.
const API_BASE = import.meta.env.VITE_API_URL || '/api';

if (import.meta.env.DEV) {
  console.log('API_BASE:', API_BASE);
}

const secureHeaders = {
  'Content-Type': 'application/json',
  'X-Requested-With': 'XMLHttpRequest',
};

export const apiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: secureHeaders,
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Request failed:', error);
    throw error;
  }
};

export const signup = (userData) => apiRequest('/signup', {
  method: 'POST',
  body: userData,
});

export const signin = (credentials) => apiRequest('/signin', {
  method: 'POST', 
  body: credentials,
});
