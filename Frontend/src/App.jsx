"use client"

import { Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./stores/authStore"
import { useEffect } from "react"

// Layout Components
import Layout from "./components/layout/Layout"
import AuthLayout from "./components/layout/AuthLayout"

// Pages
import Login from "./pages/auth/Login"
import Dashboard from "./pages/dashboard/Dashboard"
import Reminders from "./pages/reminders/Reminders"
import SendReminder from "./pages/reminders/SendReminder"
import Documents from "./pages/documents/Documents"
import ESign from "./pages/esign/Esign"
import AdminPanel from "./pages/admin/AdminPanel"
import Profile from "./pages/profile/Profile"
import ReminderScheduleManager from "./pages/reminders/ReminderScheduleManager"

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null, requiredPermission = null }) => {
  const { user, isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role_name !== requiredRole) {
    return <Navigate to="/dashboard" replace />
  }

  if (requiredPermission && !user?.permissions?.includes(requiredPermission) && !user?.permissions?.includes("all")) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function App() {
  const { initializeAuth, isLoading } = useAuthStore()

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Routes>
      {/* Auth Routes */}
      <Route
        path="/login"
        element={
          <AuthLayout>
            <Login />
          </AuthLayout>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="reminders" element={<Reminders />} />
        <Route
          path="reminders/send"
          element={
            <ProtectedRoute >
              <SendReminder />
            </ProtectedRoute>
          }
        />
         <Route
          path="reminders/schedule"
          element={
            <ProtectedRoute >
              <ReminderScheduleManager />
            </ProtectedRoute>
          }
        />
        <Route path="documents" element={<Documents />} />
        <Route
          path="esign"
          element={
            <ProtectedRoute >
              <ESign />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPanel />
            </ProtectedRoute>
          }
        />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
