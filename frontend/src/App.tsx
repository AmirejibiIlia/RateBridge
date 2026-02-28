import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import ProtectedRoute from './components/ProtectedRoute'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import FeedbackPage from './pages/FeedbackPage'
import DashboardPage from './pages/DashboardPage'
import QRCodesPage from './pages/QRCodesPage'
import FeedbackListPage from './pages/FeedbackListPage'
import SuperAdminPage from './pages/SuperAdminPage'
import AdminPage from './pages/AdminPage'
import TasksPage from './pages/TasksPage'

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
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
            path="/tasks"
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
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
    </LanguageProvider>
  )
}
