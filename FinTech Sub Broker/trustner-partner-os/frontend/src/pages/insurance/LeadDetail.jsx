import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Plus,
  X,
  MessageSquare,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [activities, setActivities] = useState([]);
  const [quoteForm, setQuoteForm] = useState({
    companyName: '',
    premium: '',
    coverage: '',
    validity: '',
  });

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      const [leadRes, quotesRes, activitiesRes] = await Promise.all([
        api.get(`/insurance/leads/${id}`),
        api.get(`/insurance/leads/${id}/quotes`),
        api.get(`/insurance/leads/${id}/activities`),
      ]);

      setLead(leadRes.data);
      setQuotes(quotesRes.data || []);
      setActivities(activitiesRes.data || []);
    } catch (err) {
      setError('Failed to load lead details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuote = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/insurance/leads/${id}/quotes`, quoteForm);
      setQuotes([...quotes, res.data]);
      setShowQuoteModal(false);
      setQuoteForm({
        companyName: '',
        premium: '',
        coverage: '',
        validity: '',
      });
    } catch (err) {
      alert('Failed to add quote');
      console.error(err);
    }
  };

  const handleConvertToPolicy = async () => {
    try {
      await api.post(`/insurance/leads/${id}/convert`, {
        quotedAt: new Date().toISOString(),
      });
      setLead({ ...lead, status: 'Converted' });
    } catch (err) {
      alert('Failed to convert lead');
      console.error(err);
    }
  };

  const handleMarkLost = async () => {
    try {
      await api.patch(`/insurance/leads/${id}`, { status: 'Lost' });
      setLead({ ...lead, status: 'Lost' });
    } catch (err) {
      alert('Failed to update lead');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading lead details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/insurance/leads')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leads
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Lead not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/leads')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Leads
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Lead Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{lead.customerName}</h1>
            <p className="text-gray-600 mt-2">{lead.lob}</p>
          </div>
          <span
            className={`px-4 py-2 rounded-full font-medium text-sm ${
              lead.status === 'Converted'
                ? 'bg-green-100 text-green-800'
                : lead.status === 'Lost'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {lead.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <a href={`tel:${lead.phone}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">
                  {lead.phone}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                <a href={`mailto:${lead.email}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">
                  {lead.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Location</p>
                <p className="text-sm font-medium text-gray-900">{lead.location || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-teal-50 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-medium">Estimated Premium</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {formatCurrency(lead.estimatedPremium)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium">Source</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{lead.source}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-xs text-gray-600 font-medium">Lead Age</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{lead.ageOfLead} days old</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Activity Timeline</h2>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity, idx) => (
              <div key={idx} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="w-3 h-3 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600 mt-1">{activity.details}</p>
                  <p className="text-xs text-gray-500 mt-2">{activity.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No activity yet</p>
        )}
      </div>

      {/* Quotes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Quotes</h2>
          <button
            onClick={() => setShowQuoteModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Quote
          </button>
        </div>

        {quotes.length > 0 ? (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div
                key={quote.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900">{quote.companyName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{quote.coverage}</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-bold text-teal-600">{formatCurrency(quote.premium)}</p>
                    <p className="text-xs text-gray-500 mt-1">Valid until {quote.validity}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No quotes added yet</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={handleConvertToPolicy}
          disabled={lead.status === 'Converted'}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            lead.status === 'Converted'
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Convert to Policy
        </button>

        <button
          onClick={handleMarkLost}
          disabled={lead.status === 'Lost'}
          className={`py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
            lead.status === 'Lost'
              ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          <X className="w-4 h-4" />
          Mark Lost
        </button>
      </div>

      {/* Add Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Add Quote</h2>
              <button
                onClick={() => setShowQuoteModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Company
                </label>
                <input
                  type="text"
                  value={quoteForm.companyName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Premium (₹)</label>
                <input
                  type="number"
                  value={quoteForm.premium}
                  onChange={(e) => setQuoteForm({ ...quoteForm, premium: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Coverage</label>
                <textarea
                  value={quoteForm.coverage}
                  onChange={(e) => setQuoteForm({ ...quoteForm, coverage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quoteForm.validity}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadDetail;
