import { ComponentType } from 'react'
import { Redirect } from 'wouter'
import { useAuth } from '@/contexts/AuthContext'

export default function ProtectedRoute({ component: Comp }: { component: ComponentType<any> }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Redirect to="/login" />
  return <Comp />
}