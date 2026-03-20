'use client';

import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  Eye, TrendingUp, TrendingDown, Monitor, Smartphone, Tablet,
  Globe, ArrowUpRight, Calendar, Activity, Users, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface DailyStats {
  date: string;
  totalViews: number;
  uniquePaths: number;
  topPages: { path: string; views: number }[];
}

interface AnalyticsSummary {
  totalViews: number;
  todayViews: number;
  yesterdayViews: number;
  thisWeekViews: number;
  thisMonthViews: number;
  avgDailyViews: number;
  topPages: { path: string; views: number }[];
  topReferrers: { domain: string; visits: number }[];
  deviceBreakdown: { desktop: number; mobile: number; tablet: number };
  trend: number;
}

const DEVICE_COLORS = ['#0F766E', '#0EA5E9', '#F59E0B'];
const PAGE_LABELS: Record<string, string> = {
  '/': 'Home Page',
  '/calculators': 'All Calculators',
  '/calculators/sip': 'SIP Calculator',
  '/calculators/fire': 'FIRE Calculator',
  '/calculators/retirement': 'Retirement Planner',
  '/calculators/emi': 'EMI Calculator',
  '/calculators/income-tax': 'Income Tax Calc',
  '/calculators/term-plan-sip': 'Term Plan + SIP',
  '/calculators/lifeline': 'Lifeline Planner',
  '/learn': 'Learning Academy',
  '/blog': 'Blog',
  '/funds': 'Fund Explorer',
  '/financial-planning': 'Financial Planning',
  '/glossary': 'Glossary',
  '/research': 'Research',
  '/contact': 'Contact',
  '/about': 'About',
};

