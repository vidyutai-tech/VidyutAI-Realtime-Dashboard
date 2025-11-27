
import React, { useState } from 'react';
import { ArrowLeft, LogIn } from 'lucide-react';
import { apiLogin, User } from '../services/api';

interface LoginPageProps {
  onLogin: (user: User, token: string) => void;
  onBack?: () => void;
  onSignupClick?: () => void;
  showSignupSuccess?: boolean;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onBack, onSignupClick, showSignupSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { token, user } = await apiLogin(email, password);
      // Fix: Login function expects (user, token) not (token, user)
      onLogin(user, token);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
        )}
        
        <div className="text-center">
          {/* SPEL | VidyutAI Logos */}
          {/* <div className="flex justify-center items-end space-x-4 mb-6">
            <img src="/Spel.png" alt="SPEL" className="h-16 w-auto object-contain mb-1" />
            <span className="text-3xl text-gray-300 dark:text-gray-600 font-light mb-2">|</span>
            <img src="/VidyutAI Logo.png" alt="VidyutAI" className="h-24 w-auto object-contain" />
          </div> */}
          <div className="flex flex-col items-center mb-6">
            <img
              src="/VidyutAI Logo.png"
              alt="VidyutAI"
              className="h-20 w-auto object-contain"
            />
          </div>

          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">VidyutAI Dashboard</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Next-Generation Energy Management System</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password-sr" className="sr-only">Password</label>
              <input
                id="password-sr"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-500 dark:placeholder-gray-400 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
                    </div>
                  </div>

                  {showSignupSuccess && (
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                      <p className="text-sm text-green-800 dark:text-green-400">
                        ✓ Account created successfully! Please login with your credentials.
                      </p>
                    </div>
                  )}

                  {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                  <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <LogIn className="h-5 w-5 text-blue-300 group-hover:text-blue-200" aria-hidden="true" />
              </span>
                      {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                  </div>

                  {/* Link to Signup */}
                  {onSignupClick && (
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={onSignupClick}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 font-medium"
                      >
                        Don't have an account? Sign up
                      </button>
                    </div>
                  )}
                </form>

                {/* Footer with IITGN Logo */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col items-center space-y-2">
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Developed at
            </div>
            <img 
              src="/IITGN_logo.webp" 
              alt="IIT Gandhinagar" 
              className="h-8 w-auto opacity-80 hover:opacity-100 transition-opacity"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
