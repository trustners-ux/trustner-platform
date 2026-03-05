import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AlertCircle,
  Download,
  Upload,
  FileText,
  Calendar,
  DollarSign,
  Shield,
  User,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const PolicyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    documents: true,
    endorsements: true,
    claims: true,
    timeline: true,
  });

  useEffect(() => {
    fetchPolicyDetails();
  }, [id]);

  const fetchPolicyDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/insurance/policies/${id}`);
      setPolicy(res.data);
    } catch (err) {
      setError('Failed to load policy details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
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

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await api.post(`/insurance/policies/${id}/documents`, formData);
      setPolicy({
        ...policy,
        documents: [...(policy.documents || []), res.data],
      });
    } catch (err) {
      alert('Failed to upload document');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading policy details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/insurance/policies')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Policies
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">Policy not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/policies')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Policies
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
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{policy.policyNo}</h1>
            <p className="text-gray-600 mt-2">{policy.customerName}</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium text-sm ${getStatusColor(policy.status)}`}>
            {policy.status}
          </span>
        </div>

        {/* Status Stepper */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Policy Status</h3>
          <div className="flex items-center justify-between">
            {['Quoted', 'Active', 'Renewed', 'Lapsed'].map((step, idx) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                    idx < 2
                      ? 'bg-teal-600 text-white'
                      : idx === 2
                      ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-400'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <p className="text-xs font-medium text-gray-900">{step}</p>
                {idx < 3 && (
                  <div className={`hidden md:block h-1 w-full mt-2 ${idx < 1 ? 'bg-teal-600' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-6">
          <div>
            <p className="text-xs text-gray-600 font-medium">LOB</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{policy.lob}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Company</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{policy.company}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Premium</p>
            <p className="text-sm font-bold text-teal-600 mt-1">{formatCurrency(policy.premium)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Start Date</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{policy.startDate}</p>
          </div>
        </div>
      </div>

      {/* Customer Info Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Customer Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Full Name</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{policy.customerName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Phone</p>
                <a href={`tel:${policy.customerPhone}`} className="text-sm font-bold text-teal-600 hover:underline mt-1">
                  {policy.customerPhone}
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Address</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{policy.customerAddress}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LOB-Specific Details */}
      {policy.lob === 'Motor 4W' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Vehicle Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-600 font-medium">Registration Number</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.vehicleReg}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Model</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.vehicleModel}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">IDV</p>
              <p className="text-sm font-bold text-teal-600 mt-1">{formatCurrency(policy.idv)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">NCB</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.ncb}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={() => toggleSection('documents')}
          className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-900">Documents</h2>
          {expandedSections.documents ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {expandedSections.documents && (
          <div className="space-y-4 border-t border-gray-200 pt-4">
            {policy.documents && policy.documents.length > 0 ? (
              <div className="space-y-2">
                {policy.documents.map((doc) => (
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
              <p className="text-gray-500 text-sm">No documents uploaded</p>
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
        )}
      </div>

      {/* Endorsements Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={() => toggleSection('endorsements')}
          className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-900">Endorsements</h2>
          {expandedSections.endorsements ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {expandedSections.endorsements && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            {policy.endorsements && policy.endorsements.length > 0 ? (
              policy.endorsements.map((endorsement) => (
                <div key={endorsement.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{endorsement.type}</p>
                      <p className="text-sm text-gray-600 mt-1">{endorsement.description}</p>
                      <p className="text-xs text-gray-500 mt-2">{endorsement.date}</p>
                    </div>
                    <span className="text-xs font-medium px-2 py-1 bg-teal-100 text-teal-800 rounded">
                      {endorsement.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No endorsements</p>
            )}
          </div>
        )}
      </div>

      {/* Claims Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <button
          onClick={() => toggleSection('claims')}
          className="w-full flex items-center justify-between mb-4 hover:bg-gray-50 p-2 rounded-lg transition-colors"
        >
          <h2 className="text-lg font-bold text-gray-900">Claims</h2>
          {expandedSections.claims ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>

        {expandedSections.claims && (
          <div className="space-y-3 border-t border-gray-200 pt-4">
            {policy.claims && policy.claims.length > 0 ? (
              policy.claims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => navigate(`/insurance/claims/${claim.id}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{claim.claimNo}</p>
                      <p className="text-sm text-gray-600 mt-1">{claim.type}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-teal-600">{formatCurrency(claim.amount)}</p>
                      <span className="text-xs font-medium px-2 py-1 bg-yellow-100 text-yellow-800 rounded mt-1 inline-block">
                        {claim.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No claims filed</p>
            )}
          </div>
        )}
      </div>

      {/* Commission Info */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-teal-900 mb-4">Commission Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-teal-800">Commission %</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{policy.commissionPercent}%</p>
          </div>
          <div>
            <p className="text-sm text-teal-800">Commission Amount</p>
            <p className="text-2xl font-bold text-teal-900 mt-1">{formatCurrency(policy.commissionAmount)}</p>
          </div>
          <div>
            <p className="text-sm text-teal-800">Status</p>
            <p className="text-sm font-bold text-teal-900 mt-1">{policy.commissionStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetail;
