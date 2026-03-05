import React, { useEffect, useState } from 'react';
import { Phone, MessageSquare, Send, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const RenewalsPage = () => {
  const [renewals, setRenewals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grouped');
  const [stats, setStats] = useState({
    dueThisMonth: 0,
    renewed: 0,
    lapsed: 0,
  });

  useEffect(() => {
    fetchRenewals();
  }, []);

  const fetchRenewals = async () => {
    try {
      setLoading(true);
      const [renewalsRes, statsRes] = await Promise.all([
        api.get('/insurance/renewals'),
        api.get('/insurance/renewals/stats'),
      ]);

      setRenewals(renewalsRes.data || []);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to load renewals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (renewalId, action) => {
    try {
      const res = await api.patch(`/insurance/renewals/${renewalId}`, { action });
      setRenewals(
        renewals.map((r) =>
          r.id === renewalId
            ? { ...r, status: action === 'renew' ? 'Renewed' : 'Lost' }
            : r
        )
      );
    } catch (err) {
      alert('Failed to update renewal');
      console.error(err);
    }
  };

  const getColorByDaysLeft = (daysLeft) => {
    if (daysLeft < 0) return 'border-red-300 bg-red-50';
    if (daysLeft <= 1) return 'border-red-300 bg-red-50';
    if (daysLeft <= 3) return 'border-orange-300 bg-orange-50';
    if (daysLeft <= 7) return 'border-yellow-300 bg-yellow-50';
    return 'border-green-300 bg-green-50';
  };

  const getDaysLeftBadgeColor = (daysLeft) => {
    if (daysLeft < 0) return 'bg-red-600 text-white';
    if (daysLeft <= 1) return 'bg-red-500 text-white';
    if (daysLeft <= 3) return 'bg-orange-500 text-white';
    if (daysLeft <= 7) return 'bg-yellow-500 text-black';
    return 'bg-green-500 text-white';
  };

  const groupedRenewals = {
    overdue: renewals.filter((r) => r.daysLeft < 0 && r.status === 'Pending'),
    dueToday: renewals.filter((r) => r.daysLeft === 0 && r.status === 'Pending'),
    next7Days: renewals.filter((r) => r.daysLeft > 0 && r.daysLeft <= 7 && r.status === 'Pending'),
    next15Days: renewals.filter((r) => r.daysLeft > 7 && r.daysLeft <= 15 && r.status === 'Pending'),
    next30Days: renewals.filter((r) => r.daysLeft > 15 && r.daysLeft <= 30 && r.status === 'Pending'),
    renewed: renewals.filter((r) => r.status === 'Renewed'),
    lost: renewals.filter((r) => r.status === 'Lost'),
  };

  const RenewalCard = ({ renewal }) => (
    <div className={`border-2 rounded-lg p-4 ${getColorByDaysLeft(renewal.daysLeft)}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{renewal.policyNo}</h3>
          <p className="text-sm text-gray-600 mt-1">{renewal.customerName}</p>
          <p className="text-xs text-gray-600 mt-1">{renewal.lob}</p>
        </div>
        <span className={`px-2 py-1 rounded text-xs font-bold ${getDaysLeftBadgeColor(renewal.daysLeft)}`}>
          {renewal.daysLeft < 0 ? `${Math.abs(renewal.daysLeft)} days overdue` : `${renewal.daysLeft} days`}
        </span>
      </div>

      <div className="flex items-center justify-between py-3 border-t border-current border-opacity-20">
        <div>
          <p className="text-xs text-gray-600">Premium</p>
          <p className="text-sm font-bold text-gray-900">{formatCurrency(renewal.premium)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-600">Company</p>
          <p className="text-sm font-bold text-gray-900">{renewal.company}</p>
        </div>
      </div>

      <div className="flex gap-2 mt-3">
        <a
          href={`tel:${renewal.customerPhone}`}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded font-medium text-xs transition-colors"
        >
          <Phone className="w-3 h-3" />
          Call
        </a>
        <a
          href={`https://wa.me/${renewal.customerPhone}?text=Renewal%20reminder%20for%20policy%20${renewal.policyNo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded font-medium text-xs transition-colors"
        >
          <MessageSquare className="w-3 h-3" />
          WhatsApp
        </a>
        <button
          onClick={() => handleAction(renewal.id, 'renew')}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded font-medium text-xs transition-colors"
        >
          <CheckCircle className="w-3 h-3" />
          Renewed
        </button>
        <button
          onClick={() => handleAction(renewal.id, 'lost')}
          className="flex-1 flex items-center justify-center gap-1 px-2 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded font-medium text-xs transition-colors"
        >
          <XCircle className="w-3 h-3" />
          Lost
        </button>
      </div>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Renewal Management</h1>
        <p className="text-gray-600 mt-2">Track and manage policy renewals</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            {stats.dueThisMonth > 0
              ? Math.round((stats.renewed / (stats.dueThisMonth + stats.lapsed)) * 100)
              : 0}
            %
          </p>
        </div>
      </div>

      {/* View Toggle */}
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

      {/* Grouped View */}
      {viewMode === 'grouped' && (
        <div className="space-y-6">
          {/* Overdue */}
          {groupedRenewals.overdue.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Overdue ({groupedRenewals.overdue.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.overdue.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Due Today */}
          {groupedRenewals.dueToday.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-red-600" />
                <h2 className="text-lg font-bold text-gray-900">Due Today ({groupedRenewals.dueToday.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.dueToday.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Next 7 Days */}
          {groupedRenewals.next7Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-orange-600" />
                <h2 className="text-lg font-bold text-gray-900">Next 7 Days ({groupedRenewals.next7Days.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next7Days.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Next 15 Days */}
          {groupedRenewals.next15Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Next 15 Days ({groupedRenewals.next15Days.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next15Days.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Next 30 Days */}
          {groupedRenewals.next30Days.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <h2 className="text-lg font-bold text-gray-900">
                  Next 30 Days ({groupedRenewals.next30Days.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.next30Days.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Renewed */}
          {groupedRenewals.renewed.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-green-600" />
                <h2 className="text-lg font-bold text-gray-900">Renewed ({groupedRenewals.renewed.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.renewed.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}

          {/* Lost */}
          {groupedRenewals.lost.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-gray-600" />
                <h2 className="text-lg font-bold text-gray-900">Lost ({groupedRenewals.lost.length})</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedRenewals.lost.map((r) => (
                  <RenewalCard key={r.id} renewal={r} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
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
                </tr>
              </thead>
              <tbody>
                {renewals.map((r, idx) => (
                  <tr
                    key={r.id}
                    className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{r.policyNo}</td>
                    <td className="px-6 py-4 text-gray-600">{r.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{r.lob}</td>
                    <td className="px-6 py-4 text-gray-600">{r.company}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">{formatCurrency(r.premium)}</td>
                    <td className="px-6 py-4 text-gray-600">{r.expiryDate}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${getDaysLeftBadgeColor(r.daysLeft)}`}>
                        {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RenewalsPage;
