import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import useThemeStore from './store/themeStore'
import useAuthStore from './store/authStore'

// Auth pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'

// App pages
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import WarehousePage from './pages/WarehousePage'
import LocationsPage from './pages/LocationsPage'
import ReceiptsPage from './pages/ReceiptsPage'
import ReceiptDetailPage from './pages/ReceiptDetailPage'
import DeliveriesPage from './pages/DeliveriesPage'
import DeliveryDetailPage from './pages/DeliveryDetailPage'
import TransfersPage from './pages/TransfersPage'
import TransferDetailPage from './pages/TransferDetailPage'
import AdjustmentsPage from './pages/AdjustmentsPage'
import MoveHistoryPage from './pages/MoveHistoryPage'
import PlaceholderPage from './pages/PlaceholderPage'

// Components
import ProtectedRoute from './components/ProtectedRoute'

const App = () => {
  const { theme, applyTheme } = useThemeStore()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  // Apply theme on mount
  useEffect(() => {
    applyTheme(theme)
  }, [])

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected app routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute><DashboardPage /></ProtectedRoute>
      } />

      {/* Products */}
      <Route path="/products" element={
        <ProtectedRoute><ProductsPage /></ProtectedRoute>
      } />

      {/* Operations */}
      <Route path="/operations/receipts" element={
        <ProtectedRoute><ReceiptsPage /></ProtectedRoute>
      } />
      <Route path="/operations/receipts/new" element={
        <ProtectedRoute><ReceiptDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/receipts/:id" element={
        <ProtectedRoute><ReceiptDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/delivery" element={
        <ProtectedRoute><DeliveriesPage /></ProtectedRoute>
      } />
      <Route path="/operations/delivery/new" element={
        <ProtectedRoute><DeliveryDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/delivery/:id" element={
        <ProtectedRoute><DeliveryDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/internal" element={
        <ProtectedRoute><TransfersPage /></ProtectedRoute>
      } />
      <Route path="/operations/internal/new" element={
        <ProtectedRoute><TransferDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/internal/:id" element={
        <ProtectedRoute><TransferDetailPage /></ProtectedRoute>
      } />
      <Route path="/operations/adjustments" element={
        <ProtectedRoute><AdjustmentsPage /></ProtectedRoute>
      } />

      <Route path="/history" element={
        <ProtectedRoute><MoveHistoryPage /></ProtectedRoute>
      } />

      {/* Settings */}
      <Route path="/settings/warehouse" element={
        <ProtectedRoute><WarehousePage /></ProtectedRoute>
      } />
      <Route path="/settings/locations" element={
        <ProtectedRoute><LocationsPage /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><PlaceholderPage title="My Profile" description="Manage your account settings and preferences." /></ProtectedRoute>
      } />

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
