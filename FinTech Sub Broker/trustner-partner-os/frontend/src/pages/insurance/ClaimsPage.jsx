import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const ClaimsPage = () => {
  const navigate = useNavigate();
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'All',
    type: 'All',
  });
  const [summary, setSummary] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
  });

  const statusOptions = ['All', 'Intimated', 'Approved', 'Rejected', 'Settled', 'Pending'];
  const typeOptions = ['All', 'Motor', 'Health', 'Life', 'Travel'];

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const [claimsRes, summaryRes] = await Promise.all([
        api.get('/insurance/claims'),
        api.get('/insurance/claims/summary'),
      ]);

      setClaims(claimsRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      setError('Failed to load claims');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredClaims = claims.filter((claim) => {
    const matchesSearch =
      !searchQuery ||
      claim.claimNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.policyNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filters.status === 'All' || claim.status === filters.status;
    const matchesType = filters.type === 'All' || claim.type === filters.type;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusColor = (status) => {
    const statusMap = {
      Intimated: 'bg-blue-100 text-blue-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
      Settled: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
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
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Claims</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{summary.total}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Approved</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{summary.approved}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Pending</p>
          <p className="text-3xl font-bold mt-2 text-yellow-600">{summary.pending}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Rejected</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{summary.rejected}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by claim code, policy no, or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {typeOptions.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Claim Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Policy No</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Type</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Amount</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Assigned To</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaims.length > 0 ? (
                filteredClaims.map((claim, idx) => (
                  <tr
                    key={claim.id}
                    className={`border-t border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{claim.claimNo}</td>
                    <td className="px-6 py-4 text-gray-600">{claim.policyNo}</td>
                    <td className="px-6 py-4 text-gray-600">{claim.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{claim.type}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">
                      {formatCurrency(claim.amount)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(claim.status)}`}>
                        {claim.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{claim.assignedTo || 'Unassigned'}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/insurance/claims/${claim.id}`)}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    No claims found
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

export default ClaimsPage;
