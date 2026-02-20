import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FeedbackPage from './pages/FeedbackPage'
import DashboardPage from './pages/DashboardPage'
import QRCodesPage from './pages/QRCodesPage'
import FeedbackListPage from './pages/FeedbackListPage'
import SuperAdminPage from './pages/SuperAdminPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/feedback/:uuid" element={<FeedbackPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/qr-codes"
            element={
              <ProtectedRoute>
                <QRCodesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/feedback-list"
            element={
              <ProtectedRoute>
                <FeedbackListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/superadmin"
            element={
              <ProtectedRoute superAdminOnly>
                <SuperAdminPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
