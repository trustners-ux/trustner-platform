'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, Loader2, AlertCircle, Users, IndianRupee,
  BarChart3, Info,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import { RMNav } from '@/components/rm/RMNav';

interface UserInfo {
  employeeId: number;
  employeeCode: string;
  name: string;
  designation: string;
  entity: string;
  segment: string;
}

interface TrailRecord {
  id: number;
  clientName: string;
  clientPan: string;
  schemeName: string;
  amcName: string;
  sourceType: string;
  fundCategory: string;
  currentAum: number;
  trailRatePct: number;
  monthlyTrail: number;
  myShare: number;
  mySharePct: number;
}

const SOURCE_LABELS: Record<string, string> = {
  self_new_pan: 'Self-Sourced — New PAN',
  self_existing: 'Self-Sourced — Existing',
  assigned_new: 'Assigned — New Business',
  assigned_no_new: 'Assigned — No New Business',
  walk_in: 'Office Walk-in',
};

const SOURCE_RM_PCT: Record<string, number> = {
  self_new_pan: 25,
  self_existing: 15,
  assigned_new: 15,
  assigned_no_new: 0,
  walk_in: 10,
};

const FUND_LABELS: Record<string, string> = {
  equity_active: 'Equity — Active',
  equity_index: 'Equity — Index',
  hybrid: 'Hybrid / Balanced',
  debt: 'Debt — Active',
  liquid: 'Liquid / Overnight',
};

// ─── Seed Data ───
function generateSeedTrails(): TrailRecord[] {
  return [
    { id: 1, clientName: 'Arun Mehta', clientPan: 'ABCPM1234A', schemeName: 'HDFC Flexi Cap Fund', amcName: 'HDFC AMC', sourceType: 'self_new_pan', fundCategory: 'equity_active', currentAum: 850000, trailRatePct: 1.0, monthlyTrail: 708, myShare: 177, mySharePct: 25 },
    { id: 2, clientName: 'Priya Sharma', clientPan: 'DEFPS5678B', schemeName: 'ICICI Pru Bluechip', amcName: 'ICICI Pru AMC', sourceType: 'self_new_pan', fundCategory: 'equity_active', currentAum: 1200000, trailRatePct: 0.9, monthlyTrail: 900, myShare: 225, mySharePct: 25 },
    { id: 3, clientName: 'Vikram Singh', clientPan: 'GHIVS9012C', schemeName: 'SBI Nifty 50 Index', amcName: 'SBI AMC', sourceType: 'self_existing', fundCategory: 'equity_index', currentAum: 500000, trailRatePct: 0.4, monthlyTrail: 167, myShare: 25, mySharePct: 15 },
    { id: 4, clientName: 'Neeta Agarwal', clientPan: 'JKLNA3456D', schemeName: 'Kotak Balanced Advantage', amcName: 'Kotak AMC', sourceType: 'assigned_new', fundCategory: 'hybrid', currentAum: 700000, trailRatePct: 0.7, monthlyTrail: 408, myShare: 61, mySharePct: 15 },
    { id: 5, clientName: 'Rajan Das', clientPan: 'MNORD7890E', schemeName: 'Axis Short Term Debt', amcName: 'Axis AMC', sourceType: 'walk_in', fundCategory: 'debt', currentAum: 300000, trailRatePct: 0.5, monthlyTrail: 125, myShare: 13, mySharePct: 10 },
    { id: 6, clientName: 'Sunita Roy', clientPan: 'PQRSR1234F', schemeName: 'HDFC Liquid Fund', amcName: 'HDFC AMC', sourceType: 'assigned_no_new', fundCategory: 'liquid', currentAum: 200000, trailRatePct: 0.1, monthlyTrail: 17, myShare: 0, mySharePct: 0 },
    { id: 7, clientName: 'Mohan Pillai', clientPan: 'STUMP5678G', schemeName: 'Mirae Asset Large Cap', amcName: 'Mirae AMC', sourceType: 'self_new_pan', fundCategory: 'equity_active', currentAum: 950000, trailRatePct: 1.1, monthlyTrail: 871, myShare: 218, mySharePct: 25 },
    { id: 8, clientName: 'Anjali Shah', clientPan: 'VWXAS9012H', schemeName: 'Nippon India SIP Insure', amcName: 'Nippon AMC', sourceType: 'self_existing', fundCategory: 'equity_active', currentAum: 400000, trailRatePct: 0.85, monthlyTrail: 283, myShare: 42, mySharePct: 15 },
  ];
}

