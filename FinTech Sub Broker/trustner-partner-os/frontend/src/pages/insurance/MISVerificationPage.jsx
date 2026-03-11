import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  AlertCircle,
  CheckCircle,
  XCircle,
  Eye,
  X,
  Clock,
  Filter,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import misAPI from '../../services/mis';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuth } from '../../contexts/AuthContext';

const LOB_LABELS = {
  MOTOR_TWO_WHEELER: 'Motor 2W',
  MOTOR_FOUR_WHEELER: 'Motor 4W',
  MOTOR_COMMERCIAL: 'Motor Comm.',
  HEALTH_INDIVIDUAL: 'Health Ind.',
  HEALTH_FAMILY_FLOATER: 'Health FF',
  HEALTH_GROUP: 'Health Grp',
  HEALTH_CRITICAL_ILLNESS: 'Health CI',
  HEALTH_TOP_UP: 'Health Top-Up',
  LIFE_TERM: 'Life Term',
  LIFE_ENDOWMENT: 'Life Endow.',
  LIFE_ULIP: 'Life ULIP',
  LIFE_WHOLE_LIFE: 'Life WL',
  TRAVEL: 'Travel',
  HOME: 'Home',
  FIRE: 'Fire',
  MARINE: 'Marine',
  LIABILITY: 'Liability',
  PA_PERSONAL_ACCIDENT: 'PA',
  CYBER: 'Cyber',
};

const STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-800',
  PENDING_VERIFICATION: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  AMENDMENT_REQUESTED: 'bg-orange-100 text-orange-800',
};

const DEPARTMENTS = ['All', 'Health', 'Life', 'General', 'Motor', 'Travel'];

const MISVerificationPage = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignedOnly, setShowAssignedOnly] = useState(false);
  const [filters, setFilters] = useState({
    department: 'All',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [verifyAction, setVerifyAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const params = { status: 'PENDING_VERIFICATION' };
      if (filters.department !== 'All') params.department = filters.department;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;

      const res = await misAPI.getPendingVerification(params);
      setEntries(res.data?.data || res.data || []);
    } catch (err) {
      setError('Failed to load verification queue');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Sort: assigned to me first
  const sortedEntries = React.useMemo(() => {
    let list = [...entries];
    if (showAssignedOnly) {
      list = list.filter((e) => e.assignedCheckerId === authUser?.id);
    } else {
      // Sort assigned-to-me to top
      list.sort((a, b) => {
        const aAssigned = a.assignedCheckerId === authUser?.id ? 0 : 1;
        const bAssigned = b.assignedCheckerId === authUser?.id ? 0 : 1;
        return aAssigned - bAssigned;
      });
    }
    return list;
  }, [entries, showAssignedOnly, authUser?.id]);

  const assignedCount = entries.filter((e) => e.assignedCheckerId === authUser?.id).length;

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    fetchEntries();
  };

  const handleOpenReview = (entry) => {
    setSelectedEntry(entry);
    setShowModal(true);
    setRemarks('');
    setVerifyAction('');
  };

  const handleVerify = async (action) => {
    if (!selectedEntry) return;
    try {
      setActionLoading(true);
      await misAPI.verify(selectedEntry.id, {
        action,
        remarks,
      });
      setShowModal(false);
      setSelectedEntry(null);
      setRemarks('');
      setVerifyAction('');
      fetchEntries();
    } catch (err) {
      setError(err.response?.data?.message || 'Verification action failed');
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading verification queue...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MIS Verification</h1>
        <p className="text-gray-600 mt-2">Review and verify MIS entries submitted by makers</p>
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

      {/* Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-600 mb-1">Department</label>
            <select
              value={filters.department}
              onChange={(e) => handleFilterChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={() => setShowAssignedOnly(!showAssignedOnly)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showAssignedOnly
                ? 'bg-teal-600 text-white'
                : 'border border-teal-300 text-teal-700 hover:bg-teal-50'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Assigned to me {assignedCount > 0 && `(${assignedCount})`}
          </button>
          <button
            onClick={handleApplyFilters}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
          >
            <Filter className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>

      {/* Entries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">MIS Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Department</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">POSP</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Maker</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Date</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.length > 0 ? (
                sortedEntries.map((entry, idx) => {
                  const isAssignedToMe = entry.assignedCheckerId === authUser?.id;
                  return (
                  <tr
                    key={entry.id}
                    className={`border-t border-gray-200 ${
                      isAssignedToMe ? 'bg-teal-50/50' : idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-teal-50 transition-colors`}
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-teal-600">{entry.misCode || '-'}</span>
                      {isAssignedToMe && (
                        <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-semibold">
                          <UserCheck className="w-3 h-3" /> Assigned to you
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-900">{entry.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{LOB_LABELS[entry.lob] || entry.lob}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.department || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.pospName || '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">
                      {formatCurrency(entry.grossPremium)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{entry.makerName || entry.createdBy || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(entry.createdAt)}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleOpenReview(entry)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-medium text-xs transition-colors mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Review
                      </button>
                    </td>
                  </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No entries pending verification</p>
                    <p className="text-sm mt-1">All entries have been processed</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Review MIS Entry</h2>
                <p className="text-sm text-gray-600 mt-1">{selectedEntry.misCode || 'No MIS Code'}</p>
              </div>
              <button
                onClick={() => { setShowModal(false); setSelectedEntry(null); }}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Entry Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Customer Name</p>
                  <p className="font-medium text-gray-900">{selectedEntry.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900">{selectedEntry.customerPhone || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{selectedEntry.customerEmail || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Policy Number</p>
                  <p className="font-medium text-gray-900">{selectedEntry.policyNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">LOB</p>
                  <p className="font-medium text-gray-900">{LOB_LABELS[selectedEntry.lob] || selectedEntry.lob}</p>
                </div>
                <div>
                  <p className="text-gray-500">Insurer</p>
                  <p className="font-medium text-gray-900">{selectedEntry.insurerName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Product</p>
                  <p className="font-medium text-gray-900">{selectedEntry.productName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Sum Insured</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedEntry.sumInsured)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Gross Premium</p>
                  <p className="font-bold text-teal-600">{formatCurrency(selectedEntry.grossPremium)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Net Premium</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedEntry.netPremium)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Commission</p>
                  <p className="font-medium text-green-600">{formatCurrency(selectedEntry.commissionAmount)}</p>
                </div>
                <div>
                  <p className="text-gray-500">POSP</p>
                  <p className="font-medium text-gray-900">
                    {selectedEntry.pospName || '-'} {selectedEntry.pospCode ? `(${selectedEntry.pospCode})` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Policy Start</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedEntry.policyStartDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Policy End</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedEntry.policyEndDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Renewal</p>
                  <p className="font-medium text-gray-900">{selectedEntry.isRenewal ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-gray-500">New Customer</p>
                  <p className="font-medium text-gray-900">{selectedEntry.isNewCustomer ? 'Yes' : 'No'}</p>
                </div>
              </div>

              {selectedEntry.makerRemarks && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs font-medium text-gray-500 mb-1">Maker Remarks</p>
                  <p className="text-sm text-gray-700">{selectedEntry.makerRemarks}</p>
                </div>
              )}

              {/* Checker Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Verification Remarks</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  placeholder="Add your verification remarks..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleVerify('APPROVE')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
                <button
                  onClick={() => handleVerify('REJECT')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => handleVerify('REQUEST_AMENDMENT')}
                  disabled={actionLoading}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Request Amendment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MISVerificationPage;
