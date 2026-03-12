import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  DollarSign,
  Shield,
  Clock,
  AlertCircle,
  ChevronRight,
  BarChart3,
  ExternalLink,
  Calendar,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatCurrency, formatIndianNumber } from '../utils/formatters';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const UnifiedDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    mf: {
      aum: 0,
      activeSIPs: 0,
      monthlyCommission: 0,
    },
    insurance: {
      gwp: 0,
      activePolicies: 0,
      monthlyCommission: 0,
      pendingClaims: 0,
      upcomingRenewals: 0,
    },
    revenueChart: [],
    recentActivity: [],
  });

  const user = {
    name: authUser?.name || authUser?.email || 'User',
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const safeGet = (url) => api.get(url).catch(() => ({ data: null }));
      const [mfRes, insuranceRes, revenueRes, activityRes] = await Promise.all([
        safeGet('/dashboard/mf-summary'),
        safeGet('/dashboard/insurance-summary'),
        safeGet('/dashboard/revenue-chart'),
        safeGet('/dashboard/recent-activity'),
      ]);

      setDashboardData((prev) => ({
        mf: mfRes.data || prev.mf,
        insurance: insuranceRes.data || prev.insurance,
        revenueChart: revenueRes.data || prev.revenueChart,
        recentActivity: activityRes.data || prev.recentActivity,
      }));
    } catch (err) {
      console.error('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, color, subtext, onClick, trend }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer`}
    >
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-blue-100 mt-1">
              {new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="hidden md:block opacity-20">
            <BarChart3 className="w-32 h-32" />
          </div>
        </div>
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

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mutual Funds Summary */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Mutual Funds Summary</h2>
              <button
                onClick={() => navigate('/mf/explorer')}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <StatCard
                title="Total MF AUM"
                value={formatCurrency(dashboardData.mf.aum)}
                icon={DollarSign}
                color="bg-blue-600"
                trend="+12.5% YoY"
                onClick={() => window.open('https://investwell.example.com', '_blank')}
              />

              <StatCard
                title="Active SIPs"
                value={dashboardData.mf.activeSIPs}
                icon={Calendar}
                color="bg-blue-500"
                subtext="Running investments"
              />

              <StatCard
                title="Monthly MF Commission"
                value={formatCurrency(dashboardData.mf.monthlyCommission)}
                icon={DollarSign}
                color="bg-blue-400"
                trend="This month"
              />

              <button
                onClick={() => window.open('https://investwell.example.com', '_blank')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Go to InvestWell <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Insurance Summary */}
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Insurance Summary</h2>
              <button
                onClick={() => navigate('/insurance/dashboard')}
                className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center gap-1"
              >
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <StatCard
                title="Total GWP"
                value={formatCurrency(dashboardData.insurance.gwp)}
                icon={Shield}
                color="bg-teal-600"
                trend="+8.3% MoM"
                onClick={() => navigate('/insurance/policies')}
              />

              <StatCard
                title="Active Policies"
                value={formatIndianNumber(dashboardData.insurance.activePolicies)}
                icon={Shield}
                color="bg-teal-500"
                onClick={() => navigate('/insurance/policies')}
              />

              <StatCard
                title="Monthly IB Commission"
                value={formatCurrency(dashboardData.insurance.monthlyCommission)}
                icon={DollarSign}
                color="bg-teal-400"
                trend="This month"
              />

              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  title="Pending Claims"
                  value={dashboardData.insurance.pendingClaims}
                  icon={Clock}
                  color="bg-orange-600"
                  onClick={() => navigate('/insurance/claims')}
                />

                <StatCard
                  title="Upcoming Renewals"
                  value={dashboardData.insurance.upcomingRenewals}
                  icon={Calendar}
                  color="bg-purple-600"
                  onClick={() => navigate('/insurance/renewals')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Combined Revenue Trend (12 Months)</h2>
        {dashboardData.revenueChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={dashboardData.revenueChart}>
              <defs>
                <linearGradient id="colorMF" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1565c0" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#1565c0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorIB" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00897b" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#00897b" stopOpacity={0} />
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="mfCommission"
                stroke="#1565c0"
                fillOpacity={1}
                fill="url(#colorMF)"
                name="MF Commission"
              />
              <Area
                type="monotone"
                dataKey="ibCommission"
                stroke="#00897b"
                fillOpacity={1}
                fill="url(#colorIB)"
                name="IB Commission"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <button className="text-gray-600 hover:text-gray-900 text-sm font-medium">View All</button>
        </div>

        {dashboardData.recentActivity.length > 0 ? (
          <div className="space-y-4">
            {dashboardData.recentActivity.slice(0, 5).map((activity, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white flex-shrink-0">
                  {activity.icon}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                  <p className="text-xs text-gray-500 mt-1">{activity.description}</p>
                </div>
                <p className="text-xs text-gray-400 whitespace-nowrap">{activity.time}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-gray-500">
            No recent activity
          </div>
        )}
      </div>
    </div>
  );
};

export default UnifiedDashboard;
