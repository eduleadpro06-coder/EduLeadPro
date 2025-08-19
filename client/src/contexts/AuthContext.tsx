import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getAuthRedirectUrl } from '@/lib/auth-utils'

export type AuthUser = {
  id: string
  email: string | null
}

type AuthContextValue = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; needsConfirmation?: boolean }>
  signUp: (email: string, password: string) => Promise<{ error?: string; pendingConfirmation?: boolean }>
  resendConfirmation: (email: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
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

        const { data } = await supabase.auth.getSession()
        const sessionUser = data.session?.user
        setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null)
      } catch (error) {
        console.error("Auth initialization error:", error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      try {
        const sessionUser = session?.user
        setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null)
        
        // Handle successful email confirmation
        if (event === 'SIGNED_IN' && session?.user?.email_confirmed_at) {
          console.log('Email confirmed successfully');
          // Clear any error hash parameters
          if (typeof window !== 'undefined' && window.location.hash.includes('error')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } catch (error) {
        console.error("Auth state change error:", error)
        setUser(null)
      }
    })

    return () => {
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        // If email is not confirmed, Supabase often returns specific auth errors
        const msg = error.message || "Login failed"
        const needsConfirmation = /confirm|verification|confirmed/i.test(msg)
        return { error: msg, needsConfirmation }
      }
      if (!data.session) {
        return { error: "No active session. Please try again." }
      }
      return {}
    },
    signUp: async (email: string, password: string) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl('/login'),
        },
      })
      if (error) return { error: error.message }
      // If email confirmation is enabled, data.user is created and confirmation is pending
      const pendingConfirmation = !!data.user && !data.session
      return { pendingConfirmation }
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
    signOut: async () => {
      await supabase.auth.signOut()
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