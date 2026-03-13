import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertCircle,
  X,
  ChevronRight,
  Phone,
  MessageSquare,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Map backend enum values to display labels
const LOB_MAP = {
  MOTOR_TWO_WHEELER: 'Motor 2W',
  MOTOR_FOUR_WHEELER: 'Motor 4W',
  MOTOR_COMMERCIAL: 'Motor Commercial',
  HEALTH_INDIVIDUAL: 'Health',
  HEALTH_FAMILY_FLOATER: 'Health Family',
  HEALTH_GROUP: 'Health Group',
  HEALTH_CRITICAL_ILLNESS: 'Critical Illness',
  HEALTH_TOP_UP: 'Health Top-up',
  LIFE_TERM: 'Life Term',
  LIFE_ENDOWMENT: 'Life Endowment',
  LIFE_ULIP: 'ULIP',
  LIFE_WHOLE_LIFE: 'Whole Life',
  TRAVEL: 'Travel',
  HOME: 'Home',
  FIRE: 'Fire',
  MARINE: 'Marine',
  ENGINEERING: 'Engineering',
  LIABILITY: 'Liability',
  MISCELLANEOUS: 'Misc',
};

const STATUS_MAP = {
  NEW: 'New',
  CONTACTED: 'Contacted',
  QUOTE_SHARED: 'Quote Shared',
  FOLLOW_UP: 'Follow Up',
  PROPOSAL_STAGE: 'Proposal',
  PAYMENT_PENDING: 'Payment Pending',
  CONVERTED: 'Converted',
  LOST: 'Lost',
  JUNK: 'Junk',
};

const SOURCE_MAP = {
  WEBSITE: 'Website',
  REFERRAL: 'Referral',
  POSP_GENERATED: 'POSP Generated',
  WALK_IN: 'Walk-in',
  PHONE_CALL: 'Phone Call',
  WHATSAPP: 'WhatsApp',
  SOCIAL_MEDIA: 'Social Media',
  RENEWAL: 'Renewal',
  CAMPAIGN: 'Campaign',
  OTHER: 'Other',
};

const displayLOB = (lob) => LOB_MAP[lob] || lob?.replace(/_/g, ' ') || '-';
const displayStatus = (status) => STATUS_MAP[status] || status || '-';
const displaySource = (source) => SOURCE_MAP[source] || source?.replace(/_/g, ' ') || '-';

const computeLeadAge = (createdAt) => {
  if (!createdAt) return 0;
  const now = new Date();
  const created = new Date(createdAt);
  return Math.floor((now - created) / (1000 * 60 * 60 * 24));
};

const LeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLOB, setSelectedLOB] = useState('All');
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    lob: 'MOTOR_FOUR_WHEELER',
    source: 'OTHER',
    customerCity: '',
  });

  const kanbanStatuses = ['NEW', 'CONTACTED', 'QUOTE_SHARED', 'FOLLOW_UP', 'PROPOSAL_STAGE', 'PAYMENT_PENDING', 'CONVERTED', 'LOST'];
  const lobFilterOptions = ['All', 'Motor 2W', 'Motor 4W', 'Health', 'Life', 'Travel'];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/insurance/leads', { params: { take: 500 } });
      // Backend returns { data: [...], pagination: {...} } — unwrapped by interceptor
      setLeads(res.data || []);
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    try {
      setCreating(true);
      const res = await api.post('/insurance/leads', formData);
      setLeads([res, ...leads]);
      setShowNewLeadModal(false);
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        lob: 'MOTOR_FOUR_WHEELER',
        source: 'OTHER',
        customerCity: '',
      });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create lead. Check required fields.');
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.patch(`/insurance/leads/${leadId}/status`, { status: newStatus });
      setLeads(
        leads.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
    } catch (err) {
      console.error(err);
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      !searchQuery ||
      (lead.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.customerPhone || '').includes(searchQuery) ||
      (lead.leadCode || '').toLowerCase().includes(searchQuery.toLowerCase());

    let matchesLOB = true;
    if (selectedLOB !== 'All') {
      if (selectedLOB === 'Motor 2W') matchesLOB = lead.lob === 'MOTOR_TWO_WHEELER';
      else if (selectedLOB === 'Motor 4W') matchesLOB = lead.lob === 'MOTOR_FOUR_WHEELER';
      else if (selectedLOB === 'Health') matchesLOB = (lead.lob || '').startsWith('HEALTH');
      else if (selectedLOB === 'Life') matchesLOB = (lead.lob || '').startsWith('LIFE');
      else if (selectedLOB === 'Travel') matchesLOB = lead.lob === 'TRAVEL';
    }

    return matchesSearch && matchesLOB;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'NEW': return 'border-blue-400';
      case 'CONTACTED': return 'border-indigo-400';
      case 'QUOTE_SHARED': return 'border-purple-400';
      case 'FOLLOW_UP': return 'border-yellow-400';
      case 'PROPOSAL_STAGE': return 'border-orange-400';
      case 'PAYMENT_PENDING': return 'border-amber-400';
      case 'CONVERTED': return 'border-green-400';
      case 'LOST': return 'border-red-400';
      default: return 'border-teal-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading leads...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Lead Management</h1>
          <p className="text-gray-600 mt-2">
            Track and manage insurance leads
            {leads.length > 0 && <span className="ml-2 text-teal-600 font-medium">({leads.length} total)</span>}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLeads}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowNewLeadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Lead
          </button>
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

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or lead code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex gap-2">
            <select
              value={selectedLOB}
              onChange={(e) => setSelectedLOB(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {lobFilterOptions.map((lob) => (
                <option key={lob} value={lob}>{lob}</option>
              ))}
            </select>

            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-white text-teal-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded font-medium text-sm transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-teal-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
          {kanbanStatuses.map((status) => {
            const statusLeads = filteredLeads.filter((lead) => lead.status === status);
            return (
              <div key={status} className="flex flex-col">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                  <h2 className="font-bold text-gray-900">{displayStatus(status)}</h2>
                  <p className="text-xs text-gray-600 mt-1">{statusLeads.length} leads</p>
                </div>

                <div className="space-y-3 flex-1">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className={`bg-white border-l-4 ${getStatusColor(status)} rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative`}
                    >
                      <button
                        onClick={() => navigate(`/insurance/leads/${lead.id}`)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="pr-6">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{lead.customerName}</h3>
                        <p className="text-xs text-gray-600 mt-1">{lead.customerPhone}</p>
                        <div className="flex gap-1 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                            {displayLOB(lead.lob)}
                          </span>
                        </div>
                        <p className="text-xs text-teal-600 font-bold mt-2">
                          {formatCurrency(lead.quotedPremium || lead.idv || 0)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Age: {computeLeadAge(lead.createdAt)} days</p>

                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {kanbanStatuses.map((s) => (
                            <option key={s} value={s}>{displayStatus(s)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {statusLeads.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <p className="text-sm">No leads</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Code</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Contact</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Source</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Age</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{lead.leadCode}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <a href={`tel:${lead.customerPhone}`} className="text-teal-600 hover:underline">
                        {lead.customerPhone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                        {displayLOB(lead.lob)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{displaySource(lead.source)}</td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {kanbanStatuses.map((s) => (
                          <option key={s} value={s}>{displayStatus(s)}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-500">
                      {computeLeadAge(lead.createdAt)}d
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/insurance/leads/${lead.id}`)}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No leads found matching your criteria</p>
            </div>
          )}
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Create New Lead</h2>
              <button
                onClick={() => setShowNewLeadModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLead} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="+919876543210"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Include country code (e.g., +91)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Line of Business *</label>
                <select
                  value={formData.lob}
                  onChange={(e) => setFormData({ ...formData, lob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="MOTOR_TWO_WHEELER">Motor 2 Wheeler</option>
                  <option value="MOTOR_FOUR_WHEELER">Motor 4 Wheeler</option>
                  <option value="MOTOR_COMMERCIAL">Motor Commercial</option>
                  <option value="HEALTH_INDIVIDUAL">Health Individual</option>
                  <option value="HEALTH_FAMILY_FLOATER">Health Family Floater</option>
                  <option value="HEALTH_GROUP">Health Group</option>
                  <option value="LIFE_TERM">Life Term</option>
                  <option value="LIFE_ENDOWMENT">Life Endowment</option>
                  <option value="TRAVEL">Travel</option>
                  <option value="HOME">Home</option>
                  <option value="FIRE">Fire</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(SOURCE_MAP).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.customerCity}
                  onChange={(e) => setFormData({ ...formData, customerCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowNewLeadModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsPage;
