import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Auth
import UnifiedLayout from './layouts/UnifiedLayout';
import ProtectedRoute from './components/ProtectedRoute';

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
const ClaimIntimateForm = lazy(() => import('./pages/insurance/ClaimIntimateForm'));
const EndorsementsPage = lazy(() => import('./pages/insurance/EndorsementsPage'));
const RenewalsPage = lazy(() => import('./pages/insurance/RenewalsPage'));
const POSPManagement = lazy(() => import('./pages/insurance/POSPManagement'));
const POSPDetail = lazy(() => import('./pages/insurance/POSPDetail'));
const IBCommissionPage = lazy(() => import('./pages/insurance/IBCommissionPage'));
const TicketsPage = lazy(() => import('./pages/insurance/TicketsPage'));
const TicketDetail = lazy(() => import('./pages/insurance/TicketDetail'));
const IBReportsPage = lazy(() => import('./pages/insurance/IBReportsPage'));
const InspectionPage = lazy(() => import('./pages/insurance/InspectionPage'));

// Pages - Insurance MIS
const MISDashboard = lazy(() => import('./pages/insurance/MISDashboard'));
const MISEntryPage = lazy(() => import('./pages/insurance/MISEntryPage'));
const MISEntryDetail = lazy(() => import('./pages/insurance/MISEntryDetail'));
const MISVerificationPage = lazy(() => import('./pages/insurance/MISVerificationPage'));
const MISReportsPage = lazy(() => import('./pages/insurance/MISReportsPage'));
const HierarchyManagement = lazy(() => import('./pages/insurance/HierarchyManagement'));
const ProductGradingPage = lazy(() => import('./pages/insurance/ProductGradingPage'));
const ContestManagement = lazy(() => import('./pages/insurance/ContestManagement'));
const ContestDetail = lazy(() => import('./pages/insurance/ContestDetail'));
const PayoutConfigPage = lazy(() => import('./pages/insurance/PayoutConfigPage'));
const POSPDashboardPage = lazy(() => import('./pages/insurance/POSPDashboardPage'));
const InsuranceClientsPage = lazy(() => import('./pages/insurance/InsuranceClientsPage'));
const InsuranceClientDetail = lazy(() => import('./pages/insurance/InsuranceClientDetail'));
const QuotationPage = lazy(() => import('./pages/insurance/QuotationPage'));
const PolicyEntryForm = lazy(() => import('./pages/insurance/PolicyEntryForm'));
const EndorsementEntryForm = lazy(() => import('./pages/insurance/EndorsementEntryForm'));
const CommissionPayoutDashboard = lazy(() => import('./pages/insurance/CommissionPayoutDashboard'));
const POSPCategoryPage = lazy(() => import('./pages/insurance/POSPCategoryPage'));
const ProductCatalogPage = lazy(() => import('./pages/insurance/ProductCatalogPage'));

// Pages - Auth & Admin
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const AuditLogsPage = lazy(() => import('./pages/admin/AuditLogsPage'));
const DataMigrationPage = lazy(() => import('./pages/admin/DataMigrationPage'));

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
    <Router basename="/mis">
      <Suspense fallback={<LoadingSpinner />}>
        <Routes>
          {/* Public Auth Routes (outside UnifiedLayout, no auth required) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Protected Routes - Login Required */}
          <Route element={
            <ProtectedRoute>
              <UnifiedLayout />
            </ProtectedRoute>
          }>
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
            <Route path="/insurance/policies/new" element={<PolicyEntryForm />} />
            <Route path="/insurance/policies/:id" element={<PolicyDetail />} />

            {/* Insurance Routes - Claims */}
            <Route path="/insurance/claims" element={<ClaimsPage />} />
            <Route path="/insurance/claims/intimate" element={<ClaimIntimateForm />} />
            <Route path="/insurance/claims/:id" element={<ClaimDetail />} />

            {/* Insurance Routes - Quotations */}
            <Route path="/insurance/quotations" element={<QuotationPage />} />

            {/* Insurance Routes - Endorsements */}
            <Route path="/insurance/endorsements" element={<EndorsementsPage />} />
            <Route path="/insurance/endorsements/new" element={<EndorsementEntryForm />} />

            {/* Insurance Routes - Renewals */}
            <Route path="/insurance/renewals" element={<RenewalsPage />} />

            {/* Insurance Routes - POSP Management */}
            <Route path="/insurance/posp" element={<POSPManagement />} />
            <Route path="/insurance/posp/:id" element={<POSPDetail />} />

            {/* Insurance Routes - Commission */}
            <Route path="/insurance/commissions" element={<IBCommissionPage />} />
            <Route path="/insurance/commissions/payouts" element={<CommissionPayoutDashboard />} />

            {/* Insurance Routes - Support Tickets */}
            <Route path="/insurance/tickets" element={<TicketsPage />} />
            <Route path="/insurance/tickets/:id" element={<TicketDetail />} />

            {/* Insurance Routes - Reports */}
            <Route path="/insurance/reports" element={<IBReportsPage />} />

            {/* Insurance Routes - Inspections */}
            <Route path="/insurance/inspections" element={<InspectionPage />} />

            {/* Insurance MIS Routes */}
            <Route path="/insurance/mis" element={<MISDashboard />} />
            <Route path="/insurance/mis/entry" element={<MISEntryPage />} />
            <Route path="/insurance/mis/entries/:id" element={<MISEntryDetail />} />
            <Route path="/insurance/mis/verification" element={<MISVerificationPage />} />
            <Route path="/insurance/mis/reports" element={<MISReportsPage />} />
            <Route path="/insurance/hierarchy" element={<HierarchyManagement />} />
            <Route path="/insurance/product-grades" element={<ProductGradingPage />} />
            <Route path="/insurance/contests" element={<ContestManagement />} />
            <Route path="/insurance/contests/:id" element={<ContestDetail />} />
            <Route path="/insurance/payout-config" element={<PayoutConfigPage />} />
            <Route path="/insurance/posp-categories" element={<POSPCategoryPage />} />
            <Route path="/insurance/product-catalog" element={<ProductCatalogPage />} />
            <Route path="/insurance/posp-dashboard" element={<POSPDashboardPage />} />

            {/* Insurance Routes - Client Master */}
            <Route path="/insurance/clients" element={<InsuranceClientsPage />} />
            <Route path="/insurance/clients/:id" element={<InsuranceClientDetail />} />

            {/* Profile Route */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Admin Routes - restricted to SUPER_ADMIN & PRINCIPAL_OFFICER */}
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
            <Route path="/admin/data-migration" element={<DataMigrationPage />} />

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
