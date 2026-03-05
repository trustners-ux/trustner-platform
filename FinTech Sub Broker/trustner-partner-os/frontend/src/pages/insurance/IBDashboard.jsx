import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  DollarSign,
  Shield,
  AlertCircle,
  PieChart,
  BarChart3,
  Clock,
  Users,
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

const IBDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalGWP: 0,
      policiesThisMonth: 0,
      activePOSPs: 0,
      pendingClaims: 0,
      renewalDue: 0,
      commissionEarned: 0,
    },
    premiumTrend: [],
    lobDistribution: [],
    topPOSPs: [],
    recentPolicies: [],
    claimsSummary: {},
    renewalCalendar: [],
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [
        statsRes,
        trendRes,
        lobRes,
        pospsRes,
        policiesRes,
        claimsRes,
        renewalRes,
      ] = await Promise.all([
        api.get('/insurance/dashboard/stats'),
        api.get('/insurance/dashboard/premium-trend'),
        api.get('/insurance/dashboard/lob-distribution'),
        api.get('/insurance/dashboard/top-posps'),
        api.get('/insurance/policies/recent'),
        api.get('/insurance/claims/summary'),
        api.get('/insurance/renewals/calendar'),
      ]);

      setDashboardData({
        stats: statsRes.data,
        premiumTrend: trendRes.data,
        lobDistribution: lobRes.data,
        topPOSPs: pospsRes.data.slice(0, 10),
        recentPolicies: policiesRes.data.slice(0, 10),
        claimsSummary: claimsRes.data,
        renewalCalendar: renewalRes.data.slice(0, 7),
      });
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext, trend }) => (
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
      {trend && (
        <div className="flex items-center gap-1 mt-4 text-xs text-green-600">
          <TrendingUp className="w-3 h-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );

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

  const COLORS = ['#00897b', '#1565c0', '#f9a825', '#e91e63', '#9c27b0'];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insurance Broking Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor your insurance business performance</p>
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

      {/* Stat Cards - 2x3 Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total GWP"
          value={formatCurrency(dashboardData.stats.totalGWP)}
          icon={DollarSign}
          color="bg-teal-600"
          trend="+8.3% MoM"
        />
        <StatCard
          title="Policies This Month"
          value={formatIndianNumber(dashboardData.stats.policiesThisMonth)}
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
          title="Pending Claims"
          value={formatIndianNumber(dashboardData.stats.pendingClaims)}
          icon={Clock}
          color="bg-orange-600"
          trend="Needs attention"
        />
        <StatCard
          title="Renewal Due (7 days)"
          value={formatIndianNumber(dashboardData.stats.renewalDue)}
          icon={AlertCircle}
          color="bg-purple-600"
        />
        <StatCard
          title="Commission Earned"
          value={formatCurrency(dashboardData.stats.commissionEarned)}
          icon={DollarSign}
          color="bg-green-600"
          trend="This month"
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
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Bar dataKey="Motor" stackId="a" fill="#00897b" />
                <Bar dataKey="Health" stackId="a" fill="#1565c0" />
                <Bar dataKey="Life" stackId="a" fill="#f9a825" />
                <Bar dataKey="Others" stackId="a" fill="#e91e63" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
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
                <Tooltip />
              </PieChartComponent>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top POSPs */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top 10 POSPs by Premium</h2>
          {dashboardData.topPOSPs.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.topPOSPs.map((posp, idx) => (
                <div key={posp.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{posp.name}</p>
                      <p className="text-xs text-gray-500">{formatIndianNumber(posp.policiesSold)} policies</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-teal-600 ml-2">{formatCurrency(posp.premium)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Claims Summary */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Claims Summary</h2>
          {Object.keys(dashboardData.claimsSummary).length > 0 ? (
            <div className="space-y-4">
              {[
                { key: 'approved', label: 'Approved', color: 'green' },
                { key: 'pending', label: 'Pending', color: 'orange' },
                { key: 'rejected', label: 'Rejected', color: 'red' },
              ].map((item) => (
                <div key={item.key} className="flex items-end gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatIndianNumber(dashboardData.claimsSummary[item.key] || 0)}
                      </span>
                    </div>
                    <div className={`h-2 bg-${item.color}-200 rounded-full overflow-hidden`}>
                      <div
                        className={`h-full bg-${item.color}-600`}
                        style={{
                          width: `${
                            ((dashboardData.claimsSummary[item.key] || 0) /
                              (dashboardData.claimsSummary.approved +
                                dashboardData.claimsSummary.pending +
                                dashboardData.claimsSummary.rejected)) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
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
                    <tr key={policy.id} className="border-t border-gray-200">
                      <td className="px-3 py-2 font-medium text-gray-900">{policy.policyNo}</td>
                      <td className="px-3 py-2 text-gray-600 truncate">{policy.customerName}</td>
                      <td className="px-3 py-2 text-gray-600">{policy.lob}</td>
                      <td className="px-3 py-2 text-right text-gray-900 font-medium">
                        {formatCurrency(policy.premium)}
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

        {/* Renewal Calendar - Next 7 Days */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Renewal Calendar (Next 7 Days)</h2>
          {dashboardData.renewalCalendar.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.renewalCalendar.map((renewal) => (
                <div
                  key={renewal.id}
                  className={`p-3 border rounded-lg ${
                    renewal.daysLeft <= 1
                      ? 'border-red-300 bg-red-50'
                      : renewal.daysLeft <= 3
                      ? 'border-orange-300 bg-orange-50'
                      : 'border-yellow-300 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{renewal.policyNo}</p>
                      <p className="text-xs text-gray-600 mt-1">{renewal.customerName}</p>
                      <p className="text-xs text-gray-500 mt-1">{renewal.lob}</p>
                    </div>
                    <div className="text-right ml-2">
                      <p className="text-sm font-bold text-gray-900">{renewal.daysLeft} days</p>
                      <p className="text-xs font-medium text-gray-600 mt-1">
                        {formatCurrency(renewal.premium)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">
              No renewals due soon
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBDashboard;
