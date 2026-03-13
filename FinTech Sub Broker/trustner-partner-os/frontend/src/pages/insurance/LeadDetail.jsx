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
  CheckCircle,
  Clock,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import api from '../../services/api';

const LOB_MAP = {
  MOTOR_TWO_WHEELER: 'Motor 2W',
  MOTOR_FOUR_WHEELER: 'Motor 4W',
  MOTOR_COMMERCIAL: 'Motor Commercial',
  HEALTH_INDIVIDUAL: 'Health Individual',
  HEALTH_FAMILY_FLOATER: 'Health Family Floater',
  LIFE_TERM: 'Life Term',
  TRAVEL: 'Travel',
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

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const computeLeadAge = (createdAt) => {
  if (!createdAt) return 0;
  return Math.floor((new Date() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
};

const LeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    insurerName: '',
    productName: '',
    sumInsured: '',
    premium: '',
    gst: '',
    totalPremium: '',
    quoteRefId: '',
    validTill: '',
  });
  const [activityForm, setActivityForm] = useState({
    action: '',
    description: '',
  });

  useEffect(() => {
    fetchLeadDetails();
  }, [id]);

  const fetchLeadDetails = async () => {
    try {
      setLoading(true);
      // Backend returns lead with included activities and quotes
      const leadData = await api.get(`/insurance/leads/${id}`);
      setLead(leadData);
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
      await api.post(`/insurance/leads/${id}/quotes`, quoteForm);
      await fetchLeadDetails(); // Refresh to get updated data
      setShowQuoteModal(false);
      setQuoteForm({
        insurerName: '', productName: '', sumInsured: '', premium: '',
        gst: '', totalPremium: '', quoteRefId: '', validTill: '',
      });
    } catch (err) {
      alert('Failed to add quote');
      console.error(err);
    }
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/insurance/leads/${id}/activity`, activityForm);
      await fetchLeadDetails();
      setShowActivityModal(false);
      setActivityForm({ action: '', description: '' });
    } catch (err) {
      alert('Failed to add activity');
      console.error(err);
    }
  };

  const handleConvertToPolicy = async () => {
    if (!window.confirm('Convert this lead to a policy? This will create a new policy record.')) return;
    try {
      await api.post(`/insurance/leads/${id}/convert-to-policy`);
      await fetchLeadDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to convert lead');
      console.error(err);
    }
  };

  const handleMarkLost = async () => {
    if (!window.confirm('Mark this lead as lost?')) return;
    try {
      await api.patch(`/insurance/leads/${id}/status`, { status: 'LOST', reason: 'Marked as lost by user' });
      await fetchLeadDetails();
    } catch (err) {
      alert('Failed to update lead');
      console.error(err);
    }
  };

  const handleSelectQuote = async (quoteId) => {
    try {
      await api.post(`/insurance/leads/${id}/quotes/${quoteId}/select`);
      await fetchLeadDetails();
    } catch (err) {
      alert('Failed to select quote');
      console.error(err);
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'CONVERTED': return 'bg-green-100 text-green-800';
      case 'LOST': case 'JUNK': return 'bg-red-100 text-red-800';
      case 'PROPOSAL_STAGE': case 'PAYMENT_PENDING': return 'bg-orange-100 text-orange-800';
      case 'QUOTE_SHARED': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
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

  const activities = lead.activities || [];
  const quotes = lead.quotes || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">{lead.customerName}</h1>
              <span className={`px-3 py-1 rounded-full font-medium text-sm ${getStatusBadgeColor(lead.status)}`}>
                {displayStatus(lead.status)}
              </span>
            </div>
            <p className="text-gray-500 mt-1 font-mono text-sm">{lead.leadCode}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-teal-100 text-teal-800">
                {displayLOB(lead.lob)}
              </span>
              {lead.posp && (
                <span className="text-xs text-gray-500">
                  POSP: {lead.posp.firstName} {lead.posp.lastName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Phone</p>
                <a href={`tel:${lead.customerPhone}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">
                  {lead.customerPhone || 'Not specified'}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Email</p>
                {lead.customerEmail ? (
                  <a href={`mailto:${lead.customerEmail}`} className="text-sm font-medium text-gray-900 hover:text-teal-600">
                    {lead.customerEmail}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400">Not specified</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Location</p>
                <p className="text-sm font-medium text-gray-900">
                  {[lead.customerCity, lead.customerState, lead.customerPincode].filter(Boolean).join(', ') || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Tag className="w-5 h-5 text-teal-600" />
              <div>
                <p className="text-xs text-gray-600">Source</p>
                <p className="text-sm font-medium text-gray-900">{displaySource(lead.source)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-teal-50 rounded-lg p-3">
              <p className="text-xs text-teal-700 font-medium">Quoted Premium</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {formatCurrency(lead.quotedPremium || lead.idv || 0)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Lead Age</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{computeLeadAge(lead.createdAt)} days</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Quotes</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{quotes.length}</p>
              </div>
            </div>

            {/* Vehicle info for motor leads */}
            {lead.lob?.startsWith('MOTOR') && (lead.vehicleMake || lead.vehicleRegNumber) && (
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 font-medium">Vehicle</p>
                <p className="text-sm font-bold text-gray-900 mt-1">
                  {[lead.vehicleMake, lead.vehicleModel, lead.vehicleVariant].filter(Boolean).join(' ')}
                  {lead.vehicleRegNumber && <span className="ml-2 text-gray-500">({lead.vehicleRegNumber})</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quotes Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Quotes ({quotes.length})</h2>
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
                className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors ${
                  quote.isSelected ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-gray-900">{quote.insurerName}</h3>
                      {quote.isSelected && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-700">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{quote.productName}</p>
                    {quote.coverageDetails && (
                      <p className="text-xs text-gray-500 mt-1">{typeof quote.coverageDetails === 'string' ? quote.coverageDetails : JSON.stringify(quote.coverageDetails)}</p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-teal-600">{formatCurrency(quote.totalPremium || quote.premium)}</p>
                    <p className="text-xs text-gray-500">Sum: {formatCurrency(quote.sumInsured)}</p>
                    {quote.validTill && (
                      <p className="text-xs text-gray-500 mt-1">Valid: {formatDate(quote.validTill)}</p>
                    )}
                  </div>
                </div>
                {!quote.isSelected && lead.status !== 'CONVERTED' && lead.status !== 'LOST' && (
                  <button
                    onClick={() => handleSelectQuote(quote.id)}
                    className="mt-3 text-xs text-teal-600 hover:text-teal-700 font-medium"
                  >
                    Select this quote
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No quotes added yet</p>
        )}
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Activity Timeline ({activities.length})</h2>
          <button
            onClick={() => setShowActivityModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Note
          </button>
        </div>
        {activities.length > 0 ? (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="w-3 h-3 rounded-full bg-teal-600 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action?.replace(/_/g, ' ')}</p>
                  {activity.description && (
                    <p className="text-xs text-gray-600 mt-1">{activity.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{formatDate(activity.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No activity yet</p>
        )}
      </div>

      {/* Action Buttons */}
      {lead.status !== 'CONVERTED' && lead.status !== 'LOST' && lead.status !== 'JUNK' && (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleConvertToPolicy}
            className="py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="w-4 h-4" />
            Convert to Policy
          </button>

          <button
            onClick={handleMarkLost}
            className="py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white"
          >
            <X className="w-4 h-4" />
            Mark Lost
          </button>
        </div>
      )}

      {/* Add Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Add Quote</h2>
              <button onClick={() => setShowQuoteModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddQuote} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Insurance Company *</label>
                <input
                  type="text"
                  value={quoteForm.insurerName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, insurerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={quoteForm.productName}
                  onChange={(e) => setQuoteForm({ ...quoteForm, productName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sum Insured *</label>
                  <input
                    type="number"
                    value={quoteForm.sumInsured}
                    onChange={(e) => setQuoteForm({ ...quoteForm, sumInsured: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Premium *</label>
                  <input
                    type="number"
                    value={quoteForm.premium}
                    onChange={(e) => setQuoteForm({ ...quoteForm, premium: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GST *</label>
                  <input
                    type="number"
                    value={quoteForm.gst}
                    onChange={(e) => setQuoteForm({ ...quoteForm, gst: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Premium *</label>
                  <input
                    type="number"
                    value={quoteForm.totalPremium}
                    onChange={(e) => setQuoteForm({ ...quoteForm, totalPremium: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valid Until</label>
                <input
                  type="date"
                  value={quoteForm.validTill}
                  onChange={(e) => setQuoteForm({ ...quoteForm, validTill: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
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

      {/* Add Activity Modal */}
      {showActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Add Activity Note</h2>
              <button onClick={() => setShowActivityModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddActivity} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action *</label>
                <select
                  value={activityForm.action}
                  onChange={(e) => setActivityForm({ ...activityForm, action: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                >
                  <option value="">Select action...</option>
                  <option value="PHONE_CALL">Phone Call</option>
                  <option value="WHATSAPP_MESSAGE">WhatsApp Message</option>
                  <option value="EMAIL_SENT">Email Sent</option>
                  <option value="MEETING">Meeting</option>
                  <option value="FOLLOW_UP_SCHEDULED">Follow-up Scheduled</option>
                  <option value="DOCUMENT_RECEIVED">Document Received</option>
                  <option value="NOTE">General Note</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={activityForm.description}
                  onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  rows="3"
                  placeholder="Add details about this activity..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowActivityModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Add Activity
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
