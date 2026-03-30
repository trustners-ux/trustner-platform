'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus, PhoneCall, CheckCircle2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { LeadsTable } from '@/components/admin/LeadsTable';
import type { StoredLead } from '@/lib/admin/leads-store';

interface StatsCard {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/leads');
      const data = await res.json();
      if (data.leads) setLeads(data.leads);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const stats: StatsCard[] = [
    {
      label: 'Total Leads',
      value: leads.length,
      icon: Users,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'New',
      value: leads.filter((l) => l.status === 'new').length,
      icon: UserPlus,
      color: 'text-slate-600 bg-slate-100',
    },
    {
      label: 'Contacted',
      value: leads.filter((l) => l.status === 'contacted').length,
      icon: PhoneCall,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Converted',
      value: leads.filter((l) => l.status === 'converted').length,
      icon: CheckCircle2,
      color: 'text-green-600 bg-green-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-primary-700">Lead Management</h1>
          <p className="text-sm text-slate-500">Track and manage your incoming leads</p>
        </div>
        <button
          onClick={fetchLeads}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white border border-surface-200 rounded-xl hover:bg-surface-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
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

      {/* Leads Table */}
      {loading && leads.length === 0 ? (
        <div className="card-base p-12 text-center">
          <div className="animate-pulse text-sm text-slate-400">Loading leads...</div>
        </div>
      ) : (
        <LeadsTable leads={leads} />
      )}
    </div>
  );
}
