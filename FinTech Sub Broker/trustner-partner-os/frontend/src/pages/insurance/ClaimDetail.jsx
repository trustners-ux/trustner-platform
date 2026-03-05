import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Upload,
  FileText,
  Download,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [claim, setClaim] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionForm, setActionForm] = useState({
    notes: '',
    amount: '',
  });

  useEffect(() => {
    fetchClaimDetails();
  }, [id]);

  const fetchClaimDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/insurance/claims/${id}`);
      setClaim(res.data);
    } catch (err) {
      setError('Failed to load claim details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    try {
      const payload = {
        action,
        ...actionForm,
      };

      const res = await api.patch(`/insurance/claims/${id}`, payload);
      setClaim(res.data);
      setShowActionModal(false);
      setActionForm({ notes: '', amount: '' });
    } catch (err) {
      alert('Failed to perform action');
      console.error(err);
    }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await api.post(`/insurance/claims/${id}/documents`, formData);
      setClaim({
        ...claim,
        documents: [...(claim.documents || []), res.data],
      });
    } catch (err) {
      alert('Failed to upload document');
      console.error(err);
    }
  };

  const getStatusSteps = () => {
    const steps = ['Intimated', 'Docs', 'Surveyor', 'Approved', 'Settled'];
    const currentIndex = steps.indexOf(claim?.status);
    return steps.map((step, idx) => ({
      label: step,
      completed: idx <= currentIndex,
      current: idx === currentIndex,
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'Rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'Pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading claim details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/insurance/claims')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Claims
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Claim not found</p>
        </div>
      </div>
    );
  }

  const steps = getStatusSteps();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/claims')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Claims
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

      {/* Header Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{claim.claimNo}</h1>
            <p className="text-gray-600 mt-2">{claim.policyNo}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(claim.status)}
            <span className={`px-4 py-2 rounded-full font-medium text-sm ${
              claim.status === 'Approved'
                ? 'bg-green-100 text-green-800'
                : claim.status === 'Rejected'
                ? 'bg-red-100 text-red-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {claim.status}
            </span>
          </div>
        </div>

        {/* Status Stepper */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Claim Progress</h3>
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.label} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                    step.completed
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step.completed ? '✓' : idx + 1}
                </div>
                <p className="text-xs font-medium text-gray-900 text-center">{step.label}</p>
                {idx < steps.length - 1 && (
                  <div
                    className={`hidden md:block h-1 w-full mt-2 ${
                      step.completed ? 'bg-teal-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Claim Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Claim Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-600 font-medium">Customer Name</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{claim.customerName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Contact</p>
            <a href={`tel:${claim.customerPhone}`} className="text-sm font-bold text-teal-600 hover:underline mt-1">
              {claim.customerPhone}
            </a>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Claim Type</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{claim.type}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Date of Incident</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{claim.incidentDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Intimated Date</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{claim.intimatedDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Description</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{claim.description}</p>
          </div>
        </div>
      </div>

      {/* Amount Breakdown */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-teal-900 mb-6">Amount Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-teal-800">Claimed Amount</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{formatCurrency(claim.claimedAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-teal-800">Approved Amount</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{formatCurrency(claim.approvedAmount || 0)}</p>
          </div>
          <div>
            <p className="text-sm text-teal-800">Settled Amount</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{formatCurrency(claim.settledAmount || 0)}</p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Documents</h2>
        {claim.documents && claim.documents.length > 0 ? (
          <div className="space-y-3 mb-6">
            {claim.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-teal-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                    <p className="text-xs text-gray-600">{doc.uploadedAt}</p>
                  </div>
                </div>
                <a
                  href={doc.url}
                  download
                  className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm mb-6">No documents uploaded</p>
        )}

        <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-600 hover:bg-teal-50 cursor-pointer transition-colors">
          <Upload className="w-5 h-5 text-teal-600" />
          <span className="text-sm font-medium text-teal-600">Upload Document</span>
          <input
            type="file"
            onChange={handleDocumentUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Assignment Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Assignment</h2>
        {claim.assignedTo ? (
          <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <User className="w-5 h-5 text-teal-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">{claim.assignedTo}</p>
              <p className="text-xs text-gray-600">{claim.assignedToRole}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500 text-sm">Not assigned</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {claim.status === 'Intimated' && (
          <>
            <button
              onClick={() => {
                setSelectedAction('assign');
                setShowActionModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Assign
            </button>
            <button
              onClick={() => {
                setSelectedAction('surveyor');
                setShowActionModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Surveyor
            </button>
          </>
        )}

        {claim.status === 'Surveyor' && (
          <>
            <button
              onClick={() => {
                setSelectedAction('approve');
                setShowActionModal(true);
              }}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Approve
            </button>
            <button
              onClick={() => {
                setSelectedAction('reject');
                setShowActionModal(true);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
            >
              Reject
            </button>
          </>
        )}

        {claim.status === 'Approved' && (
          <button
            onClick={() => {
              setSelectedAction('settle');
              setShowActionModal(true);
            }}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm md:col-span-2"
          >
            Mark Settled
          </button>
        )}
      </div>

      {/* Action Modal */}
      {showActionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedAction === 'assign' && 'Assign Claim'}
                {selectedAction === 'surveyor' && 'Appoint Surveyor'}
                {selectedAction === 'approve' && 'Approve Claim'}
                {selectedAction === 'reject' && 'Reject Claim'}
                {selectedAction === 'settle' && 'Settle Claim'}
              </h2>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); handleAction(selectedAction); }} className="p-6 space-y-4">
              {selectedAction === 'approve' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Approved Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={actionForm.amount}
                    onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              )}

              {selectedAction === 'settle' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Settlement Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={actionForm.amount}
                    onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              )}

              {(selectedAction === 'reject' || selectedAction === 'surveyor') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    value={actionForm.notes}
                    onChange={(e) => setActionForm({ ...actionForm, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    rows="3"
                    required
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowActionModal(false);
                    setActionForm({ notes: '', amount: '' });
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimDetail;
