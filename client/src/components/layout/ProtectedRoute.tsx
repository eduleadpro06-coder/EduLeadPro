import { ComponentType } from 'react'
import { Redirect } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ component: Comp }: { component: ComponentType<any> }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-lg text-gray-700">Loading...</p>
        </div>
      </div>
    )
  }
  
  if (!user) return <Redirect to="/login" />
  
  return <Comp />
}