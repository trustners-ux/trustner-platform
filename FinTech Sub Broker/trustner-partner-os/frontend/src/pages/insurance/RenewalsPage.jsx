import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Send, AlertCircle, CheckCircle, XCircle, RefreshCw, Filter } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

// Map backend RenewalStatus enums to display-friendly groups
const PENDING_STATUSES = [
  'UPCOMING_90_DAYS', 'UPCOMING_60_DAYS', 'UPCOMING_30_DAYS',
  'UPCOMING_15_DAYS', 'DUE', 'OVERDUE',
];

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
};

const computeDaysLeft = (expiryDate) => {
  if (!expiryDate) return 999;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
};

const RenewalsPage = () => {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grouped');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    dueThisMonth: 0,
    renewed: 0,
    lapsed: 0,
    total: 0,
  });

  useEffect(() => {
    fetchRenewals();
  }, [page, statusFilter]);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = { page, limit: 100 };
      if (statusFilter !== 'all') params.status = statusFilter;

      const [renewalsRes, statsRes] = await Promise.all([
        api.get('/insurance/renewals', { params }),
        api.get('/insurance/renewals/stats'),
      ]);

      // Enrich each renewal with computed daysLeft
      const enriched = (renewalsRes.data || []).map((r) => ({
        ...r,
        daysLeft: computeDaysLeft(r.expiryDate),
        displayStatus: PENDING_STATUSES.includes(r.status) ? 'Pending'
          : r.status === 'RENEWED' ? 'Renewed'
          : r.status === 'LAPSED' ? 'Lapsed'
          : r.status === 'LOST_TO_COMPETITOR' ? 'Lost'
          : r.status,
      }));

      setRenewals(enriched);
      setTotalPages(renewalsRes.totalPages || 1);
      setStats(statsRes);
    } catch (err) {
      setError('Failed to load renewals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRenewed = async (renewalId) => {
    try {
      await api.post(`/insurance/renewals/${renewalId}/mark-renewed`, { newPolicyId: '' });
      setRenewals(
        renewals.map((r) =>
          r.id === renewalId
            ? { ...r, status: 'RENEWED', displayStatus: 'Renewed' }
            : r
        )
      );
      const statsRes = await api.get('/insurance/renewals/stats');
      setStats(statsRes);
    } catch (err) {
      alert('Failed to mark as renewed');
      console.error(err);
    }
  };

  const handleMarkLost = async (renewalId) => {
    try {
      await api.post(`/insurance/renewals/${renewalId}/mark-lost`, {
        reason: 'Customer chose another insurer',
      });
      setRenewals(
        renewals.map((r) =>
          r.id === renewalId
            ? { ...r, status: 'LOST_TO_COMPETITOR', displayStatus: 'Lost' }
            : r
        )
      );
      const statsRes = await api.get('/insurance/renewals/stats');
      setStats(statsRes);
    } catch (err) {
      alert('Failed to mark as lost');
      console.error(err);
    }
  };

  const getColorByDaysLeft = (daysLeft) => {
    if (daysLeft < 0) return 'border-red-300 bg-red-50';
    if (daysLeft <= 1) return 'border-red-300 bg-red-50';
    if (daysLeft <= 3) return 'border-orange-300 bg-orange-50';
    if (daysLeft <= 7) return 'border-yellow-300 bg-yellow-50';
    if (daysLeft <= 15) return 'border-blue-300 bg-blue-50';
    return 'border-green-300 bg-green-50';
  };

  const getDaysLeftBadgeColor = (daysLeft) => {
    if (daysLeft < 0) return 'bg-red-600 text-white';
    if (daysLeft <= 1) return 'bg-red-500 text-white';
    if (daysLeft <= 3) return 'bg-orange-500 text-white';
    if (daysLeft <= 7) return 'bg-yellow-500 text-black';
    if (daysLeft <= 15) return 'bg-blue-500 text-white';
    return 'bg-green-500 text-white';
  };

  const groupedRenewals = {
    overdue: renewals.filter((r) => r.daysLeft < 0 && r.displayStatus === 'Pending'),
    dueToday: renewals.filter((r) => r.daysLeft === 0 && r.displayStatus === 'Pending'),
    next7Days: renewals.filter((r) => r.daysLeft > 0 && r.daysLeft <= 7 && r.displayStatus === 'Pending'),
    next15Days: renewals.filter((r) => r.daysLeft > 7 && r.daysLeft <= 15 && r.displayStatus === 'Pending'),
    next30Days: renewals.filter((r) => r.daysLeft > 15 && r.daysLeft <= 30 && r.displayStatus === 'Pending'),
    upcoming: renewals.filter((r) => r.daysLeft > 30 && r.displayStatus === 'Pending'),
    renewed: renewals.filter((r) => r.displayStatus === 'Renewed'),
    lost: renewals.filter((r) => r.displayStatus === 'Lost' || r.displayStatus === 'Lapsed'),
  };

  const RenewalCard = ({ renewal }) => (
    <div className={`border-2 rounded-lg p-4 ${getColorByDaysLeft(renewal.daysLeft)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{renewal.policyNumber}</h3>
          <p className="text-sm text-gray-600 mt-1">{renewal.customerName}</p>
          <p className="text-xs text-gray-500 mt-1">{renewal.lob?.replace(/_/g, ' ')}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${getDaysLeftBadgeColor(renewal.daysLeft)}`}>
          {renewal.daysLeft < 0 ? `${Math.abs(renewal.daysLeft)} days overdue` : `${renewal.daysLeft} days`}
        </span>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-current border-opacity-20">
        <div>
          <p className="text-xs text-gray-600">Premium</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(renewal.premiumAmount)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Company</p>
          <p className="text-sm font-bold text-gray-900">{renewal.companyName}</p>
        </div>
      </div>

      <div className="text-xs text-gray-500 py-2 border-t border-current border-opacity-20">
        Expiry: {formatDate(renewal.expiryDate)}
      </div>

      {renewal.displayStatus === 'Pending' && (
        <div className="flex gap-2 mt-3">
          {renewal.customerPhone && (
            <a
              href={`tel:${renewal.customerPhone}`}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium text-xs transition-colors"
            >
              <Phone className="w-3 h-3" />
              Call
            </a>
          )}
          {renewal.customerPhone && (
            <a
              href={`https://wa.me/${renewal.customerPhone?.replace(/[^0-9]/g, '')}?text=Renewal%20reminder%20for%20policy%20${renewal.policyNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium text-xs transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              WhatsApp
            </a>
          )}
          <button
            onClick={() => handleMarkRenewed(renewal.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded font-medium text-xs transition-colors"
          >
            <CheckCircle className="w-3 h-3" />
            Renewed
          </button>
          <button
            onClick={() => handleMarkLost(renewal.id)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-xs transition-colors"
          >
            <XCircle className="w-3 h-3" />
            Lost
          </button>
        </div>
      )}

      {renewal.displayStatus === 'Renewed' && (
        <div className="mt-3 text-center py-2 bg-green-100 text-green-700 rounded text-xs font-bold">
          Renewed
        </div>
      )}
      {(renewal.displayStatus === 'Lost' || renewal.displayStatus === 'Lapsed') && (
        <div className="mt-3 text-center py-2 bg-red-100 text-red-700 rounded text-xs font-bold">
          {renewal.displayStatus} {renewal.lostReason ? `- ${renewal.lostReason}` : ''}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading renewals...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">Renewal Management</h1>
          <p className="text-gray-600 mt-2">Track and manage policy renewals</p>
        </div>
        <button
          onClick={fetchRenewals}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Tracked</p>
          <p className="text-3xl font-bold mt-2 text-gray-900">{stats.total || 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Due This Month</p>
          <p className="text-3xl font-bold mt-2 text-orange-600">{stats.dueThisMonth}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Renewed</p>
          <p className="text-3xl font-bold mt-2 text-green-600">{stats.renewed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Lapsed</p>
          <p className="text-3xl font-bold mt-2 text-red-600">{stats.lapsed}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Renewal Rate</p>
          <p className="text-3xl font-bold mt-2 text-teal-600">
            {stats.total > 0
              ? Math.round((stats.renewed / stats.total) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Statuses</option>
            <option value="DUE">Due Now</option>
            <option value="OVERDUE">Overdue</option>
            <option value="UPCOMING_15_DAYS">Upcoming 15 Days</option>
            <option value="UPCOMING_30_DAYS">Upcoming 30 Days</option>
            <option value="UPCOMING_60_DAYS">Upcoming 60 Days</option>
            <option value="UPCOMING_90_DAYS">Upcoming 90 Days</option>
            <option value="RENEWED">Renewed</option>
            <option value="LAPSED">Lapsed</option>
            <option value="LOST_TO_COMPETITOR">Lost</option>
          </select>
        </div>

        <div className="flex gap-2 bg-gray-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              viewMode === 'grouped'
                ? 'bg-white text-teal-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Grouped View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-white text-teal-600 shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {renewals.length === 0 && !loading && (
        <div className="text-center py-16">
          <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No renewal trackers found</h3>
          <p className="text-gray-600 mt-2">
            Renewal trackers are created automatically when policies approach expiry.
          </p>
        </div>
      )}

      {/* Grouped View */}
      {viewMode === 'grouped' && renewals.length > 0 && (
        <div className="space-y-6">
          {groupedRenewals.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Overdue ({groupedRenewals.overdue.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.overdue.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.dueToday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Due Today ({groupedRenewals.dueToday.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.dueToday.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.next7Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Next 7 Days ({groupedRenewals.next7Days.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next7Days.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.next15Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">Next 15 Days ({groupedRenewals.next15Days.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next15Days.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.next30Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Next 30 Days ({groupedRenewals.next30Days.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next30Days.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <h2 className="text-lg font-bold text-gray-900">Upcoming ({groupedRenewals.upcoming.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.upcoming.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.renewed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Renewed ({groupedRenewals.renewed.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.renewed.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}

          {groupedRenewals.lost.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Lost / Lapsed ({groupedRenewals.lost.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.lost.map((r) => <RenewalCard key={r.id} renewal={r} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && renewals.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Policy No</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Company</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Expiry</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Days Left</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {renewals.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{r.policyNumber}</td>
                    <td className="px-6 py-4 text-gray-600">{r.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{r.lob?.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4 text-gray-600">{r.companyName}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">{formatCurrency(r.premiumAmount)}</td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(r.expiryDate)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDaysLeftBadgeColor(r.daysLeft)}`}>
                        {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        r.displayStatus === 'Renewed' ? 'bg-green-100 text-green-700' :
                        r.displayStatus === 'Lost' || r.displayStatus === 'Lapsed' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {r.displayStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {r.displayStatus === 'Pending' && (
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => handleMarkRenewed(r.id)}
                            className="px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs font-medium"
                            title="Mark Renewed"
                          >
                            <CheckCircle className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMarkLost(r.id)}
                            className="px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs font-medium"
                            title="Mark Lost"
                          >
                            <XCircle className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default RenewalsPage;
