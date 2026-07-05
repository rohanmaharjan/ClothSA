import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    // Send them to login, but remember where they were headed
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}