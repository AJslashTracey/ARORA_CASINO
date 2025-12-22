import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LoadingSpinner } from './components/Loading';
import { apiRequest } from './utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);
  const hasVerifiedRef = useRef(false);
  
  const verifyEmail = async (token) => {
    try {
      // URL encode the token to handle special characters
      const encodedToken = encodeURIComponent(token);
      const data = await apiRequest(`/verify-email/${encodedToken}`, { method: 'GET' });
      
      setStatus('success');
      setMessage(data.message);
      setUser(data.user);
      
    } catch (error) {
      setStatus('error');
      setMessage(error.message || 'An error occurred during verification. Please try again.');
      console.error('Verification error:', error);
    }
  };

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link. Please check your email and try again.');
      return;
    }

    // React 18 dev StrictMode intentionally runs effects twice.
    // Guard to avoid verifying twice (first call may succeed, second would then see token cleared).
    if (hasVerifiedRef.current) return;
    hasVerifiedRef.current = true;
    
    console.log('Token extracted from URL:', token.substring(0, 20) + '...');
    verifyEmail(token);
  }, [searchParams]);
  
  return (
    <div className="flex flex-col items-center justify-center px-6 py-8 mx-auto lg:py-0 mt-10">
      <div className="w-full bg-[rgb(var(--bg-rgb)/0.8)] rounded-lg shadow border border-[rgb(var(--fg-rgb)/0.1)] md:mt-0 sm:max-w-md xl:p-0">
        <div className="p-6 space-y-4 md:space-y-6 sm:p-8">
          <div className="text-center">
            {status === 'verifying' && (
              <>
                <LoadingSpinner size="lg" />
                <h1 className="text-2xl font-bold mt-4">Verifying Your Email...</h1>
                <p className="text-gray-400 mt-2">Please wait a moment</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <div className="text-6xl mb-4">✅</div>
                <h1 className="text-2xl font-bold text-green-400 mb-4">Email Verified!</h1>
                <p className="text-gray-300 mb-6">{message}</p>
                
                {user && (
                  <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 mb-6">
                    <p className="text-sm">
                      Welcome, <strong className="text-white">{user.username}</strong>! 
                      Your account is now active.
                    </p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <Link 
                    to="/signin" 
                    className="block w-full btn-primary text-center"
                  >
                    Sign In to Your Account
                  </Link>
                  <p className="text-sm text-gray-400">
                    You can now access all games and features!
                  </p>
                </div>
              </>
            )}
            
            {status === 'error' && (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h1 className="text-2xl font-bold text-red-400 mb-4">Verification Failed</h1>
                <p className="text-gray-300 mb-6">{message}</p>
                
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-sm">
                    The verification link may be expired or invalid.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <Link 
                    to="/signup" 
                    className="block w-full btn-primary text-center"
                  >
                    Try Signing Up Again
                  </Link>
                  <p className="text-sm text-gray-400">Or</p>
                  <Link 
                    to="/signin" 
                    className="block text-primary-500 hover:underline"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

