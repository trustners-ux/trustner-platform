import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  Plus,
  Upload,
  Download,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarDays,
  Users,
  Phone,
  Mail,
  RefreshCw,
  ChevronRight,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import misAPI from '../../services/mis';
import { formatCurrency, formatIndianNumber, formatDate } from '../../utils/formatters';

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

const DONUT_COLORS = ['#0d9488', '#0891b2', '#2563eb', '#7c3aed', '#db2777', '#ea580c', '#d97706', '#65a30d', '#059669', '#6366f1'];

const MISDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Basic stats (existing)
  const [stats, setStats] = useState({
    totalEntries: 0, pendingVerification: 0, verified: 0, rejected: 0,
    todaysEntries: 0, totalPremium: 0, totalCommission: 0,
  });
  const [recentEntries, setRecentEntries] = useState([]);

  // New dashboard analytics
  const [renewalTab, setRenewalTab] = useState('7days');
  const [renewalsDue, setRenewalsDue] = useState({ count: 0, renewals: [] });
  const [companyDist, setCompanyDist] = useState([]);
  const [lobDist, setLobDist] = useState([]);
  const [businessSummary, setBusinessSummary] = useState([]);
  const [growthMetrics, setGrowthMetrics] = useState([]);
  const [clientStats, setClientStats] = useState(null);
  const [renewalLossRatio, setRenewalLossRatio] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchRenewals(renewalTab);
  }, [renewalTab]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, entriesRes, companyRes, lobRes, bizRes, growthRes, clientRes, lossRes, renewalRes] =
        await Promise.all([
          misAPI.getStats(),
          misAPI.getEntries({ limit: 10, sortBy: 'createdAt', sortOrder: 'desc' }),
          misAPI.getCompanyDistribution(),
          misAPI.getLOBDistribution(),
          misAPI.getBusinessSummary(),
          misAPI.getGrowthMetrics(),
          misAPI.getClientStats(),
          misAPI.getRenewalLossRatio(),
          misAPI.getRenewalsDue('7days'),
        ]);

      const data = statsRes.data;
      setStats({
        totalEntries: data.totalEntries || 0,
        pendingVerification: data.pendingCount || data.pendingVerification || 0,
        verified: data.verifiedCount || data.verified || 0,
        rejected: data.rejectedCount || data.rejected || 0,
        todaysEntries: data.todaysEntries || data.todayEntries || 0,
        totalPremium: data.totalPremium || 0,
        totalCommission: data.totalCommission || 0,
      });

      setRecentEntries(entriesRes.data?.data || entriesRes.data || []);
      setCompanyDist(companyRes.data || []);
      setLobDist(lobRes.data || []);
      setBusinessSummary(bizRes.data || []);
      setGrowthMetrics(growthRes.data || []);
      setClientStats(clientRes.data || null);
      setRenewalLossRatio(lossRes.data || []);
      setRenewalsDue(renewalRes.data || { count: 0, renewals: [] });
    } catch (err) {
      setError('Failed to load MIS dashboard data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRenewals = async (period) => {
    try {
      const res = await misAPI.getRenewalsDue(period);
      setRenewalsDue(res.data || { count: 0, renewals: [] });
    } catch (err) {
      console.error('Failed to fetch renewals', err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading MIS dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MIS Dashboard</h1>
          <p className="text-gray-600 mt-1">Management Information System — Business Overview</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => navigate('/insurance/mis/entry')}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
            <Plus className="w-4 h-4" /> New MIS Entry
          </button>
          <button onClick={() => navigate('/insurance/mis/entry?tab=upload')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button onClick={() => navigate('/insurance/mis/reports')}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
            <Download className="w-4 h-4" /> Generate Report
          </button>
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

      {/* ==================== QUICK ACTION CARDS ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button onClick={() => navigate('/insurance/mis/entry')}
          className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-xl p-5 text-left hover:shadow-lg transition-shadow">
          <Plus className="w-6 h-6 mb-2" />
          <p className="font-semibold">New Entry</p>
          <p className="text-xs text-teal-100 mt-1">Add MIS record</p>
        </button>
        <button onClick={() => navigate('/insurance/mis/verification')}
          className="bg-gradient-to-br from-yellow-500 to-amber-500 text-white rounded-xl p-5 text-left hover:shadow-lg transition-shadow">
          <Clock className="w-6 h-6 mb-2" />
          <p className="font-semibold">Pending</p>
          <p className="text-xs text-yellow-100 mt-1">{formatIndianNumber(stats.pendingVerification)} to verify</p>
        </button>
        <button onClick={() => navigate('/insurance/mis/reports')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5 text-left hover:shadow-lg transition-shadow">
          <BarChart3 className="w-6 h-6 mb-2" />
          <p className="font-semibold">Reports</p>
          <p className="text-xs text-blue-100 mt-1">Generate & download</p>
        </button>
        <button onClick={() => navigate('/insurance/mis/entry?tab=upload')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-xl p-5 text-left hover:shadow-lg transition-shadow">
          <Upload className="w-6 h-6 mb-2" />
          <p className="font-semibold">Bulk Upload</p>
          <p className="text-xs text-purple-100 mt-1">Excel / CSV</p>
        </button>
      </div>

      {/* ==================== STAT CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Entries</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{formatIndianNumber(stats.totalEntries)}</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-600"><FileText className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Verification</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">{formatIndianNumber(stats.pendingVerification)}</p>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500"><Clock className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Verified</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatIndianNumber(stats.verified)}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-600"><CheckCircle className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatIndianNumber(stats.rejected)}</p>
            </div>
            <div className="p-3 rounded-lg bg-red-600"><XCircle className="w-5 h-5 text-white" /></div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Entries</p>
              <p className="text-2xl font-bold text-teal-600 mt-2">{formatIndianNumber(stats.todaysEntries)}</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-500"><CalendarDays className="w-5 h-5 text-white" /></div>
          </div>
        </div>
      </div>

      {/* ==================== PREMIUM & COMMISSION ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-teal-100"><DollarSign className="w-5 h-5 text-teal-700" /></div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Premium Collected</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalPremium)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-green-100"><TrendingUp className="w-5 h-5 text-green-700" /></div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Commission Earned</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalCommission)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== RENEWAL LIST (Tabbed) ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-teal-600" />
              <h2 className="text-lg font-bold text-gray-900">Renewal List</h2>
              <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-xs font-bold">{renewalsDue.count}</span>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'today', label: 'Today' },
                { key: '7days', label: '7 Days' },
                { key: '15days', label: '15 Days' },
                { key: '1month', label: '1 Month' },
              ].map(tab => (
                <button key={tab.key} onClick={() => setRenewalTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    renewalTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                  }`}>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          {renewalsDue.renewals?.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Policy No</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">LOB</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900">Premium</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Expiry</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-900">Days Left</th>
                </tr>
              </thead>
              <tbody>
                {renewalsDue.renewals.map((r, idx) => (
                  <tr key={r.id} onClick={() => navigate(`/insurance/mis/entries/${r.id}`)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-teal-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.customerName}</td>
                    <td className="px-4 py-3 text-teal-600 font-medium">{r.policyNumber || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{r.insurerName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{LOB_LABELS[r.lob] || r.lob}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600">{formatCurrency(r.netPremium || r.grossPremium)}</td>
                    <td className="px-4 py-3 text-gray-600">{r.policyEndDate ? formatDate(r.policyEndDate) : '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                        r.daysLeft <= 1 ? 'bg-red-100 text-red-700' : r.daysLeft <= 7 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                      }`}>{r.daysLeft}d</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-500">No renewals due for this period</div>
          )}
        </div>
      </div>

      {/* ==================== DONUT CHARTS: Company & LOB ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Wise Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Building2 className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Company Wise</h2>
          </div>
          {companyDist.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={companyDist.slice(0, 10).map(c => ({ name: c.company, value: Number(c.grossPremium) }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name?.substring(0, 12)} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {companyDist.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>

        {/* LOB Wise Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">LOB Wise</h2>
          </div>
          {lobDist.length > 0 ? (
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={lobDist.slice(0, 10).map(l => ({ name: LOB_LABELS[l.lob] || l.lob, value: Number(l.grossPremium) }))}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={100} paddingAngle={2} dataKey="value"
                    label={({ name, percent }) => `${name?.substring(0, 12)} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}>
                    {lobDist.slice(0, 10).map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val) => formatCurrency(val)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
          )}
        </div>
      </div>

      {/* ==================== BUSINESS SUMMARY BAR CHART + TABLE ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Business Summary</h2>
        {businessSummary.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={businessSummary.map(b => ({
                name: b.label,
                'Gross Premium': Number(b.grossPremium),
                'Net Premium': Number(b.netPremium),
                'Commission': Number(b.commission),
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(v) => v >= 100000 ? `${(v / 100000).toFixed(1)}L` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                  formatter={(val) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="Gross Premium" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Net Premium" fill="#14b8a6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Commission" fill="#2dd4bf" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Summary Table */}
            <div className="overflow-x-auto mt-6">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Period</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Entries</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Gross Premium</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Net Premium</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {businessSummary.map((b, idx) => (
                    <tr key={b.period} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{b.label}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatIndianNumber(b.entries)}</td>
                      <td className="px-4 py-3 text-right font-bold text-teal-600">{formatCurrency(b.grossPremium)}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(b.netPremium)}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{formatCurrency(b.commission)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">No data available</div>
        )}
      </div>

      {/* ==================== GROWTH METRICS TABLE ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-teal-600" />
          <h2 className="text-lg font-bold text-gray-900">Growth Metrics (Current vs Previous Year)</h2>
        </div>
        {growthMetrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-900">Period</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900">Current Year</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900">Previous Year</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900">Growth ₹</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-900">Growth %</th>
                </tr>
              </thead>
              <tbody>
                {growthMetrics.map((g, idx) => (
                  <tr key={g.label} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-gray-900">{g.label}</td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600">{formatCurrency(g.currentPremium)}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(g.previousPremium)}</td>
                    <td className={`px-4 py-3 text-right font-medium ${g.growthPremium >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {g.growthPremium >= 0 ? '+' : ''}{formatCurrency(g.growthPremium)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${
                        g.growthRate >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {g.growthRate >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {g.growthRate >= 0 ? '+' : ''}{g.growthRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-500">No growth data available</div>
        )}
      </div>

      {/* ==================== CLIENT STATS & RENEWAL LOSS RATIO ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Stats */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Client Statistics</h2>
          </div>
          {clientStats ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-teal-700">{formatIndianNumber(clientStats.totalClients)}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-blue-700">{formatIndianNumber(clientStats.newClientsThisMonth)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 flex items-center gap-3">
                <Phone className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Missing Phone</p>
                  <p className="text-xl font-bold text-orange-700">{formatIndianNumber(clientStats.missingPhone)}</p>
                </div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-600">Missing Email</p>
                  <p className="text-xl font-bold text-red-700">{formatIndianNumber(clientStats.missingEmail)}</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Policies</p>
                    <p className="text-xl font-bold text-gray-900">{formatIndianNumber(clientStats.totalPolicies)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Avg per Client</p>
                    <p className="text-xl font-bold text-gray-900">{clientStats.avgPoliciesPerClient}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">No client data available</div>
          )}
        </div>

        {/* Renewal Loss Ratio */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-bold text-gray-900">Renewal Loss Ratio</h2>
          </div>
          {renewalLossRatio.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-900">Period</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Due</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Renewed</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Lapsed</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Loss %</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-900">Renewal %</th>
                  </tr>
                </thead>
                <tbody>
                  {renewalLossRatio.map((r, idx) => (
                    <tr key={r.label} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{r.label}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{r.totalDue}</td>
                      <td className="px-4 py-3 text-right text-green-600 font-medium">{r.renewed}</td>
                      <td className="px-4 py-3 text-right text-red-600 font-medium">{r.lapsed}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.lossRatio > 30 ? 'bg-red-100 text-red-700' : r.lossRatio > 15 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'
                        }`}>{r.lossRatio}%</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.renewalRate >= 70 ? 'bg-green-100 text-green-700' : r.renewalRate >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>{r.renewalRate}%</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-500">No renewal data available</div>
          )}
        </div>
      </div>

      {/* ==================== RECENT ENTRIES TABLE ==================== */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Recent Entries</h2>
            <button onClick={() => navigate('/insurance/mis/verification')}
              className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">MIS Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Customer</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Company</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Net Premium</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">POSP</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Location</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Month</th>
              </tr>
            </thead>
            <tbody>
              {recentEntries.length > 0 ? (
                recentEntries.map((entry, idx) => (
                  <tr key={entry.id} onClick={() => navigate(`/insurance/mis/entries/${entry.id}`)}
                    className={`border-t border-gray-200 cursor-pointer ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-teal-50 transition-colors`}>
                    <td className="px-6 py-4 font-medium text-teal-600">{entry.misCode || '-'}</td>
                    <td className="px-6 py-4 text-gray-900">{entry.customerName}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.insurerName || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{LOB_LABELS[entry.lob] || entry.lob}</td>
                    <td className="px-6 py-4 text-right font-bold text-teal-600">
                      {formatCurrency(entry.netPremium || entry.grossPremium)}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{entry.pospName || '-'}</td>
                    <td className="px-6 py-4 text-gray-600">{entry.employeeLocation || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status] || 'bg-gray-100 text-gray-800'}`}>
                        {entry.status?.replace(/_/g, ' ') || 'DRAFT'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{entry.entryMonth || formatDate(entry.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No MIS entries found. Create your first entry to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MISDashboard;
