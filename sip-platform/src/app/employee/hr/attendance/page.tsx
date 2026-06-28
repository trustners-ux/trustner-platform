'use client';

import { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, Home, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface Log {
  id: number;
  log_date: string;
  punch_in: string | null;
  punch_out: string | null;
  punch_in_location: string | null;
  punch_out_location: string | null;
  status: string | null;
  total_hours: number | null;
  notes: string | null;
}

const STATUS_COLOR: Record<string, string> = {
  present:     'bg-emerald-100 text-emerald-800',
  wfh:         'bg-blue-100 text-blue-800',
  late:        'bg-amber-100 text-amber-800',
  half_day:    'bg-orange-100 text-orange-800',
  absent:      'bg-rose-100 text-rose-800',
  holiday:     'bg-purple-100 text-purple-800',
  weekly_off:  'bg-slate-100 text-slate-700',
  leave:       'bg-violet-100 text-violet-800',
};

export default function AttendancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [today, setToday] = useState<Log | null>(null);
  const [loading, setLoading] = useState(false);
  const [punching, setPunching] = useState(false);
  const [msg, setMsg] = useState('');
  const [isWfh, setIsWfh] = useState(false);
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = () => {
    setLoading(true);
    fetch(`/api/employee/hr/attendance?month=${month}`)
      .then((r) => r.json())
      .then((j) => {
        setLogs(j.rows || []);
        const todayDate = new Date().toISOString().slice(0, 10);
        setToday((j.rows || []).find((r: Log) => r.log_date === todayDate) || null);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [month]);

  const punch = async (action: 'in' | 'out') => {
    setPunching(true);
    setMsg('');
    try {
      const coords = await new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation || isWfh) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
      const res = await fetch('/api/employee/hr/attendance/punch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...coords, is_wfh: isWfh }),
      });
      const j = await res.json();
      if (!res.ok) {
        setMsg(j.error || `HTTP ${res.status}`);
        return;
      }
      if (j.geofenceWarning) setMsg(`⚠ ${j.geofenceWarning}`);
      else setMsg(`✅ Punched ${action} successfully`);
      load();
    } finally {
      setPunching(false);
    }
  };

  const fmtTime = (iso: string | null) => iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—';
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', weekday: 'short' });

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">My Attendance</h1>
            <p className="text-sm text-slate-500 mt-0.5">Punch in/out · monthly summary</p>
          </div>
        </div>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 text-sm bg-white"
        />
      </div>

      {/* Today's punch card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl p-6 mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">Today</div>
            <div className="text-2xl font-extrabold">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {today ? (
              <div className="text-sm text-slate-300 mt-2 space-x-4">
                <span>In: <b className="text-white">{fmtTime(today.punch_in)}</b></span>
                {today.punch_out && <span>Out: <b className="text-white">{fmtTime(today.punch_out)}</b></span>}
                {today.total_hours && <span>Hours: <b className="text-white">{today.total_hours}</b></span>}
                {today.status && (
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[today.status] || 'bg-slate-200 text-slate-700'}`}>
                    {today.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-400 mt-2">Not punched in yet.</div>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input type="checkbox" checked={isWfh} onChange={(e) => setIsWfh(e.target.checked)} />
              <Home className="w-3.5 h-3.5" />
              <span>Working from home</span>
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => punch('in')}
                disabled={punching || !!today?.punch_in}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {punching ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                Punch In
              </button>
              <button
                onClick={() => punch('out')}
                disabled={punching || !today?.punch_in || !!today?.punch_out}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-500 text-white text-sm font-bold hover:bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {punching ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
                Punch Out
              </button>
            </div>
          </div>
        </div>
        {msg && (
          <div className={`mt-4 text-xs ${msg.startsWith('✅') ? 'text-emerald-300' : msg.startsWith('⚠') ? 'text-amber-300' : 'text-rose-300'}`}>
            {msg}
          </div>
        )}
      </div>

      {/* Month log */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-slate-700">
          {month} · {logs.length} day(s)
        </div>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Date</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">In</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Out</th>
              <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Hours</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Location</th>
              <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l, i) => (
              <tr key={l.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2 font-mono text-xs">{fmtDate(l.log_date)}</td>
                <td className="px-4 py-2 font-mono text-xs">{fmtTime(l.punch_in)}</td>
                <td className="px-4 py-2 font-mono text-xs">{fmtTime(l.punch_out)}</td>
                <td className="px-4 py-2 text-right font-mono">{l.total_hours ?? '—'}</td>
                <td className="px-4 py-2 text-xs text-slate-600 inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{l.punch_in_location || '—'}</td>
                <td className="px-4 py-2">
                  {l.status && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${STATUS_COLOR[l.status]}`}>
                      {l.status.replace('_', ' ')}
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {!loading && logs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  <AlertCircle className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  No attendance records for {month}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
