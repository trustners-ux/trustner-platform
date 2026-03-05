import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  AlertCircle,
  GripVertical,
  X,
  ChevronRight,
  Phone,
  MessageSquare,
  MapPin,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const LeadsPage = () => {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLOB, setSelectedLOB] = useState('All');
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    email: '',
    lob: 'Motor',
    source: 'Direct',
    vehicleType: '',
  });

  const statuses = ['New', 'Contacted', 'Quote Shared', 'Follow Up', 'Proposal', 'Converted', 'Lost'];
  const lobs = ['All', 'Motor 2W', 'Motor 4W', 'Health', 'Life', 'Travel'];
  const sources = ['Direct', 'Website', 'Phone', 'Referral', 'Event'];

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await api.get('/insurance/leads');
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
      const res = await api.post('/insurance/leads', formData);
      setLeads([...leads, res.data]);
      setShowNewLeadModal(false);
      setFormData({
        customerName: '',
        phone: '',
        email: '',
        lob: 'Motor',
        source: 'Direct',
        vehicleType: '',
      });
    } catch (err) {
      alert('Failed to create lead');
      console.error(err);
    }
  };

  const handleStatusChange = async (leadId, newStatus) => {
    try {
      await api.patch(`/insurance/leads/${leadId}`, { status: newStatus });
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
      lead.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.includes(searchQuery);
    const matchesLOB = selectedLOB === 'All' || lead.lob === selectedLOB;
    return matchesSearch && matchesLOB;
  });

  const LeadCard = ({ lead }) => (
    <div
      onClick={() => navigate(`/insurance/leads/${lead.id}`)}
      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-sm">{lead.customerName}</h3>
          <p className="text-xs text-gray-600 mt-1">{lead.phone}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-teal-100 text-teal-800">
              {lead.lob}
            </span>
            <span className="text-xs text-gray-500">{lead.source}</span>
          </div>
        </div>
        <span className="text-sm font-bold text-teal-600">{formatCurrency(lead.estimatedPremium)}</span>
      </div>
      <p className="text-xs text-gray-500 mt-3">Age: {lead.ageOfLead} days</p>
    </div>
  );

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
          <p className="text-gray-600 mt-2">Track and manage insurance leads</p>
        </div>
        <button
          onClick={() => setShowNewLeadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Lead
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

      {/* Controls */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
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
              {lobs.map((lob) => (
                <option key={lob} value={lob}>
                  {lob}
                </option>
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
          {statuses.map((status) => {
            const statusLeads = filteredLeads.filter((lead) => lead.status === status);
            return (
              <div key={status} className="flex flex-col">
                <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                  <h2 className="font-bold text-gray-900">{status}</h2>
                  <p className="text-xs text-gray-600 mt-1">{statusLeads.length} leads</p>
                </div>

                <div className="space-y-3 flex-1">
                  {statusLeads.map((lead) => (
                    <div
                      key={lead.id}
                      className="bg-white border-l-4 border-teal-600 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group relative"
                    >
                      <button
                        onClick={() => navigate(`/insurance/leads/${lead.id}`)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-600" />
                      </button>

                      <div className="pr-6">
                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">
                          {lead.customerName}
                        </h3>
                        <p className="text-xs text-gray-600 mt-1">{lead.phone}</p>
                        <div className="flex gap-1 mt-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                            {lead.lob}
                          </span>
                        </div>
                        <p className="text-xs text-teal-600 font-bold mt-2">
                          {formatCurrency(lead.estimatedPremium)}
                        </p>

                        {/* Status Dropdown */}
                        <select
                          value={status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-2 w-full text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
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
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Contact</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Source</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => (
                  <tr
                    key={lead.id}
                    className={`border-t border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{lead.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">
                      <a href={`tel:${lead.phone}`} className="text-teal-600 hover:underline">
                        {lead.phone}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.lob}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.source}</td>
                    <td className="px-6 py-4">
                      <select
                        value={lead.status}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-teal-500"
                      >
                        {statuses.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">
                      {formatCurrency(lead.estimatedPremium)}
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
        </div>
      )}

      {/* New Lead Modal */}
      {showNewLeadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LOB</label>
                <select
                  value={formData.lob}
                  onChange={(e) => setFormData({ ...formData, lob: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option>Motor 2W</option>
                  <option>Motor 4W</option>
                  <option>Health</option>
                  <option>Life</option>
                  <option>Travel</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {sources.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
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
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Create Lead
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
