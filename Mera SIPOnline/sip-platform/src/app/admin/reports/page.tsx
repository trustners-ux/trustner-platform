'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileCheck, Clock, XCircle, Send, RefreshCw, Download } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { ReportQueueTable } from '@/components/admin/ReportQueueTable';
import type { ReportQueueEntry } from '@/types/report-queue';

interface StatsCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

function formatAmount(val: number): string {
  if (val >= 10000000) return `${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `${(val / 100000).toFixed(2)} L`;
  if (val >= 1000) return `${(val / 1000).toFixed(1)} K`;
  return val.toString();
}

function exportToCSV(reports: ReportQueueEntry[]) {
  const headers = [
    'Report ID',
    'Name',
    'Email',
    'Phone',
    'Age',
    'City',
    'Score',
    'Grade',
    'Net Worth',
    'Risk Category',
    'Status',
    'Cashflow Score',
    'Protection Score',
    'Investments Score',
    'Debt Score',
    'Retirement Score',
    'Created At',
    'Sent At',
  ];

  const rows = reports.map((r) => [
    r.id,
    r.userName,
    r.userEmail,
    r.userPhone,
    r.userAge,
    r.userCity,
    r.totalScore,
    r.grade,
    r.netWorth,
    r.riskCategory,
    r.status,
    r.pillarScores.cashflow.score,
    r.pillarScores.protection.score,
    r.pillarScores.investments.score,
    r.pillarScores.debt.score,
    r.pillarScores.retirementReadiness.score,
    r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : '',
    r.sentAt ? new Date(r.sentAt).toLocaleDateString('en-IN') : '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) =>
      row.map((cell) => {
        const str = String(cell ?? '');
        return str.includes(',') || str.includes('"') || str.includes('\n')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `financial-reports-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportQueueEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reports');
      const data = await res.json();
      if (data.reports) setReports(data.reports);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const stats: StatsCard[] = [
    {
      label: 'Total Reports',
      value: reports.length,
      icon: FileCheck,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Pending Review',
      value: reports.filter((r) => r.status === 'pending_review').length,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Sent',
      value: reports.filter((r) => r.status === 'sent').length,
      icon: Send,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Rejected',
      value: reports.filter((r) => r.status === 'rejected').length,
      icon: XCircle,
      color: 'text-red-600 bg-red-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Financial Reports</h1>
          <p className="text-sm text-slate-500">Review, approve, and manage financial health reports</p>
        </div>
        <div className="flex items-center gap-2">
          {reports.length > 0 && (
            <button
              onClick={() => exportToCSV(reports)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export Excel
            </button>
          )}
          <button
            onClick={fetchReports}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="card-base p-5">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', stat.color)}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-extrabold text-primary-700">{stat.value}</div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Reports Table */}
      {loading && reports.length === 0 ? (
        <div className="card-base p-12 text-center">
          <div className="animate-pulse text-sm text-slate-400">Loading reports...</div>
        </div>
      ) : (
        <ReportQueueTable reports={reports} onRefresh={fetchReports} />
      )}
    </div>
  );
}
