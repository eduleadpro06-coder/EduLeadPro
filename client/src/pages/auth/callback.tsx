import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Setup state
  const [setupRequired, setSetupRequired] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [userData, setUserData] = useState<{ email: string, name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle hash parameters (Supabase OAuth redirect)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (errorParam) {
          let errorMessage = 'Authentication failed';
          if (errorParam === 'access_denied') {
            errorMessage = errorDescription?.includes('expired')
              ? 'Link expired.'
              : 'Access denied.';
          }
          throw new Error(errorMessage);
        }

        let sessionUser = null;

        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          if (sessionError) throw sessionError;
          sessionUser = data.session?.user;
        } else {
          // Fallback check
          const { data, error: sessionError } = await supabase.auth.getSession(); // getSessionFromUrl behavior handled by supabase-js? Or getSession for established session.
          // Note: getSessionFromUrl is old v1? v2 uses getSession() after auto-detecting URL.
          // But to be safe, stick to existing pattern or just getSession().
          if (sessionError) throw sessionError;
          sessionUser = data.session?.user;
        }

        if (sessionUser && sessionUser.email) {
          // Sync with Backend
          await checkBackendStatus(sessionUser.email, sessionUser.user_metadata?.full_name || sessionUser.email);
        } else {
          // No session found? Maybe not redirected correctly.
          // Wait a bit or redirect to login.
          throw new Error("No session found.");
        }

      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');
        toast({
          title: "Authentication Error",
          description: err.message,
          variant: "destructive"
        });
        setTimeout(() => setLocation('/login'), 3000);
      } finally {
        if (!setupRequired) setLoading(false);
      }
    };

    handleAuthCallback();
  }, [setLocation, toast]);

  const checkBackendStatus = async (email: string, name: string) => {
    try {
      // Call backend to check/create user
      // We do NOT pass organizationName initially
      const res = await apiRequest("POST", "/api/auth/check-google-user", { email, name });
      const data = await res.json();

      if (data.requiresSetup) {
        setUserData({ email, name });
        setSetupRequired(true);
        setLoading(false); // Stop loading spinner, show form
      } else if (data.userId) {
        // Success
        toast({ title: "Welcome!", description: "Successfully logged in." });
        setLocation('/dashboard');
      } else {
        throw new Error("Unexpected response from server");
      }
    } catch (err) {
      console.error("Backend sync error:", err);
      throw err;
    }
  };

  const handleSetupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !userData) return;

    setSubmitting(true);
    try {
      const res = await apiRequest("POST", "/api/auth/check-google-user", {
        email: userData.email,
        name: userData.name,
        organizationName: orgName.trim()
      });
      const data = await res.json();

      if (data.userId) {
        toast({ title: "Organization Created!", description: "Welcome to your new workspace." });
        setLocation('/dashboard');
      } else {
        throw new Error(data.message || "Failed to create organization");
      }
    } catch (err: any) {
      toast({
        title: "Setup Failed",
        description: err.message || "Could not create organization.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (setupRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle>Complete Setup</CardTitle>
            <CardDescription>
              Please enter a name for your organization to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetupSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="orgName" className="text-sm font-medium text-gray-700">Organization Name</label>
                <Input
                  id="orgName"
                  placeholder="e.g. Sunny Daycare"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Creating..." : "Create Organization & Continue"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <p className="text-sm mt-2">Redirecting...</p>
        </div>
      </div>
    );
  }

  return null;
}