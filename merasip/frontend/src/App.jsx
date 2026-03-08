import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AuthProvider } from './contexts/AuthContext'
import PrivateRoute from './components/PrivateRoute'

const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const ClientApp = lazy(() => import('./pages/ClientApp'))
const AdvisorDashboard = lazy(() => import('./pages/AdvisorDashboard'))
const RebalancePage = lazy(() => import('./pages/RebalancePage'))
const NavEngine = lazy(() => import('./pages/NavEngine'))
const ReviewManagerPage = lazy(() => import('./pages/ReviewManagerPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const TeamPage = lazy(() => import('./pages/TeamPage'))
const AdminPanel = lazy(() => import('./pages/AdminPanel'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const PortfolioAnalyser = lazy(() => import('./pages/PortfolioAnalyser'))
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'))
const TermsPage = lazy(() => import('./pages/TermsPage'))

const Loading = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', fontFamily: 'Georgia, serif', color: '#1B3A6B',
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800 }}>MeraSIP</div>
      <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>Loading...</div>
    </div>
  </div>
)

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            {/* Public routes */}
            <Route path="/review" element={<ReviewPage />} />
            <Route path="/client/:id" element={<ClientApp />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />

            {/* Private routes (advisor JWT required) */}
            <Route path="/advisor" element={<PrivateRoute><AdvisorDashboard /></PrivateRoute>} />
            <Route path="/advisor/rebalance" element={<PrivateRoute><RebalancePage /></PrivateRoute>} />
            <Route path="/advisor/nav" element={<PrivateRoute><NavEngine /></PrivateRoute>} />
            <Route path="/advisor/review-queue" element={<PrivateRoute requireManager><ReviewManagerPage /></PrivateRoute>} />
            <Route path="/advisor/team" element={<PrivateRoute><TeamPage /></PrivateRoute>} />
            <Route path="/advisor/admin" element={<PrivateRoute requireAdmin><AdminPanel /></PrivateRoute>} />
            <Route path="/advisor/analyse" element={<PrivateRoute><PortfolioAnalyser /></PrivateRoute>} />
            <Route path="/advisor/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/review" replace />} />
            <Route path="*" element={<Navigate to="/review" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  )
}