function formatPageName(path: string): string {
  if (PAGE_LABELS[path]) return PAGE_LABELS[path];
  // Auto-format: /calculators/step-up-sip -> Step Up Sip Calculator
  const segments = path.split('/').filter(Boolean);
  if (segments[0] === 'calculators' && segments[1]) {
    return segments[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) + ' Calc';
  }
  if (segments[0] === 'blog' && segments[1]) {
    const title = segments[1].replace(/-/g, ' ');
    return title.length > 35 ? title.slice(0, 35) + '...' : title;
  }
  if (segments[0] === 'learn' && segments.length > 1) {
    return 'Learn: ' + segments[segments.length - 1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return path;
}

export default function AnalyticsDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [daily, setDaily] = useState<DailyStats[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?days=${days}`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        setDaily(data.daily || []);
        setSummary(data.summary || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Activity className="w-8 h-8 text-teal-600 animate-pulse mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-20">
        <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-600 mb-2">No Analytics Data Yet</h3>
        <p className="text-sm text-slate-400">Traffic data will appear here once visitors start browsing the site.</p>
      </div>
    );
  }

  const deviceData = [
    { name: 'Desktop', value: summary.deviceBreakdown.desktop },
    { name: 'Mobile', value: summary.deviceBreakdown.mobile },
    { name: 'Tablet', value: summary.deviceBreakdown.tablet },
  ].filter((d) => d.value > 0);

  const chartData = daily.map((d) => ({
    date: d.date.slice(5), // MM-DD
    views: d.totalViews,
    pages: d.uniquePaths,
  }));

  const totalDevices = summary.deviceBreakdown.desktop + summary.deviceBreakdown.mobile + summary.deviceBreakdown.tablet;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Site Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">Visitor traffic and page performance</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 14, 30, 60].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                days === d
                  ? 'bg-teal-600 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              )}
            >
              {d}D
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Eye} label="Today" value={summary.todayViews} color="text-teal-600" bg="bg-teal-50" />
        <StatCard icon={Calendar} label="Yesterday" value={summary.yesterdayViews} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={BarChart3} label="This Week" value={summary.thisWeekViews} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={Users} label="This Month" value={summary.thisMonthViews} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={Activity} label="Avg/Day" value={summary.avgDailyViews} color="text-amber-600" bg="bg-amber-50" />
        <div className={cn(
          'rounded-xl border p-4',
          summary.trend >= 0 ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
        )}>
          <div className="flex items-center gap-2 mb-2">
            {summary.trend >= 0
              ? <TrendingUp className="w-4 h-4 text-emerald-600" />
              : <TrendingDown className="w-4 h-4 text-red-600" />}
            <span className="text-[10px] font-bold text-slate-500 uppercase">Trend</span>
          </div>
          <div className={cn('text-xl font-extrabold', summary.trend >= 0 ? 'text-emerald-700' : 'text-red-700')}>
            {summary.trend >= 0 ? '+' : ''}{summary.trend}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">vs prev 7 days</div>
        </div>
      </div>

      {/* Daily Traffic Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-1">Daily Page Views</h3>
        <p className="text-xs text-slate-400 mb-4">Last {days} days traffic</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94A3B8' }} interval={days > 14 ? 2 : 0} />
              <YAxis tick={{ fontSize: 10, fill: '#94A3B8' }} width={40} />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '12px' }}
                labelStyle={{ fontWeight: 600, color: '#334155' }}
              />
              <Bar dataKey="views" fill="#0F766E" radius={[4, 4, 0, 0]} name="Page Views" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Grid: Top Pages + Device + Referrers */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Top Pages */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-bold text-slate-700 mb-1">Top Pages</h3>
          <p className="text-xs text-slate-400 mb-4">Most visited pages in last {days} days</p>
          <div className="space-y-2">
            {summary.topPages.slice(0, 12).map((page, i) => {
              const maxViews = summary.topPages[0]?.views || 1;
              const pct = (page.views / maxViews) * 100;
              return (
                <div key={page.path} className="flex items-center gap-3">
                  <span className="w-5 text-xs font-bold text-slate-400 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 truncate">{formatPageName(page.path)}</span>
                      <span className="text-xs font-bold text-teal-700 shrink-0 ml-2">{page.views}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {summary.topPages.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-8">No page data yet</p>
          )}
        </div>

        {/* Right Column: Device + Referrers */}
        <div className="space-y-6">
          {/* Device Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-4">Devices</h3>
            {totalDevices > 0 ? (
              <>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {deviceData.map((_, idx) => (
                          <Cell key={idx} fill={DEVICE_COLORS[idx % DEVICE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <DeviceStat icon={Monitor} label="Desktop" value={summary.deviceBreakdown.desktop} total={totalDevices} />
                  <DeviceStat icon={Smartphone} label="Mobile" value={summary.deviceBreakdown.mobile} total={totalDevices} />
                  <DeviceStat icon={Tablet} label="Tablet" value={summary.deviceBreakdown.tablet} total={totalDevices} />
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">No device data yet</p>
            )}
          </div>

          {/* Top Referrers */}
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h3 className="font-bold text-slate-700 mb-4">Traffic Sources</h3>
            {summary.topReferrers.length > 0 ? (
              <div className="space-y-3">
                {summary.topReferrers.slice(0, 8).map((ref) => (
                  <div key={ref.domain} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-600 truncate">{ref.domain}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <span className="text-xs font-bold text-slate-700">{ref.visits}</span>
                      <ArrowUpRight className="w-3 h-3 text-teal-500" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 text-center py-4">No referrer data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Small Components ── */
function StatCard({ icon: Icon, label, value, color, bg }: {
  icon: React.ElementType; label: string; value: number; color: string; bg: string;
}) {
  return (
    <div className={cn('rounded-xl border border-slate-200 p-4', bg)}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn('w-4 h-4', color)} />
        <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
      </div>
      <div className={cn('text-xl font-extrabold', color)}>{value.toLocaleString('en-IN')}</div>
    </div>
  );
}

function DeviceStat({ icon: Icon, label, value, total }: {
  icon: React.ElementType; label: string; value: number; total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="text-center">
      <Icon className="w-4 h-4 mx-auto text-slate-400 mb-1" />
      <div className="text-xs font-bold text-slate-700">{pct}%</div>
      <div className="text-[10px] text-slate-400">{label}</div>
    </div>
  );
}
