'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search, FileDown } from 'lucide-react';
import { letterName } from '@/lib/hr/letter-catalog';

interface LetterRow {
  id: number;
  letter_type: string;
  entity: 'TAS' | 'TIB';
  recipient_name: string | null;
  serial_number: string | null;
  status: string;
  generated_by: string;
  generated_at: string;
}

export default function LettersPage() {
  const [rows, setRows] = useState<LetterRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/employee/hr/letters?page=1&pageSize=50')
      .then((r) => r.json())
      .then((j) => {
        setRows(j.rows || []);
        setTotal(j.total || 0);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = q
    ? rows.filter(
        (r) =>
          r.recipient_name?.toLowerCase().includes(q.toLowerCase()) ||
          r.letter_type.toLowerCase().includes(q.toLowerCase()) ||
          (r.serial_number || '').toLowerCase().includes(q.toLowerCase())
      )
    : rows;

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">HR Letters</h1>
          <p className="text-sm text-slate-500 mt-1">
            {loading ? 'Loading…' : `${total} letter${total === 1 ? '' : 's'} on file`}
          </p>
        </div>
        <Link
          href="/employee/hr/letters/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 transition"
        >
          <Plus className="w-4 h-4" />
          New Letter
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="search"
          placeholder="Search by recipient, type, or serial…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full max-w-md pl-9 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Recipient</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Serial</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Generated</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Download</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={r.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                <td className="px-4 py-2.5 font-medium">
                  <Link href={`/employee/hr/letters/${r.id}`} className="text-slate-900 hover:text-brand hover:underline">
                    {r.recipient_name || '—'}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-slate-700">
                  <Link href={`/employee/hr/letters/${r.id}`} className="hover:text-brand hover:underline">{letterName(r.letter_type)}</Link>
                </td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    r.entity === 'TAS' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {r.entity}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{r.serial_number || '—'}</td>
                <td className="px-4 py-2.5">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    r.status === 'sent' ? 'bg-emerald-100 text-emerald-800' :
                    r.status === 'signed' ? 'bg-violet-100 text-violet-800' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-xs text-slate-500">
                  {new Date(r.generated_at).toLocaleString('en-IN', {
                    day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <a
                    href={`/api/employee/hr/letters/${r.id}/doc`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900"
                  >
                    <FileDown className="w-3.5 h-3.5" /> Word
                  </a>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                  <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  No letters generated yet. Click &ldquo;New Letter&rdquo; to create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