export default function TrailsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [trails] = useState<TrailRecord[]>(generateSeedTrails);

  useEffect(() => {
    async function load() {
      try {
        const authRes = await fetch('/api/rm/auth');
        if (!authRes.ok) { router.push('/admin/login'); return; }
        const { user: u } = await authRes.json();
        setUser(u);
      } catch { router.push('/admin/login'); }
      finally { setLoading(false); }
    }
    load();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/rm/auth', { method: 'DELETE' });
    router.push('/admin/login');
  };

  const totalAum = useMemo(() => trails.reduce((s, t) => s + t.currentAum, 0), [trails]);
  const myMonthlyTrail = useMemo(() => trails.reduce((s, t) => s + t.myShare, 0), [trails]);
  const clientCount = trails.length;

  // Group by source type
  const bySource = useMemo(() => {
    const groups: Record<string, { entries: TrailRecord[]; totalAum: number; myTrail: number }> = {};
    trails.forEach(t => {
      if (!groups[t.sourceType]) groups[t.sourceType] = { entries: [], totalAum: 0, myTrail: 0 };
      groups[t.sourceType].entries.push(t);
      groups[t.sourceType].totalAum += t.currentAum;
      groups[t.sourceType].myTrail += t.myShare;
    });
    return groups;
  }, [trails]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <RMNav userName={user.name} designation={user.designation} entity={user.entity} onLogout={handleLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-lg font-bold text-slate-800 mb-4">My Trail Income</h1>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total AUM</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{formatINR(totalAum)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-emerald-500"><TrendingUp className="w-5 h-5 text-white" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">My Monthly Trail</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{formatINR(myMonthlyTrail)}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-500"><IndianRupee className="w-5 h-5 text-white" /></div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Clients</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">{clientCount}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-500"><Users className="w-5 h-5 text-white" /></div>
            </div>
          </div>
        </div>

        {/* Source Distribution */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
          <h3 className="font-bold text-slate-700 flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-slate-400" /> Trail by Source Type
          </h3>
          <div className="space-y-3">
            {Object.entries(bySource).map(([src, data]) => {
              const pct = myMonthlyTrail > 0 ? Math.round(data.myTrail / myMonthlyTrail * 100) : 0;
              return (
                <div key={src}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-slate-600">{SOURCE_LABELS[src] || src}</span>
                    <span className="text-xs font-bold text-slate-700">{formatINR(data.myTrail)}/mo</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-slate-400">AUM: {formatINR(data.totalAum)}</span>
                    <span className="text-[10px] text-slate-400">{pct}% of trail</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trail Portfolio Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-700">Trail Portfolio</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Scheme</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">AMC</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">AUM</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500">Trail Rate</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">My Share</th>
                </tr>
              </thead>
              <tbody>
                {trails.map(t => (
                  <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-700 text-sm">{t.clientName}</p>
                      <p className="text-[10px] text-slate-400">{SOURCE_LABELS[t.sourceType]} ({t.mySharePct}%)</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">{t.schemeName}</td>
                    <td className="px-4 py-3 text-xs text-slate-500">{t.amcName}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700">{formatINR(t.currentAum)}</td>
                    <td className="px-4 py-3 text-center text-xs text-slate-500">{t.trailRatePct}%</td>
                    <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatINR(t.myShare)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 bg-slate-50">
                  <td colSpan={3} className="px-4 py-3 text-sm font-bold text-slate-700">Total</td>
                  <td className="px-4 py-3 text-right font-bold text-slate-700">{formatINR(totalAum)}</td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right font-bold text-emerald-600">{formatINR(myMonthlyTrail)}/mo</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* RM Share Reference */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-blue-700">Trail Income — How It Works</h3>
          </div>
          <p className="text-xs text-blue-600 mb-3">
            Trail income is the recurring commission Trustner earns from AMCs on your clients&apos; mutual fund AUM. Your share depends on how the client was sourced:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(SOURCE_RM_PCT).map(([src, pct]) => (
              <div key={src} className="flex items-center justify-between bg-white/60 rounded-lg px-3 py-2">
                <span className="text-xs text-blue-700">{SOURCE_LABELS[src]}</span>
                <span className="text-xs font-bold text-blue-800">{pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
