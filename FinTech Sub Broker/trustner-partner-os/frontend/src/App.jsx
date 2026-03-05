import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import UnifiedLayout from './layouts/UnifiedLayout';

// Pages - Dashboard & MF
const UnifiedDashboard = lazy(() => import('./pages/UnifiedDashboard'));
const FundExplorer = lazy(() => import('./pages/mf/FundExplorer'));
const SIPCalculator = lazy(() => import('./pages/mf/SIPCalculator'));
const MFPerformanceComparison = lazy(() => import('./pages/mf/MFPerformanceComparison'));

// Pages - Insurance
const IBDashboard = lazy(() => import('./pages/insurance/IBDashboard'));
const LeadsPage = lazy(() => import('./pages/insurance/LeadsPage'));
const LeadDetail = lazy(() => import('./pages/insurance/LeadDetail'));
const PoliciesPage = lazy(() => import('./pages/insurance/PoliciesPage'));
const PolicyDetail = lazy(() => import('./pages/insurance/PolicyDetail'));
const ClaimsPage = lazy(() => import('./pages/insurance/ClaimsPage'));
const ClaimDetail = lazy(() => import('./pages/insurance/ClaimDetail'));
const EndorsementsPage = lazy(() => import('./pages/insurance/EndorsementsPage'));
const RenewalsPage = lazy(() => import('./pages/insurance/RenewalsPage'));
const POSPManagement = lazy(() => import('./pages/insurance/POSPManagement'));
const POSPDetail = lazy(() => import('./pages/insurance/POSPDetail'));
const IBCommissionPage = lazy(() => import('./pages/insurance/IBCommissionPage'));
const TicketsPage = lazy(() => import('./pages/insurance/TicketsPage'));
const TicketDetail = lazy(() => import('./pages/insurance/TicketDetail'));
const IBReportsPage = lazy(() => import('./pages/insurance/IBReportsPage'));
const InspectionPage = lazy(() => import('./pages/insurance/InspectionPage'));

// Pages - AI Advisory
const AdvisoryDashboard = lazy(() => import('./pages/advisory/AdvisoryDashboard'));
const RiskAssessment = lazy(() => import('./pages/advisory/RiskAssessment'));
const GoalPlanner = lazy(() => import('./pages/advisory/GoalPlanner'));
const InsuranceGapAnalysis = lazy(() => import('./pages/advisory/InsuranceGapAnalysis'));
const SmartRecommendations = lazy(() => import('./pages/advisory/SmartRecommendations'));
const AdvisoryChat = lazy(() => import('./pages/advisory/AdvisoryChat'));

// PWA Components
import PWAInstallPrompt from './components/PWAInstallPrompt';
import OfflineIndicator from './components/OfflineIndicator';
import MobileNav from './components/MobileNav';

// Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Unified Layout Routes */}
          <Route element={<UnifiedLayout />}>
            {/* Default Dashboard */}
            <Route path="/" element={<UnifiedDashboard />} />

            {/* Mutual Fund Routes */}
            <Route path="/mf/dashboard" element={<UnifiedDashboard />} />
            <Route path="/mf/explorer" element={<FundExplorer />} />
            <Route path="/mf/sip-calculator" element={<SIPCalculator />} />
            <Route path="/mf/compare" element={<MFPerformanceComparison />} />

            {/* Insurance Routes - Dashboard & Analytics */}
            <Route path="/insurance/dashboard" element={<IBDashboard />} />

            {/* Insurance Routes - Leads */}
            <Route path="/insurance/leads" element={<LeadsPage />} />
            <Route path="/insurance/leads/:id" element={<LeadDetail />} />

            {/* Insurance Routes - Policies */}
            <Route path="/insurance/policies" element={<PoliciesPage />} />
            <Route path="/insurance/policies/:id" element={<PolicyDetail />} />

            {/* Insurance Routes - Claims */}
            <Route path="/insurance/claims" element={<ClaimsPage />} />
            <Route path="/insurance/claims/:id" element={<ClaimDetail />} />

            {/* Insurance Routes - Endorsements */}
            <Route path="/insurance/endorsements" element={<EndorsementsPage />} />

            {/* Insurance Routes - Renewals */}
            <Route path="/insurance/renewals" element={<RenewalsPage />} />

            {/* Insurance Routes - POSP Management */}
            <Route path="/insurance/posp" element={<POSPManagement />} />
            <Route path="/insurance/posp/:id" element={<POSPDetail />} />

            {/* Insurance Routes - Commission */}
            <Route path="/insurance/commissions" element={<IBCommissionPage />} />

            {/* Insurance Routes - Support Tickets */}
            <Route path="/insurance/tickets" element={<TicketsPage />} />
            <Route path="/insurance/tickets/:id" element={<TicketDetail />} />

            {/* Insurance Routes - Reports */}
            <Route path="/insurance/reports" element={<IBReportsPage />} />

            {/* Insurance Routes - Inspections */}
            <Route path="/insurance/inspections" element={<InspectionPage />} />

            {/* AI Advisory Routes */}
            <Route path="/advisory" element={<AdvisoryDashboard />} />
            <Route path="/advisory/risk-assessment" element={<RiskAssessment />} />
            <Route path="/advisory/goal-planner" element={<GoalPlanner />} />
            <Route path="/advisory/insurance-gap" element={<InsuranceGapAnalysis />} />
            <Route path="/advisory/smart-recommend" element={<SmartRecommendations />} />
            <Route path="/advisory/chat" element={<AdvisoryChat />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        {/* PWA Components */}
        <OfflineIndicator />
        <PWAInstallPrompt />
        <MobileNav />
      </Suspense>
    </Router>
  );
}

export default App;
