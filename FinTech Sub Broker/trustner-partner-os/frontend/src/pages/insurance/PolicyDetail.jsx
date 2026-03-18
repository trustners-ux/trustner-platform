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
  Mail,
  ChevronDown,
  ChevronUp,
  Car,
  Heart,
  Umbrella,
  Hash,
  Clock,
  IndianRupee,
} from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/formatters';

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
      setError(null);
      const data = await api.get(`/insurance/policies/${id}`);
      // The axios interceptor already unwraps { success, data } → data
      // So 'data' here is the policy object directly
      setPolicy(data);
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
      ACTIVE: 'bg-green-100 text-green-800',
      QUOTE_GENERATED: 'bg-blue-100 text-blue-800',
      PROPOSAL_SUBMITTED: 'bg-indigo-100 text-indigo-800',
      ISSUED: 'bg-green-100 text-green-800',
      EXPIRED: 'bg-red-100 text-red-800',
      PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
      LAPSED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      RENEWED: 'bg-teal-100 text-teal-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  const formatStatusLabel = (status) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatLOB = (lob) => {
    if (!lob) return 'N/A';
    return lob.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const isMotorPolicy = (lob) => {
    if (!lob) return false;
    return lob.startsWith('MOTOR_');
  };

  const isHealthPolicy = (lob) => {
    if (!lob) return false;
    return lob.startsWith('HEALTH_');
  };

  const isLifePolicy = (lob) => {
    if (!lob) return false;
    return lob.startsWith('LIFE_');
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('document', file);
      const docData = await api.post(`/insurance/policies/${id}/documents`, formData);
      setPolicy({
        ...policy,
        documents: [...(policy.documents || []), docData],
      });
    } catch (err) {
      alert('Failed to upload document');
      console.error(err);
    }
  };

  const safeDate = (d) => {
    if (!d) return 'N/A';
    try {
      return typeof formatDate === 'function' ? formatDate(d) : new Date(d).toLocaleDateString('en-IN');
    } catch {
      return 'N/A';
    }
  };

  const safeCurrency = (v) => {
    if (v === null || v === undefined) return 'N/A';
    try {
      return formatCurrency(v);
    } catch {
      return `₹${Number(v).toLocaleString('en-IN')}`;
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
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Policy not found</p>
          {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Extract commission info from the commissions relation
  const latestCommission = policy.commissions?.[0];

  // Status stepper: determine current step index
  const statusSteps = ['QUOTE_GENERATED', 'PROPOSAL_SUBMITTED', 'ISSUED', 'ACTIVE'];
  const currentStepIndex = statusSteps.indexOf(policy.status);
  const effectiveStep = currentStepIndex >= 0 ? currentStepIndex : (policy.status === 'RENEWED' ? 4 : policy.status === 'EXPIRED' || policy.status === 'LAPSED' ? -1 : 1);

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
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{policy.policyNumber}</h1>
            <p className="text-gray-600 mt-1">{policy.internalRefCode}</p>
            <p className="text-lg text-gray-800 mt-2 font-medium">{policy.customerName}</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium text-sm ${getStatusColor(policy.status)}`}>
            {formatStatusLabel(policy.status)}
          </span>
        </div>

        {/* Status Stepper */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Policy Lifecycle</h3>
          <div className="flex items-center justify-between">
            {['Quote', 'Proposal', 'Issued', 'Active'].map((step, idx) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mb-2 ${
                    idx <= effectiveStep
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {idx + 1}
                </div>
                <p className="text-xs font-medium text-gray-900">{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Key Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-6">
          <div>
            <p className="text-xs text-gray-600 font-medium">LOB</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{formatLOB(policy.lob)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Company</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{policy.company?.companyName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Product</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{policy.product?.productName || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">POSP</p>
            <p className="text-sm font-bold text-gray-900 mt-1">
              {policy.posp ? `${policy.posp.firstName} ${policy.posp.lastName}` : 'N/A'}
            </p>
          </div>
        </div>

        {/* Premium & Dates Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-t border-gray-200 pt-6">
          <div>
            <p className="text-xs text-gray-600 font-medium">Total Premium</p>
            <p className="text-sm font-bold text-teal-600 mt-1">{safeCurrency(policy.totalPremium)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Sum Insured</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{safeCurrency(policy.sumInsured)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Start Date</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{safeDate(policy.startDate)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">End Date</p>
            <p className="text-sm font-bold text-gray-900 mt-1">{safeDate(policy.endDate)}</p>
          </div>
        </div>

        {/* Premium Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 border-t border-gray-200 pt-6">
          <div>
            <p className="text-xs text-gray-600 font-medium">Base Premium</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{safeCurrency(policy.basePremium)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Add-On Premium</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{safeCurrency(policy.addOnPremium)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">GST</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{safeCurrency(policy.gstAmount)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Stamp Duty</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{safeCurrency(policy.stampDuty)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 font-medium">Net Premium</p>
            <p className="text-sm font-semibold text-gray-900 mt-1">{safeCurrency(policy.netPremium)}</p>
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
                {policy.customerPhone ? (
                  <a href={`tel:${policy.customerPhone}`} className="text-sm font-bold text-teal-600 hover:underline mt-1">
                    {policy.customerPhone}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Not available</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-teal-600 mt-1" />
              <div>
                <p className="text-xs text-gray-600 font-medium">Email</p>
                {policy.customerEmail ? (
                  <a href={`mailto:${policy.customerEmail}`} className="text-sm font-bold text-teal-600 hover:underline mt-1">
                    {policy.customerEmail}
                  </a>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">Not available</p>
                )}
              </div>
            </div>

            {(policy.nomineeName || policy.nomineeRelation) && (
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-teal-600 mt-1" />
                <div>
                  <p className="text-xs text-gray-600 font-medium">Nominee</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">
                    {policy.nomineeName || 'N/A'} {policy.nomineeRelation ? `(${policy.nomineeRelation})` : ''}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Motor Vehicle Details */}
      {isMotorPolicy(policy.lob) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-teal-600" />
            Vehicle Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-600 font-medium">Registration Number</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.vehicleRegNumber || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Make & Model</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {[policy.vehicleMake, policy.vehicleModel].filter(Boolean).join(' ') || 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">IDV</p>
              <p className="text-sm font-bold text-teal-600 mt-1">{safeCurrency(policy.idv)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">NCB</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {policy.ncbPercentage != null ? `${policy.ncbPercentage}%` : 'N/A'}
              </p>
            </div>
            {policy.policyType && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Policy Type</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{policy.policyType}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Policy Details */}
      {isHealthPolicy(policy.lob) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Heart className="w-5 h-5 text-teal-600" />
            Health Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policy.waitingPeriod && (
              <div>
                <p className="text-xs text-gray-600 font-medium">Waiting Period</p>
                <p className="text-sm font-bold text-gray-900 mt-1">{policy.waitingPeriod} days</p>
              </div>
            )}
            {policy.membersDetails && (
              <div className="col-span-2">
                <p className="text-xs text-gray-600 font-medium mb-2">Members Covered</p>
                <pre className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg overflow-x-auto">
                  {typeof policy.membersDetails === 'string'
                    ? policy.membersDetails
                    : JSON.stringify(policy.membersDetails, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Info */}
      {(policy.paymentMode || policy.paymentRefId || policy.paymentDate) && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-gray-600 font-medium">Payment Mode</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.paymentMode || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Payment Ref</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{policy.paymentRefId || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Payment Date</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{safeDate(policy.paymentDate)}</p>
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
          <h2 className="text-lg font-bold text-gray-900">
            Documents {policy.documents?.length > 0 && `(${policy.documents.length})`}
          </h2>
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
                        <p className="text-sm font-medium text-gray-900">{doc.documentType || doc.name || 'Document'}</p>
                        <p className="text-xs text-gray-600">{safeDate(doc.createdAt || doc.uploadedAt)}</p>
                      </div>
                    </div>
                    {(doc.fileUrl || doc.url) && (
                      <a
                        href={doc.fileUrl || doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                    )}
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
          <h2 className="text-lg font-bold text-gray-900">
            Endorsements {policy.endorsements?.length > 0 && `(${policy.endorsements.length})`}
          </h2>
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
                      <p className="font-medium text-gray-900">
                        {endorsement.endorsementNumber || endorsement.type || 'Endorsement'}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {endorsement.endorsementType || endorsement.description || ''}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">{safeDate(endorsement.createdAt || endorsement.date)}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      endorsement.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      endorsement.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {formatStatusLabel(endorsement.status)}
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
          <h2 className="text-lg font-bold text-gray-900">
            Claims {policy.claims?.length > 0 && `(${policy.claims.length})`}
          </h2>
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
                      <p className="font-medium text-gray-900">{claim.claimNumber || claim.claimNo}</p>
                      <p className="text-sm text-gray-600 mt-1">{claim.claimType || claim.type}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-sm font-bold text-teal-600">{safeCurrency(claim.claimAmount || claim.amount)}</p>
                      <span className={`text-xs font-medium px-2 py-1 rounded mt-1 inline-block ${
                        claim.status === 'SETTLED' ? 'bg-green-100 text-green-800' :
                        claim.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {formatStatusLabel(claim.status)}
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
        {latestCommission ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-teal-800">Commission %</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {latestCommission.commissionPercentage || latestCommission.commissionPercent || 'N/A'}%
              </p>
            </div>
            <div>
              <p className="text-sm text-teal-800">Commission Amount</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">
                {safeCurrency(latestCommission.commissionAmount || latestCommission.amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-teal-800">Status</p>
              <p className="text-sm font-bold text-teal-900 mt-1">
                {formatStatusLabel(latestCommission.status) || 'N/A'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-teal-700 text-sm">No commission records available</p>
        )}
      </div>

      {/* Remarks */}
      {policy.remarks && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Remarks</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{policy.remarks}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500">
          <div>
            <p className="font-medium">Created</p>
            <p>{safeDate(policy.createdAt)}</p>
          </div>
          <div>
            <p className="font-medium">Updated</p>
            <p>{safeDate(policy.updatedAt)}</p>
          </div>
          <div>
            <p className="font-medium">Issuance Date</p>
            <p>{safeDate(policy.issuanceDate)}</p>
          </div>
          <div>
            <p className="font-medium">Proposal Date</p>
            <p>{safeDate(policy.proposalDate)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PolicyDetail;
