'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, MapPin, Settings } from 'lucide-react';
import { FALLBACK_OFFICES, type Office } from '@/lib/hr/offices';

interface Holiday {
  id: number;
  fy: string;
  holiday_date: string;
  name: string;
  type: 'national' | 'festival' | 'regional' | 'restricted';
  entity: 'TAS' | 'TIB' | null;
  state: string | null;
  office_codes: string[] | null;
  description: string | null;
}

const TYPE_COLOR: Record<string, string> = {
  national:   'bg-blue-100 text-blue-800 border-blue-200',
  festival:   'bg-amber-100 text-amber-800 border-amber-200',
  regional:   'bg-emerald-100 text-emerald-800 border-emerald-200',
  restricted: 'bg-purple-100 text-purple-800 border-purple-200',
};

export default function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [fy, setFy] = useState('FY2026');
  const [office, setOffice] = useState<string>('');
  const [offices, setOffices] = useState<Office[]>(FALLBACK_OFFICES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/employee/hr/offices')
      .then((r) => r.json())
      .then((j) => { if (j.offices?.length) setOffices(j.offices); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = office ? `?fy=${fy}&office=${office}` : `?fy=${fy}`;
    fetch(`/api/employee/hr/holidays${qs}`)
      .then((r) => r.json())
      .then((j) => setHolidays(j.holidays || []))
      .finally(() => setLoading(false));
  }, [fy, office]);

  const groups = holidays.reduce<Record<string, Holiday[]>>((acc, h) => {
    const m = new Date(h.holiday_date).toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    (acc[m] = acc[m] || []).push(h);
    return acc;
  }, {});

  const dayName = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'long' });

  const officeListLabel = (codes: string[] | null): string => {
    if (!codes || codes.length === 0) return 'All offices';
    if (codes.length === offices.length) return 'All offices';
    return codes.map((c) => offices.find((o) => o.code === c)?.city || c).join(' · ');
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <CalendarDays className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Holiday Calendar</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {office ? `Filtered to ${offices.find((o) => o.code === office)?.shortLabel || office}` : 'All offices'}
              · {holidays.length} holidays
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={office}
            onChange={(e) => setOffice(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="">All offices</option>
            {offices.map((o) => (
              <option key={o.code} value={o.code}>
                {o.shortLabel}
              </option>
            ))}
          </select>
          <select
            value={fy}
            onChange={(e) => setFy(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
          >
            <option value="FY2026">FY 2026-27</option>
            <option value="FY2027">FY 2027-28</option>
          </select>
          <Link
            href="/employee/hr/holidays/admin"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
            title="HR admin only — manage holiday list"
          >
            <Settings className="w-4 h-4" />
            Manage
          </Link>
        </div>
      </div>

      {loading && <div className="text-sm text-slate-500">Loading…</div>}

      {Object.entries(groups).map(([month, items]) => (
        <div key={month} className="mb-6">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{month}</h2>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden divide-y divide-slate-100">
            {items.map((h) => (
              <div key={h.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50">
                <div className="text-center w-14 flex-shrink-0">
                  <div className="text-xl font-extrabold text-slate-900">{new Date(h.holiday_date).getDate()}</div>
                  <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{dayName(h.holiday_date).slice(0, 3)}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-900">{h.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{dayName(h.holiday_date)}</span>
                    <span className="text-slate-300">·</span>
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <MapPin className="w-3 h-3" />
                      {officeListLabel(h.office_codes)}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${TYPE_COLOR[h.type]}`}>
                  {h.type}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {!loading && holidays.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-500">
          No holidays configured for {fy}{office ? ` in ${offices.find((o) => o.code === office)?.city || office}` : ''}.
          Go to <Link href="/employee/hr/holidays/admin" className="text-brand underline">Manage</Link> to add some.
        </div>
      )}
    </div>
  );
}
