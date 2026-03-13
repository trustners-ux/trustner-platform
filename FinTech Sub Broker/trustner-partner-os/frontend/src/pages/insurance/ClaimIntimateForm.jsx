import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const CLAIM_TYPES = [
  { value: 'CASHLESS', label: 'Cashless (Health)' },
  { value: 'REIMBURSEMENT', label: 'Reimbursement (Health)' },
  { value: 'OWN_DAMAGE', label: 'Own Damage (Motor)' },
  { value: 'THIRD_PARTY', label: 'Third Party (Motor)' },
  { value: 'DEATH', label: 'Death Claim (Life)' },
  { value: 'MATURITY', label: 'Maturity Claim (Life)' },
  { value: 'TRAVEL', label: 'Travel Claim' },
  { value: 'OTHER', label: 'Other' },
];

const ClaimIntimateForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Policy search
  const [policySearch, setPolicySearch] = useState('');
  const [policies, setPolicies] = useState([]);
  const [searchingPolicies, setSearchingPolicies] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);

  // Form data
  const [form, setForm] = useState({
    policyId: '',
    claimType: '',
    incidentDate: '',
    description: '',
    estimatedAmount: '',
  });

  // Search for policies
  const searchPolicies = async (query) => {
    if (!query || query.length < 2) {
      setPolicies([]);
      return;
    }

    setSearchingPolicies(true);
    try {
      const res = await api.get('/insurance/policies', {
        params: { search: query, take: 10 },
      });
      setPolicies(res.data || []);
    } catch (err) {
      console.error('Policy search error:', err);
    } finally {
      setSearchingPolicies(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPolicies(policySearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [policySearch]);

  const selectPolicy = (policy) => {
    setSelectedPolicy(policy);
    setForm({ ...form, policyId: policy.id });
    setPolicySearch('');
    setPolicies([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.policyId) {
      setError('Please select a policy');
      return;
    }
    if (!form.claimType) {
      setError('Please select a claim type');
      return;
    }
    if (!form.incidentDate) {
      setError('Please enter the incident date');
      return;
    }
    if (!form.description) {
      setError('Please enter a description');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        policyId: form.policyId,
        claimType: form.claimType,
        incidentDate: form.incidentDate,
        description: form.description,
        estimatedAmount: form.estimatedAmount ? Number(form.estimatedAmount) : undefined,
      };

      const result = await api.post('/insurance/claims/intimate', payload);
      setSuccess(`Claim ${result.claimCode} created successfully!`);

      // Navigate to claim detail after a short delay
      setTimeout(() => {
        navigate(`/insurance/claims/${result.id}`);
      }, 1500);
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'Failed to intimate claim');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/claims')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claims
      </button>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Intimate New Claim</h1>
        <p className="text-gray-600 mt-2">
          File a new insurance claim against an existing policy
        </p>
      </div>

      {/* Error / Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700 font-medium">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Select Policy */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">1. Select Policy</h2>

          {selectedPolicy ? (
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-teal-900">{selectedPolicy.policyNumber}</p>
                  <p className="text-sm text-teal-700 mt-1">{selectedPolicy.customerName}</p>
                  <div className="flex gap-4 mt-2 text-xs text-teal-600">
                    <span>LOB: {selectedPolicy.lob}</span>
                    <span>Company: {selectedPolicy.company?.companyName || '—'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPolicy(null);
                    setForm({ ...form, policyId: '' });
                  }}
                  className="text-teal-600 hover:text-teal-800 text-sm font-medium"
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={policySearch}
                  onChange={(e) => setPolicySearch(e.target.value)}
                  placeholder="Search by policy number, customer name, phone..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
                {searchingPolicies && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-teal-600"></div>
                  </div>
                )}
              </div>

              {/* Policy Search Results */}
              {policies.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {policies.map((policy) => (
                    <button
                      type="button"
                      key={policy.id}
                      onClick={() => selectPolicy(policy)}
                      className="w-full text-left px-4 py-3 hover:bg-teal-50 border-b border-gray-100 last:border-0 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{policy.policyNumber}</p>
                          <p className="text-xs text-gray-600">{policy.customerName}</p>
                        </div>
                        <span className="text-xs text-gray-400">{policy.lob}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {policySearch.length >= 2 && policies.length === 0 && !searchingPolicies && (
                <p className="mt-2 text-sm text-gray-500">No policies found for "{policySearch}"</p>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Claim Details */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">2. Claim Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Claim Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Claim Type <span className="text-red-500">*</span>
              </label>
              <select
                value={form.claimType}
                onChange={(e) => setForm({ ...form, claimType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                required
              >
                <option value="">Select claim type</option>
                {CLAIM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Incident Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Incident <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.incidentDate}
                onChange={(e) => setForm({ ...form, incidentDate: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                required
              />
            </div>

            {/* Estimated Amount */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Claim Amount (optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">₹</span>
                <input
                  type="number"
                  value={form.estimatedAmount}
                  onChange={(e) => setForm({ ...form, estimatedAmount: e.target.value })}
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="w-full pl-7 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description of Incident <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe what happened, when, and where..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                required
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/insurance/claims')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !form.policyId}
            className="flex-1 px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Submitting...
              </>
            ) : (
              'Intimate Claim'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClaimIntimateForm;
