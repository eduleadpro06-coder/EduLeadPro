import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (errorParam) {
          // Handle errors from Supabase
          let errorMessage = 'Authentication failed';
          
          if (errorParam === 'access_denied') {
            if (errorDescription?.includes('expired')) {
              errorMessage = 'Email confirmation link has expired. Please request a new one.';
            } else {
              errorMessage = 'Email confirmation was denied or invalid.';
            }
          }
          
          setError(errorMessage);
          toast({
            title: "Authentication Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          // Redirect to login page after showing error
          setTimeout(() => {
            setLocation('/login');
          }, 3000);
          return;
        }

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            toast({
              title: "Email Confirmed!",
              description: "Your email has been successfully confirmed. Welcome!",
            });
            
            // Redirect to dashboard
            setLocation('/dashboard');
          } else {
            throw new Error('No session created after email confirmation');
          }
        } else {
          // Try to get session from URL (fallback)
          const { data, error: sessionError } = await supabase.auth.getSessionFromUrl();
          
          if (sessionError) {
            throw sessionError;
          }

          if (data.session) {
            toast({
              title: "Email Confirmed!",
              description: "Your email has been successfully confirmed. Welcome!",
            });
            
            setLocation('/dashboard');
          } else {
            // No tokens found, redirect to login
            setLocation('/login');
          }
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast({
          title: "Authentication Error",
          description: err.message || 'Something went wrong during authentication',
          variant: "destructive"
        });
        
        // Redirect to login after error
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [setLocation, toast]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Confirming your email...</h2>
          <p className="text-gray-600">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login page...</p>
        </div>
      </div>
    );
  }

  return null;
}