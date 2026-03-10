import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Solo administrador puede ver el contenido; si no, redirige a home. */
export default function AdminOnlyRoute({ children }) {
  const { user } = useAuth()
  if (!user || user.role !== 'administrador') {
    return <Navigate to="/" replace />
  }
  return children
}
