import React from 'react'
import { Navigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

/**
 * Wraps routes that require authentication.
 * Redirects to /login if not authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

export default ProtectedRoute
