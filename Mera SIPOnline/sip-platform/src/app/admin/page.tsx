'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp, FileText, BarChart3, Users, ArrowRight,
  Calendar, Database, Activity, Plus, FileCheck, Clock, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { CURRENT_TRUSTNER_LIST, getTotalFundCount, getCategoryCount } from '@/data/funds/trustner';
import { blogPosts } from '@/data/blog/posts';
import { marketCommentaries } from '@/data/market/commentaries';

const stats = [
  {
    label: 'Curated Funds',
    value: getTotalFundCount(),
    icon: TrendingUp,
    color: 'text-brand bg-brand-50',
    href: '/admin/funds',
  },
  {
    label: 'Categories',
    value: getCategoryCount(),
    icon: Database,
    color: 'text-purple-600 bg-purple-50',
    href: '/admin/funds',
  },
  {
    label: 'Blog Posts',
    value: blogPosts.length,
    icon: FileText,
    color: 'text-blue-600 bg-blue-50',
    href: '/admin/blog',
  },
  {
    label: 'Market Reports',
    value: marketCommentaries.length,
    icon: BarChart3,
    color: 'text-amber-600 bg-amber-50',
    href: '/admin/market',
  },
];

const quickActions = [
  { label: 'Upload Fund Data', icon: TrendingUp, href: '/admin/funds', color: 'bg-brand hover:bg-brand-700' },
  { label: 'New Blog Post', icon: FileText, href: '/admin/blog', color: 'bg-blue-600 hover:bg-blue-700' },
  { label: 'New Commentary', icon: BarChart3, href: '/admin/market', color: 'bg-amber-600 hover:bg-amber-700' },
  { label: 'View Leads', icon: Users, href: '/admin/leads', color: 'bg-purple-600 hover:bg-purple-700' },
];

export default function AdminDashboard() {
  const latestCommentary = marketCommentaries[0];
  const fundListDate = `${CURRENT_TRUSTNER_LIST.month} ${CURRENT_TRUSTNER_LIST.year}`;

  // Financial Planning report stats
  const [reportStats, setReportStats] = useState({ pending: 0, sent: 0, total: 0 });

  useEffect(() => {
    fetch('/api/admin/reports', { credentials: 'include' })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.reports) {
          const reports = data.reports as Array<{ status: string }>;
          setReportStats({
            pending: reports.filter((r) => r.status === 'pending_review').length,
            sent: reports.filter((r) => r.status === 'sent').length,
            total: reports.length,
          });
        }
      })
      .catch(() => {/* silent — dashboard still works */});
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-primary-700">Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome to the Trustner Admin Console</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="card-base p-5 group hover:shadow-elevated"
          >
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-primary-700">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm',
                action.color
              )}
            >
              <Plus className="w-4 h-4" />
              {action.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Financial Planning Reports */}
      <div>
        <h2 className="text-sm font-bold text-slate-600 mb-3 uppercase tracking-wider">Financial Planning Reports</h2>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="card-base p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', 'text-amber-600 bg-amber-50')}>
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-primary-700">{reportStats.pending}</div>
            <div className="text-xs text-slate-500">Pending Review</div>
          </div>
          <div className="card-base p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', 'text-green-600 bg-green-50')}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-primary-700">{reportStats.sent}</div>
            <div className="text-xs text-slate-500">Sent</div>
          </div>
          <div className="card-base p-4">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center mb-2', 'text-brand bg-brand-50')}>
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="text-xl font-extrabold text-primary-700">{reportStats.total}</div>
            <div className="text-xs text-slate-500">Total Assessments</div>
          </div>
        </div>
        {reportStats.pending > 0 && (
          <Link
            href="/admin/reports"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-white text-sm font-semibold transition-all shadow-sm bg-amber-600 hover:bg-amber-700"
          >
            <FileCheck className="w-4 h-4" />
            Review {reportStats.pending} Pending Report{reportStats.pending !== 1 ? 's' : ''}
            <ArrowRight className="w-4 h-4 ml-auto" />
          </Link>
        )}
      </div>

      {/* Info Cards Row */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Fund List Status */}
        <div className="card-base p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand" />
            </div>
            <div>
              <h3 className="font-bold text-primary-700 text-sm">Fund Selection Status</h3>
              <p className="text-xs text-slate-400">Current monthly list</p>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b border-surface-200">
              <span className="text-xs text-slate-500">Current List</span>
              <span className="text-xs font-bold text-primary-700">{fundListDate}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-200">
              <span className="text-xs text-slate-500">Data As On</span>
              <span className="text-xs font-bold text-primary-700">{CURRENT_TRUSTNER_LIST.dataAsOn}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-surface-200">
              <span className="text-xs text-slate-500">Total Funds</span>
              <span className="text-xs font-bold text-brand">{getTotalFundCount()}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-slate-500">Categories</span>
              <span className="text-xs font-bold text-brand">{getCategoryCount()}</span>
            </div>
          </div>
          <Link
            href="/admin/funds"
            className="flex items-center gap-1 mt-4 text-xs font-semibold text-brand hover:underline"
          >
            Manage Fund Data <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Latest Commentary */}
        <div className="card-base p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-primary-700 text-sm">Latest Market Commentary</h3>
              <p className="text-xs text-slate-400">Weekly market analysis</p>
            </div>
          </div>
          {latestCommentary ? (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700 leading-tight">
                {latestCommentary.title}
              </h4>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {latestCommentary.weekRange}
                </div>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-[10px] font-bold',
                  latestCommentary.outlook === 'Bullish' ? 'bg-green-50 text-green-700' :
                  latestCommentary.outlook === 'Bearish' ? 'bg-red-50 text-red-700' :
                  latestCommentary.outlook === 'Cautiously Optimistic' ? 'bg-brand-50 text-brand' :
                  'bg-amber-50 text-amber-700'
                )}>
                  {latestCommentary.outlook}
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                {latestCommentary.summary}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No commentaries yet</p>
          )}
          <Link
            href="/admin/market"
            className="flex items-center gap-1 mt-4 text-xs font-semibold text-brand hover:underline"
          >
            Manage Market Pulse <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* System Info */}
      <div className="card-base p-6">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="w-5 h-5 text-slate-400" />
          <h3 className="font-bold text-primary-700 text-sm">System Information</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400">Platform</span>
            <div className="font-semibold text-primary-700">Mera SIP Online</div>
          </div>
          <div>
            <span className="text-slate-400">Domain</span>
            <div className="font-semibold text-primary-700">merasip.com</div>
          </div>
          <div>
            <span className="text-slate-400">AMFI ARN</span>
            <div className="font-semibold text-primary-700">ARN-286886</div>
          </div>
          <div>
            <span className="text-slate-400">Stack</span>
            <div className="font-semibold text-primary-700">Next.js 15 + React 19</div>
          </div>
        </div>
      </div>
    </div>
  );
}
