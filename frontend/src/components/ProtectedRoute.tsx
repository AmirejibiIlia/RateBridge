import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface Props {
  children: React.ReactNode
  superAdminOnly?: boolean
}

export default function ProtectedRoute({ children, superAdminOnly = false }: Props) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (superAdminOnly && !user.is_super_admin) return <Navigate to="/dashboard" replace />

  return <>{children}</>
}
