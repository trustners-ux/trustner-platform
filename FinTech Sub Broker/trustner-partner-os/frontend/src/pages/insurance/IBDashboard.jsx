import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Shield,
  AlertCircle,
  Clock,
  Users,
  RefreshCw,
  Database,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart as PieChartComponent,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';
import api from '../../services/api';

// LOB enum → display
const LOB_MAP = {
  MOTOR_TWO_WHEELER: 'Motor 2W',
  MOTOR_FOUR_WHEELER: 'Motor 4W',
  MOTOR_COMMERCIAL: 'Motor CV',
  HEALTH_INDIVIDUAL: 'Health Indiv.',
  HEALTH_FAMILY_FLOATER: 'Health Family',
  HEALTH_GROUP: 'Health Group',
  HEALTH_CRITICAL_ILLNESS: 'Critical Illness',
  HEALTH_TOP_UP: 'Health Top-Up',
  LIFE_TERM: 'Life Term',
  LIFE_ENDOWMENT: 'Life Endow.',
  LIFE_ULIP: 'Life ULIP',
  LIFE_WHOLE_LIFE: 'Life Whole',
  TRAVEL: 'Travel',
  HOME: 'Home',
  FIRE: 'Fire',
  MARINE: 'Marine',
  LIABILITY: 'Liability',
  PA: 'PA',
  OTHER: 'Other',
};

// Status → display
const STATUS_MAP = {
  QUOTE_GENERATED: 'Quote',
  PROPOSAL_SUBMITTED: 'Proposal',
  PAYMENT_PENDING: 'Pmt Pending',
  POLICY_ISSUED: 'Issued',
  POLICY_ACTIVE: 'Active',
  POLICY_EXPIRED: 'Expired',
  POLICY_CANCELLED: 'Cancelled',
};

const IBDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null); // { needsSync, importedFromVJ, totalInsurancePolicies }
  const [syncing, setSyncing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalGWP: 0,
      totalPolicies: 0,
      activePolicies: 0,
      activePOSPs: 0,
      claimsCount: 0,
      renewalsDue: 0,
      totalCommissionPayable: 0,
    },
    premiumTrend: [],
    lobDistribution: [],
    topPerformers: [],
    recentPolicies: [],
    claimsSummary: {},
    renewalCalendar: {},
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Promise.allSettled so partial failures don't block everything
      // Correct backend endpoints:
      // 1. GET /insurance/dashboard/admin → { summary: { totalPolicies, activePolicies, totalGWP, activePOSPs, claimsCount, renewalsDue, totalCommissionPayable }, lobDistribution: [...] }
      // 2. GET /insurance/dashboard/charts/sales-performance → { data: [{ month, premium }] }
      // 3. GET /insurance/dashboard/charts/lob-distribution → { data: [{ lob, count, gwp }] }
      // 4. GET /insurance/dashboard/top-performers → { topPerformers: [{ agentCode, name, policiesCount, gwp }] }
      // 5. GET /insurance/policies?take=10&skip=0 → { data: [...], pagination: {...} }
      // 6. GET /insurance/dashboard/claims-overview → { summary: { totalClaims, intimatedClaims, approvedClaims, rejectedClaims, settledClaims } }
      // 7. GET /insurance/dashboard/calendars/renewal → { entries: { 'YYYY-MM-DD': [...] } }
      const [
        adminRes,
        trendRes,
        lobRes,
        performersRes,
        policiesRes,
        claimsRes,
        renewalRes,
        migrationRes,
      ] = await Promise.allSettled([
        api.get('/insurance/dashboard/admin'),
        api.get('/insurance/dashboard/charts/sales-performance'),
        api.get('/insurance/dashboard/charts/lob-distribution'),
        api.get('/insurance/dashboard/top-performers'),
        api.get('/insurance/policies', { params: { skip: 0, take: 10 } }),
        api.get('/insurance/dashboard/claims-overview'),
        api.get('/insurance/dashboard/calendars/renewal'),
        api.get('/insurance/data-migration/status'),
      ]);

      const newData = { ...dashboardData };

      // 1. Admin dashboard stats
      if (adminRes.status === 'fulfilled') {
        const admin = adminRes.value;
        newData.stats = {
          totalGWP: admin.summary?.totalGWP || 0,
          totalPolicies: admin.summary?.totalPolicies || 0,
          activePolicies: admin.summary?.activePolicies || 0,
          activePOSPs: admin.summary?.activePOSPs || 0,
          claimsCount: admin.summary?.claimsCount || 0,
          renewalsDue: admin.summary?.renewalsDue || 0,
          totalCommissionPayable: admin.summary?.totalCommissionPayable || 0,
        };
      }

      // 2. Premium trend (monthly)
      if (trendRes.status === 'fulfilled') {
        newData.premiumTrend = trendRes.value?.data || [];
      }

      // 3. LOB distribution for pie chart
      if (lobRes.status === 'fulfilled') {
        const lobData = lobRes.value?.data || [];
        newData.lobDistribution = lobData.map(item => ({
          name: LOB_MAP[item.lob] || item.lob,
          value: item.count || 0,
          gwp: item.gwp || 0,
        }));
      }

      // 4. Top performers
      if (performersRes.status === 'fulfilled') {
        newData.topPerformers = (performersRes.value?.topPerformers || []).slice(0, 10);
      }

      // 5. Recent policies
      if (policiesRes.status === 'fulfilled') {
        newData.recentPolicies = (policiesRes.value?.data || []).slice(0, 10);
      }

      // 6. Claims overview
      if (claimsRes.status === 'fulfilled') {
        newData.claimsSummary = claimsRes.value?.summary || {};
      }

      // 7. Renewal calendar
      if (renewalRes.status === 'fulfilled') {
        newData.renewalCalendar = renewalRes.value?.entries || {};
      }

      // 8. Migration status — check if data needs syncing
      if (migrationRes.status === 'fulfilled') {
        setSyncStatus(migrationRes.value);
      }

      setDashboardData(newData);
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      setSyncing(true);
      await api.post('/insurance/data-migration/sync-to-policies');
      // Refresh dashboard data after sync
      await fetchDashboardData();
    } catch (err) {
      console.error('Sync failed:', err);
      setError('Sync failed. Please try from Data Migration page.');
    } finally {
      setSyncing(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  // Flatten renewal calendar entries for display
  const getUpcomingRenewals = () => {
    const entries = dashboardData.renewalCalendar;
    if (!entries || typeof entries !== 'object') return [];

    const all = [];
    const sortedDates = Object.keys(entries).sort();
    for (const date of sortedDates.slice(0, 7)) {
      const items = entries[date] || [];
      items.forEach(item => {
        const daysLeft = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        all.push({ ...item, daysLeft: Math.max(0, daysLeft) });
      });
    }
    return all.slice(0, 10);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#00897b', '#1565c0', '#f9a825', '#e91e63', '#9c27b0', '#ff5722', '#607d8b', '#4caf50'];

  const upcomingRenewals = getUpcomingRenewals();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insurance Broking Dashboard</h1>
          <p className="text-gray-600 mt-2">Monitor your insurance business performance</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors"
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

      {/* Sync Banner — show when MIS has data but InsurancePolicy is empty/low */}
      {syncStatus && syncStatus.needsSync > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Database className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="font-bold text-amber-900">
              {syncStatus.importedFromVJ} VJ Infosoft records imported — {syncStatus.needsSync} not yet synced to Policies
            </h3>
            <p className="text-sm text-amber-700 mt-1">
              Dashboard reads from the Insurance Policies table. Click "Sync Now" to copy your imported data into Policies so it reflects here.
            </p>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-2"
          >
            {syncing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Syncing...
              </>
            ) : (
              'Sync Now'
            )}
          </button>
        </div>
      )}

      {/* Stat Cards - 2x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total GWP"
          value={formatCurrency(dashboardData.stats.totalGWP)}
          icon={DollarSign}
          color="bg-teal-600"
          subtext={`${dashboardData.stats.totalPolicies} total policies`}
        />
        <StatCard
          title="Active Policies"
          value={formatIndianNumber(dashboardData.stats.activePolicies)}
          icon={Shield}
          color="bg-teal-500"
        />
        <StatCard
          title="Active POSPs"
          value={formatIndianNumber(dashboardData.stats.activePOSPs)}
          icon={Users}
          color="bg-teal-400"
        />
        <StatCard
          title="Claims"
          value={formatIndianNumber(dashboardData.stats.claimsCount)}
          icon={Clock}
          color="bg-orange-600"
        />
        <StatCard
          title="Renewals Due"
          value={formatIndianNumber(dashboardData.stats.renewalsDue)}
          icon={AlertCircle}
          color="bg-purple-600"
        />
        <StatCard
          title="Commission Payable"
          value={formatCurrency(dashboardData.stats.totalCommissionPayable)}
          icon={DollarSign}
          color="bg-green-600"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Premium Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Premium Trend (12 Months)</h2>
          {dashboardData.premiumTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.premiumTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                <YAxis stroke="#9ca3af" tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip
                  formatter={(value) => [formatCurrency(value), 'Premium']}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="premium" fill="#00897b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No premium data available
            </div>
          )}
        </div>

        {/* LOB Distribution */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">LOB Distribution</h2>
          {dashboardData.lobDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChartComponent>
                <Pie
                  data={dashboardData.lobDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.lobDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, name]} />
              </PieChartComponent>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No LOB data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top 10 POSPs by GWP</h2>
          {dashboardData.topPerformers.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topPerformers.map((posp, idx) => (
                <div key={posp.agentCode || idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{posp.name}</p>
                      <p className="text-xs text-gray-500">{posp.policiesCount} policies | {posp.agentCode}</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-teal-600 ml-2">{formatCurrency(posp.gwp)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No POSP data available
            </div>
          )}
        </div>

        {/* Claims Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Claims Summary</h2>
          {dashboardData.claimsSummary.totalClaims > 0 ? (
            <div className="space-y-4">
              {[
                { key: 'approvedClaims', label: 'Approved', color: 'bg-green-600', bgLight: 'bg-green-200' },
                { key: 'intimatedClaims', label: 'Intimated', color: 'bg-blue-600', bgLight: 'bg-blue-200' },
                { key: 'settledClaims', label: 'Settled', color: 'bg-teal-600', bgLight: 'bg-teal-200' },
                { key: 'rejectedClaims', label: 'Rejected', color: 'bg-red-600', bgLight: 'bg-red-200' },
              ].map((item) => {
                const count = dashboardData.claimsSummary[item.key] || 0;
                const total = dashboardData.claimsSummary.totalClaims || 1;
                const pct = ((count / total) * 100).toFixed(1);
                return (
                  <div key={item.key} className="flex items-end gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        <span className="text-sm font-bold text-gray-900">{count} ({pct}%)</span>
                      </div>
                      <div className={`h-2 ${item.bgLight} rounded-full overflow-hidden`}>
                        <div
                          className={`h-full ${item.color} rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">Total Claims: <span className="font-bold text-gray-900">{dashboardData.claimsSummary.totalClaims}</span></p>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No claims data
            </div>
          )}
        </div>
      </div>

      {/* Recent Policies & Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Policies */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Policies</h2>
          {dashboardData.recentPolicies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-900">Policy No</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-900">Customer</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-900">LOB</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-900">Premium</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentPolicies.map((policy) => (
                    <tr key={policy.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-gray-900 whitespace-nowrap">{policy.policyNumber}</td>
                      <td className="px-3 py-2 text-gray-600 truncate max-w-[120px]">{policy.customerName}</td>
                      <td className="px-3 py-2 text-gray-600 whitespace-nowrap">{LOB_MAP[policy.lob] || policy.lob}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-medium whitespace-nowrap">
                        {formatCurrency(policy.totalPremium)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No recent policies
            </div>
          )}
        </div>

        {/* Renewal Calendar - Upcoming */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Upcoming Renewals</h2>
          {upcomingRenewals.length > 0 ? (
            <div className="space-y-3">
              {upcomingRenewals.map((renewal, idx) => (
                <div
                  key={renewal.id || idx}
                  className={`p-3 border rounded-lg ${
                    renewal.daysLeft <= 1
                      ? 'border-red-300 bg-red-50'
                      : renewal.daysLeft <= 3
                      ? 'border-orange-300 bg-orange-50'
                      : renewal.daysLeft <= 7
                      ? 'border-yellow-300 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{renewal.policyNumber}</p>
                      <p className="text-xs text-gray-600 mt-1 truncate">{renewal.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{LOB_MAP[renewal.lob] || renewal.lob}</p>
                    </div>
                    <div className="text-right ml-2 flex-shrink-0">
                      <p className={`text-sm font-bold ${renewal.daysLeft <= 3 ? 'text-red-600' : 'text-gray-900'}`}>
                        {renewal.daysLeft} days
                      </p>
                      <p className="text-xs font-medium text-gray-600 mt-1">
                        {formatCurrency(renewal.premiumAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No upcoming renewals
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBDashboard;
