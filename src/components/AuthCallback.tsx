import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

const AuthCallback: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (data.session) {
          setIsSuccess(true);
          setMessage('Email verified successfully! You are now logged in.');
          
          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/');
          }, 2000);
        } else {
          // Try to handle the auth callback from URL parameters
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              throw sessionError;
            }
            
            setIsSuccess(true);
            setMessage('Email verified successfully! You are now logged in.');
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              navigate('/');
            }, 2000);
          } else {
            throw new Error('No valid session found');
          }
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setIsSuccess(false);
        setMessage(error instanceof Error ? error.message : 'Failed to verify email');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="relative z-10 w-full max-w-md mx-auto flex flex-col items-center text-center py-16 px-4">
        <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl">
          {loading ? (
            <div className="flex flex-col items-center">
              <Loader className="w-16 h-16 text-white animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Verifying Email...</h2>
              <p className="text-white/80">Please wait while we verify your email address.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              {isSuccess ? (
                <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
              ) : (
                <XCircle className="w-16 h-16 text-red-400 mb-4" />
              )}
              <h2 className="text-2xl font-bold text-white mb-4">
                {isSuccess ? 'Email Verified!' : 'Verification Failed'}
              </h2>
              <p className="text-white/90 text-lg mb-6">{message}</p>
              {isSuccess ? (
                <p className="text-white/70 text-sm">Redirecting to dashboard...</p>
              ) : (
                <p className="text-white/70 text-sm">Redirecting to login...</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
