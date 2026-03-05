import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Download, AlertCircle, ChevronDown } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const PoliciesPage = () => {
  const navigate = useNavigate();
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    lob: 'All',
    status: 'All',
    company: 'All',
  });
  const [summary, setSummary] = useState({
    total: 0,
    active: 0,
    expired: 0,
    claimsInProgress: 0,
  });

  const statusOptions = ['All', 'Active', 'Expired', 'Pending', 'Lapsed'];
  const lobOptions = ['All', 'Motor 2W', 'Motor 4W', 'Health', 'Life', 'Travel'];
  const companyOptions = ['All', 'HDFC', 'ICICI', 'Bajaj', 'Max Bupa', 'Others'];

  useEffect(() => {
    fetchPolicies();
  }, []);

  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const [policiesRes, summaryRes] = await Promise.all([
        api.get('/insurance/policies'),
        api.get('/insurance/policies/summary'),
      ]);

      setPolicies(policiesRes.data || []);
      setSummary(summaryRes.data);
    } catch (err) {
      setError('Failed to load policies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      !searchQuery ||
      policy.policyNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      policy.customerName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesLOB = filters.lob === 'All' || policy.lob === filters.lob;
    const matchesStatus = filters.status === 'All' || policy.status === filters.status;
    const matchesCompany = filters.company === 'All' || policy.company === filters.company;

    return matchesSearch && matchesLOB && matchesStatus && matchesCompany;
  });

  const handleExport = async () => {
    try {
      const res = await api.get('/insurance/policies/export', {
        params: { format: 'excel' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `policies-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export policies');
      console.error(err);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      Active: 'bg-green-100 text-green-800',
      Expired: 'bg-red-100 text-red-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Lapsed: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading policies...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Policy Management</h1>
          <p className="text-gray-600 mt-2">View and manage all insurance policies</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Export
          </button>
          <a
            href="https://vjinfosoft.example.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Policy
          </a>
        </div>
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
        {[
          { label: 'Total Policies', value: summary.total, color: 'bg-blue-100 text-blue-800' },
          { label: 'Active', value: summary.active, color: 'bg-green-100 text-green-800' },
          { label: 'Expired', value: summary.expired, color: 'bg-red-100 text-red-800' },
          { label: 'Claims In Progress', value: summary.claimsInProgress, color: 'bg-orange-100 text-orange-800' },
        ].map((card, idx) => (
          <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">{card.label}</p>
            <p className={`text-3xl font-bold mt-2 ${card.color.split(' ').pop()}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by policy number or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <select
            value={filters.lob}
            onChange={(e) => setFilters({ ...filters, lob: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {lobOptions.map((lob) => (
              <option key={lob} value={lob}>
                {lob}
              </option>
            ))}
          </select>

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
            value={filters.company}
            onChange={(e) => setFilters({ ...filters, company: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            {companyOptions.map((company) => (
              <option key={company} value={company}>
                {company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Policies Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Policy No</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Company</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Start Date</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">End Date</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.length > 0 ? (
                filteredPolicies.map((policy, idx) => (
                  <tr
                    key={policy.id}
                    className={`border-t border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{policy.policyNo}</td>
                    <td className="px-6 py-4 text-gray-600">{policy.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{policy.lob}</td>
                    <td className="px-6 py-4 text-gray-600">{policy.company}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">
                      {formatCurrency(policy.premium)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(policy.status)}`}>
                        {policy.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{policy.startDate}</td>
                    <td className="px-6 py-4 text-gray-600">{policy.endDate}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/insurance/policies/${policy.id}`)}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No policies found
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

export default PoliciesPage;
