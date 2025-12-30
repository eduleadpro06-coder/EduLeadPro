import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthRedirectUrl } from '@/lib/auth-utils'

export type AuthUser = {
  id: string
  email: string | null
  displayName: string | null
  avatarUrl?: string | null
  organizationId?: number | null
  organizationName?: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean; requiresOtp?: boolean; email?: string; userId?: number }>
  signUp: (email: string, password: string, fullName?: string, organizationName?: string) => Promise<{ error?: string; pendingConfirmation?: boolean }>
  resendConfirmation: (email: string) => Promise<{ error?: string }>
  signInWithGoogle: () => Promise<{ error?: string }>
  signOut: () => Promise<void>
  sendOTP: (email: string, userId?: number) => Promise<{ error?: string }>
  verifyOTP: (email: string, otp: string, userId?: number) => Promise<{ error?: string }>
}


const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('auth_user');
        return stored ? JSON.parse(stored) : null;
      } catch (e) {
        console.error('Failed to parse stored user data:', e);
        return null;
      }
    }
    return null;
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      try {
        // Handle URL hash parameters for email confirmation
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const error = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');

          if (error) {
            console.error('Auth error from URL:', error, errorDescription);
            // Clear the hash to prevent repeated error messages
            window.history.replaceState(null, '', window.location.pathname);

            // Show user-friendly error message
            if (error === 'access_denied' && errorDescription?.includes('expired')) {
              console.warn('Email confirmation link has expired');
            }
          }
        }

        // Prime state from storage but do NOT end loading yet; wait for INITIAL_SESSION
        const { data } = await supabase.auth.getSession()

        // Check for custom auth session in localStorage
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } catch (e) {
            console.error('Failed to parse stored user data:', e);
            localStorage.removeItem('auth_user');
          }
        } else if (data.session?.user) {
          // Fallback to Supabase session (for Google OAuth)
          const sessionUser = data.session?.user
          setUser(sessionUser ? {
            id: sessionUser.id,
            email: sessionUser.email ?? null,
            displayName: (sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.preferred_username || null),
            avatarUrl: sessionUser.user_metadata?.avatar_url || null,
          } : null)
        }
      } catch (error) {
        console.error("Auth initialization error:", error)
        setUser(null)
        // Do not set loading false here; rely on INITIAL_SESSION below
      }
    }

    setLoading(true)
    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        const sessionUser = session?.user

        console.log('=== AUTH STATE CHANGE ===');
        console.log('Event:', event);
        console.log('Session User:', sessionUser);
        console.log('App Metadata:', sessionUser?.app_metadata);
        console.log('User Metadata:', sessionUser?.user_metadata);

        if (sessionUser) {
          // Check if this is a Google OAuth user - multiple ways to detect
          const isGoogleUser =
            sessionUser.app_metadata?.provider === 'google' ||
            sessionUser.app_metadata?.providers?.includes('google') ||
            (sessionUser.email && !localStorage.getItem('auth_user')); // If no custom auth session exists

          console.log('Is Google User?', isGoogleUser);
          console.log('Detection method:', {
            provider: sessionUser.app_metadata?.provider,
            providers: sessionUser.app_metadata?.providers,
            hasCustomAuth: !!localStorage.getItem('auth_user')
          });

          if (isGoogleUser) {
            console.log('Processing Google user...');
            // Check if user exists in our custom backend
            try {
              console.log('Calling /api/auth/check-google-user...');
              const checkResponse = await fetch('/api/auth/check-google-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: sessionUser.email,
                  name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email
                })
              });

              console.log('Response status:', checkResponse.status);

              if (checkResponse.ok) {
                const userData = await checkResponse.json();
                console.log('User data from backend:', userData);

                // User exists with organization
                setUser({
                  id: sessionUser.id,
                  email: sessionUser.email ?? null,
                  displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.preferred_username || null,
                  avatarUrl: sessionUser.user_metadata?.avatar_url || null,
                  organizationId: userData.organizationId,
                  organizationName: userData.organizationName
                });

                // Store in localStorage
                localStorage.setItem('auth_user', JSON.stringify({
                  id: sessionUser.id,
                  email: sessionUser.email,
                  displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
                  organizationId: userData.organizationId,
                  organizationName: userData.organizationName
                }));

                console.log('Successfully set user with organization:', userData.organizationName);
              } else {
                const errorText = await checkResponse.text();
                console.error('API error:', errorText);
              }
            } catch (error) {
              console.error('Error checking Google user:', error);
              // Fallback to basic user without organization
              setUser({
                id: sessionUser.id,
                email: sessionUser.email ?? null,
                displayName: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.preferred_username || null,
                avatarUrl: sessionUser.user_metadata?.avatar_url || null,
              });
            }
          } else {
            console.log('Not a Google user, using standard auth');
            // Custom auth user (already has organization from login)
            setUser(sessionUser ? {
              id: sessionUser.id,
              email: sessionUser.email ?? null,
              displayName: (sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.user_metadata?.display_name || sessionUser.user_metadata?.preferred_username || null),
              avatarUrl: sessionUser.user_metadata?.avatar_url || null,
            } : null);
          }
        } else {
          console.log('No session user');
          // Fix: Do not clear user if custom auth session exists in localStorage
          const storedUser = localStorage.getItem('auth_user');
          if (!storedUser) {
            setUser(null);
          }
        }

        // End loading once we receive the initial snapshot from Supabase
        if (event === 'INITIAL_SESSION') {
          setLoading(false)
        }

        // Handle successful email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('Email confirmed successfully');
          // Clear any error hash parameters
          if (typeof window !== 'undefined' && window.location.hash.includes('error')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          // Show success message for email confirmation
          if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
            // This indicates the user just confirmed their email
            setTimeout(() => {
              const event = new CustomEvent('emailConfirmed', {
                detail: { message: 'Email confirmed successfully! You can now sign in.' }
              });
              window.dispatchEvent(event);
            }, 1000);
          }
        }

        if (event === 'SIGNED_OUT') {
          setLoading(false)
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        setUser(null)
        setLoading(false)
      }
    })

    init()

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: async (email: string, password: string) => {
      try {
        // Call custom backend login endpoint
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: email, // Using email as username
            password
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { error: data.message || 'Login failed', needsConfirmation: false };
        }

        // Check if OTP is required
        if (data.requiresOtp) {
          return {
            requiresOtp: true,
            email: data.email,
            userId: data.userId
          };
        }

        // Old flow - direct login without OTP (for backward compatibility)
        if (data.user) {
          const userData: AuthUser = {
            id: data.user.id.toString(),
            email: data.user.email,
            displayName: data.user.username,
            organizationId: data.user.organizationId,
            organizationName: data.user.organizationName
          };

          localStorage.setItem('auth_user', JSON.stringify(userData));
          setUser(userData);
        }

        return {};
      } catch (error) {
        console.error('Login error:', error);
        return { error: 'Network error during login', needsConfirmation: false };
      }
    },
    signUp: async (email: string, password: string, fullName?: string, organizationName?: string) => {
      try {
        // Call custom backend signup endpoint
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: email, // Using email as username for consistency
            password,
            email,
            organizationName: organizationName || 'My Organization' // Require organization name
          })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { error: data.message || 'Signup failed' };
        }

        // Success - no email confirmation needed for custom auth
        return { pendingConfirmation: false };
      } catch (error) {
        console.error('Signup error:', error);
        return { error: 'Network error during signup' };
      }
    },
    resendConfirmation: async (email: string) => {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/login'),
        },
      })
      if (error) return { error: error.message }
      return {}
    },
    signInWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getAuthRedirectUrl('/auth/callback'),
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })
      // Supabase OAuth will populate user.user_metadata with name & avatar_url
      if (error) return { error: error.message }
      return {}
    },
    sendOTP: async (email: string, userId?: number) => {
      try {
        const response = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, userId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { error: data.message || 'Failed to send OTP' };
        }

        return {};
      } catch (error) {
        console.error('Send OTP error:', error);
        return { error: 'Network error while sending OTP' };
      }
    },
    verifyOTP: async (email: string, otp: string, userId?: number) => {
      try {
        const response = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token: otp, userId })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          return { error: data.message || 'Invalid or expired OTP' };
        }

        // Set user data on successful verification
        if (data.user) {
          const userData: AuthUser = {
            id: data.user.id.toString(),
            email: data.user.email,
            displayName: data.user.username,
            organizationId: data.user.organizationId,
            organizationName: data.user.organizationName
          };

          localStorage.setItem('auth_user', JSON.stringify(userData));
          setUser(userData);
        }

        return {};
      } catch (error) {
        console.error('Verify OTP error:', error);
        return { error: 'Network error while verifying OTP' };
      }
    },
    signOut: async () => {
      // Clear custom auth session
      localStorage.removeItem('auth_user');
      setUser(null);

      // Also sign out from Supabase if there's a session (for Google OAuth)
      await supabase.auth.signOut();
    },
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}