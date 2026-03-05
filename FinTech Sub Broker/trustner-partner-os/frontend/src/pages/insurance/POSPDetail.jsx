import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertCircle, Download, FileText, Award } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';

const POSPDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [posp, setPOSP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPOSPDetails();
  }, [id]);

  const fetchPOSPDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/insurance/posp/${id}`);
      setPOSP(res.data);
    } catch (err) {
      setError('Failed to load POSP details');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusMap = {
      Active: 'bg-green-100 text-green-800 border-green-300',
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Suspended: 'bg-red-100 text-red-800 border-red-300',
      Inactive: 'bg-gray-100 text-gray-800 border-gray-300',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading POSP details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!posp) {
    return (
      <div className="p-6">
        <button
          onClick={() => navigate('/insurance/posp')}
          className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to POSP List
        </button>
        <div className="text-center py-12">
          <p className="text-gray-600">POSP not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/insurance/posp')}
        className="flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to POSP List
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

      {/* Profile Card */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{posp.name}</h1>
            <p className="text-gray-600 mt-1">Code: {posp.code}</p>
          </div>
          <span className={`px-4 py-2 rounded-full font-medium text-sm border-2 ${getStatusColor(posp.status)}`}>
            {posp.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Email</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{posp.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Phone</p>
              <a href={`tel:${posp.phone}`} className="text-sm font-bold text-teal-600 hover:underline mt-1">
                {posp.phone}
              </a>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Category</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{posp.category}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-600 font-medium">Date of Registration</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{posp.registrationDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600 font-medium">Branch</p>
              <p className="text-sm font-bold text-gray-900 mt-1">{posp.branch || 'Unassigned'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* IRDAI License Info */}
      <div className={`${posp.licenseExpiryDays < 30 ? 'bg-red-50 border-red-200' : 'bg-teal-50 border-teal-200'} border rounded-lg p-6`}>
        <h2 className={`text-lg font-bold ${posp.licenseExpiryDays < 30 ? 'text-red-900' : 'text-teal-900'} mb-4`}>
          IRDAI License
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className={`text-sm font-medium ${posp.licenseExpiryDays < 30 ? 'text-red-800' : 'text-teal-800'}`}>
              License Number
            </p>
            <p className={`text-sm font-bold mt-1 ${posp.licenseExpiryDays < 30 ? 'text-red-900' : 'text-teal-900'}`}>
              {posp.licenseNo}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${posp.licenseExpiryDays < 30 ? 'text-red-800' : 'text-teal-800'}`}>
              Issue Date
            </p>
            <p className={`text-sm font-bold mt-1 ${posp.licenseExpiryDays < 30 ? 'text-red-900' : 'text-teal-900'}`}>
              {posp.licenseIssueDate}
            </p>
          </div>
          <div>
            <p className={`text-sm font-medium ${posp.licenseExpiryDays < 30 ? 'text-red-800' : 'text-teal-800'}`}>
              Expiry Date
            </p>
            <p className={`text-sm font-bold mt-1 ${posp.licenseExpiryDays < 30 ? 'text-red-900' : 'text-teal-900'}`}>
              {posp.licenseExpiryDate}
              {posp.licenseExpiryDays < 30 && (
                <span className="block text-xs font-medium mt-1">⚠️ Expires in {posp.licenseExpiryDays} days</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Training Progress */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Training Progress</h2>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">
                {posp.trainingProgress}% Complete ({posp.trainingHours || 0}/15 hours)
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-teal-600 h-3 rounded-full transition-all"
                style={{ width: `${posp.trainingProgress}%` }}
              />
            </div>
          </div>
        </div>

        {posp.trainingProgress === 100 && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
            <Award className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-green-900">Training Completed</p>
              <p className="text-xs text-green-700 mt-1">Certificate issued on {posp.certificateDate}</p>
            </div>
          </div>
        )}
      </div>

      {/* Performance Dashboard */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
            <p className="text-sm text-teal-800">Policies Sold</p>
            <p className="text-3xl font-bold text-teal-900 mt-1">
              {formatIndianNumber(posp.policiesSold)}
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="text-sm text-blue-800">Total Premium</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">
              {formatCurrency(posp.premium)}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800">Commission Earned</p>
            <p className="text-3xl font-bold text-green-900 mt-1">
              {formatCurrency(posp.commission)}
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <p className="text-sm text-purple-800">Renewal Rate</p>
            <p className="text-3xl font-bold text-purple-900 mt-1">
              {posp.renewalRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Documents</h2>
        {posp.documents && posp.documents.length > 0 ? (
          <div className="space-y-3">
            {posp.documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
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
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  <Download className="w-5 h-5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No documents uploaded</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {posp.status !== 'Active' && (
          <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors text-sm">
            Activate
          </button>
        )}
        {posp.status === 'Active' && (
          <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm">
            Suspend
          </button>
        )}
        {posp.trainingProgress < 100 && (
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm">
            Start Training
          </button>
        )}
        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors text-sm">
          View Policies
        </button>
      </div>
    </div>
  );
};

export default POSPDetail;
