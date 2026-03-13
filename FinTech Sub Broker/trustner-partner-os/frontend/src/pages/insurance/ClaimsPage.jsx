import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertCircle, RefreshCw } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Prisma ClaimStatus enum → display map
const STATUS_MAP = {
  INTIMATED: { label: 'Intimated', color: 'bg-blue-100 text-blue-800' },
  DOCUMENTS_PENDING: { label: 'Docs Pending', color: 'bg-yellow-100 text-yellow-800' },
  DOCUMENTS_SUBMITTED: { label: 'Docs Submitted', color: 'bg-indigo-100 text-indigo-800' },
  UNDER_INVESTIGATION: { label: 'Investigation', color: 'bg-purple-100 text-purple-800' },
  SURVEYOR_APPOINTED: { label: 'Surveyor', color: 'bg-cyan-100 text-cyan-800' },
  SURVEY_COMPLETED: { label: 'Survey Done', color: 'bg-teal-100 text-teal-800' },
  APPROVED: { label: 'Approved', color: 'bg-green-100 text-green-800' },
  PARTIALLY_APPROVED: { label: 'Partial Approval', color: 'bg-lime-100 text-lime-800' },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
  SETTLED: { label: 'Settled', color: 'bg-emerald-100 text-emerald-800' },
  CLOSED: { label: 'Closed', color: 'bg-gray-100 text-gray-800' },
  REOPENED: { label: 'Reopened', color: 'bg-orange-100 text-orange-800' },
};

const ClaimsPage = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const pageSize = 20;
  const [statusFilter, setStatusFilter] = useState('');
  const [summary, setSummary] = useState({
    totalClaims: 0,
    approvedClaims: 0,
    settledClaims: 0,
    rejectedClaims: 0,
  });

  useEffect(() => {
    fetchData();
  }, [page, statusFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        skip: page * pageSize,
        take: pageSize,
      };
      if (statusFilter) params.status = statusFilter;

      // Backend: GET /insurance/claims → { data: [...], pagination: { total, pages } }
      // Backend: GET /insurance/claims/analytics/overview → { summary: {...}, byStatus: [...], byType: [...] }
      const [claimsRes, analyticsRes] = await Promise.allSettled([
        api.get('/insurance/claims', { params }),
        api.get('/insurance/claims/analytics/overview'),
      ]);

      if (claimsRes.status === 'fulfilled') {
        const result = claimsRes.value;
        setClaims(result.data || []);
        setPagination(result.pagination || { total: 0, pages: 0 });
      } else {
        console.error('Claims fetch error:', claimsRes.reason);
        setError('Failed to load claims');
      }

      if (analyticsRes.status === 'fulfilled') {
        const analytics = analyticsRes.value;
        setSummary(analytics.summary || {});
      }
    } catch (err) {
      setError('Failed to load claims');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    fetchData();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading && claims.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading claims...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Claims Management</h1>
          <p className="text-gray-600 mt-2">Track and manage insurance claims</p>
        </div>
        <button
          onClick={() => navigate('/insurance/claims/intimate')}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Intimate Claim
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button onClick={fetchData} className="text-red-600 hover:text-red-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Claims', value: summary.totalClaims || 0, color: 'text-blue-800', bg: 'bg-blue-50 border-blue-200' },
          { label: 'Approved', value: summary.approvedClaims || 0, color: 'text-green-800', bg: 'bg-green-50 border-green-200' },
          { label: 'Settled', value: summary.settledClaims || 0, color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Rejected', value: summary.rejectedClaims || 0, color: 'text-red-800', bg: 'bg-red-50 border-red-200' },
        ].map((card, idx) => (
          <div key={idx} className={`rounded-lg border p-4 ${card.bg}`}>
            <p className="text-xs text-gray-600 font-medium">{card.label}</p>
            <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by claim code, policy number, customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_MAP).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Claim Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Policy No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Type</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Est. Amount</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Incident Date</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Intimated</th>
                <th className="px-4 py-3 text-center font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {claims.length > 0 ? (
                claims.map((claim, idx) => {
                  const statusInfo = STATUS_MAP[claim.status] || { label: claim.status, color: 'bg-gray-100 text-gray-800' };
                  return (
                    <tr
                      key={claim.id}
                      className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
                      onClick={() => navigate(`/insurance/claims/${claim.id}`)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                        {claim.claimCode}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {claim.policy?.policyNumber || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-[160px] truncate">
                        {claim.policy?.customerName || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {claim.claimType || '—'}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-teal-600 whitespace-nowrap">
                        {claim.estimatedAmount ? formatCurrency(claim.estimatedAmount) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(claim.incidentDate)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(claim.intimationDate)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(`/insurance/claims/${claim.id}`); }}
                          className="text-teal-600 hover:text-teal-700 font-medium"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    {loading ? 'Loading...' : 'No claims found. Click "Intimate Claim" to create one.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, pagination.total)} of {pagination.total}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(Math.min(pagination.pages - 1, page + 1))}
                disabled={page >= pagination.pages - 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-40 hover:bg-gray-100"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClaimsPage;
