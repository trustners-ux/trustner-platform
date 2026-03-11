import React, { useEffect, useState } from 'react';
import {
  User,
  FileText,
  DollarSign,
  TrendingUp,
  Clock,
  AlertCircle,
  Banknote,
} from 'lucide-react';
import pospAPI from '../../services/posp';
import { formatCurrency, formatDate } from '../../utils/formatters';

const POSPDashboardPage = () => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await pospAPI.getMyDashboard();
      setDashboard(res.data || null);
    } catch (err) {
      setError('Failed to load dashboard. You may not have POSP access.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Unable to Load Dashboard</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const profile = dashboard?.profile || {};
  const summary = dashboard?.summary || {};
  const earnings = dashboard?.earnings || {};
  const recentPolicies = dashboard?.recentPolicies || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-600 mt-2">Your business summary and earnings overview</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-teal-700" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {profile.firstName} {profile.lastName}
            </h2>
            <p className="text-sm text-gray-500">{profile.agentCode || 'No code assigned'}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className={`px-3 py-0.5 rounded-full text-xs font-medium ${
                profile.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                profile.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {profile.status || 'Unknown'}
              </span>
              {profile.city && (
                <span className="text-xs text-gray-500">{profile.city}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-teal-100">
              <FileText className="w-5 h-5 text-teal-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Policies Sold</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalPolicies || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Premium</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalPremium || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-100">
              <TrendingUp className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Commission Earned</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalCommission || 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100">
              <Banknote className="w-5 h-5 text-purple-700" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Expected Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(earnings.pendingAmount || 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings Breakdown */}
      {(earnings.approved || earnings.pending) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Earnings Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Paid</p>
              <p className="text-xl font-bold text-green-800">{formatCurrency(earnings.paidAmount || 0)}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Approved (Pending Transfer)</p>
              <p className="text-xl font-bold text-blue-800">{formatCurrency(earnings.approvedAmount || 0)}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg">
              <p className="text-sm text-yellow-700 font-medium">Pending Approval</p>
              <p className="text-xl font-bold text-yellow-800">{formatCurrency(earnings.pendingAmount || 0)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Policies */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900">Recent Policies</h3>
          <p className="text-sm text-gray-600 mt-1">Last 10 policies linked to your account</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Insurer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentPolicies.length > 0 ? recentPolicies.map((policy, idx) => (
                <tr
                  key={policy.id || idx}
                  className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                >
                  <td className="px-6 py-4 text-gray-900">{policy.customerName || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{policy.insurerName || '-'}</td>
                  <td className="px-6 py-4 text-gray-600">{policy.lob?.replace(/_/g, ' ') || '-'}</td>
                  <td className="px-6 py-4 text-right font-bold text-teal-600">
                    {formatCurrency(policy.netPremium || policy.grossPremium || 0)}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{formatDate(policy.createdAt || policy.entryDate)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      policy.status === 'VERIFIED' ? 'bg-green-100 text-green-800' :
                      policy.status === 'PENDING_VERIFICATION' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {policy.status?.replace(/_/g, ' ') || 'Unknown'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No policies yet</p>
                    <p className="text-sm mt-1">Policies linked to your account will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default POSPDashboardPage;
