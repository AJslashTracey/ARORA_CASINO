import { useState } from 'react';
import { Link } from 'react-router-dom';
import { validateEmail, validateUsername, validatePassword, validateAddress, sanitizeInput, isAddressVerificationSupported } from './utils/validation';
import { LoadingSpinner } from './components/Loading';
import { signup } from './utils/api';

export default function SignUp({ onSignUp }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!validateUsername(username)) {
      errors.username = 'Username must be 3-20 characters, alphanumeric only';
    }
    if (!validateEmail(email)) {
      errors.email = 'Please use a valid, non-disposable email address. Temporary email services are not allowed.';
    }
    if (!validatePassword(password)) {
      errors.password = 'Password must be 8+ characters with uppercase, lowercase, and number';
    }
    
    // Validate address
    const addressValidation = validateAddress({ street, city, postalCode, country });
    if (!addressValidation.isValid) {
      Object.assign(errors, addressValidation.errors);
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting signup with data:', { username, email, street, city, postalCode, country });
      const userData = await signup({ 
        username: sanitizeInput(username), 
        email: sanitizeInput(email), 
        password,
        street: sanitizeInput(street),
        city: sanitizeInput(city),
        postalCode: sanitizeInput(postalCode),
        country: sanitizeInput(country)
      });
      
      // Log in the user directly after signup (no email verification needed)
      if (onSignUp) {
        onSignUp(userData);
      }

    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to connect to server. Please check if the server is running.');
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0 mt-10">
      <div className="w-full bg-[rgb(var(--bg-rgb)/0.8)] rounded-lg shadow border border-[rgb(var(--fg-rgb)/0.1)] md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <h1 className="text-xl font-bold leading-tight tracking-tight md:text-2xl">
            Create an account
          </h1>
          <form className="space-y-4 md:space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block mb-2 text-sm font-medium">Your username</label>
              <input
                type="text"
                name="username"
                id="username"
                className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.username ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                }`}
                placeholder="coolgamer42"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
              {validationErrors.username && <p className="text-xs text-red-500 mt-1">{validationErrors.username}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block mb-2 text-sm font-medium">Your email</label>
              <input
                type="email"
                name="email"
                id="email"
                className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.email ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                }`}
                placeholder="name@company.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              {validationErrors.email && <p className="text-xs text-red-500 mt-1">{validationErrors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block mb-2 text-sm font-medium">Password</label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.password ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                }`}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              {validationErrors.password && <p className="text-xs text-red-500 mt-1">{validationErrors.password}</p>}
            </div>
            
            <div className="border-t border-[rgb(var(--fg-rgb)/0.2)] pt-4 mt-4">
              <h3 className="text-lg font-semibold mb-4">Address Information</h3>
              {isAddressVerificationSupported(country) && (
                <div className="mb-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-sm text-blue-300">
                    ℹ️ Address will be verified using official postal data for {country || 'your country'}
                  </p>
                </div>
              )}
              
              <div className="mb-4">
                <label htmlFor="street" className="block mb-2 text-sm font-medium">Street Address</label>
                <input
                  type="text"
                  name="street"
                  id="street"
                  className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.street ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                  }`}
                  placeholder="123 Main Street"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.street && <p className="text-xs text-red-500 mt-1">{validationErrors.street}</p>}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="city" className="block mb-2 text-sm font-medium">City</label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.city ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                    }`}
                    placeholder="New York"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    disabled={isLoading}
                  />
                  {validationErrors.city && <p className="text-xs text-red-500 mt-1">{validationErrors.city}</p>}
                </div>
                
                <div>
                  <label htmlFor="postalCode" className="block mb-2 text-sm font-medium">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    id="postalCode"
                    className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.postalCode ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                    }`}
                    placeholder="10001"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    disabled={isLoading}
                  />
                  {validationErrors.postalCode && <p className="text-xs text-red-500 mt-1">{validationErrors.postalCode}</p>}
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="country" className="block mb-2 text-sm font-medium">Country</label>
                <input
                  type="text"
                  name="country"
                  id="country"
                  className={`border sm:text-sm rounded-lg block w-full p-2.5 bg-[rgb(var(--bg-rgb)/0.5)] placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 ${
                    validationErrors.country ? 'border-red-500' : 'border-[rgb(var(--fg-rgb)/0.2)]'
                  }`}
                  placeholder="United States"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  disabled={isLoading}
                />
                {validationErrors.country && <p className="text-xs text-red-500 mt-1">{validationErrors.country}</p>}
              </div>
            </div>
            
            {error && <p className="text-sm font-light text-red-500">{error}</p>}
            <button
              type="submit"
              className="w-full btn-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading && <LoadingSpinner size="sm" />}
              {isLoading ? 'Creating account...' : 'Create an account'}
            </button>
            <p className="text-sm font-light text-gray-400">
              Already have an account? <Link to="/signin" className="font-medium text-primary-500 hover:underline">Login here</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
