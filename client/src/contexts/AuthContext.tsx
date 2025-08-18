import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

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
      const { data } = await supabase.auth.getSession()
      const sessionUser = data.session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null)
      setLoading(false)
    }
    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user
      setUser(sessionUser ? { id: sessionUser.id, email: sessionUser.email } : null)
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
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
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
          emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
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