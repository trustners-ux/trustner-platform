'use client';

/**
 * HR Dashboard — Active separations + F&F pending tile.
 * Pulls /api/employee/hr/exits and bins client-side so we don't need a
 * dedicated counts endpoint.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogOut, ArrowRight } from 'lucide-react';

interface Row {
  status: string;
}

const ACTIVE = new Set(['draft', 'manager_review', 'notice_active', 'clearance_pending']);

export default function ExitsTile() {
  const [active, setActive] = useState<number | null>(null);
  const [fnfPending, setFnfPending] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/employee/hr/exits')
      .then((r) => r.json())
      .then((j) => {
        const rows = (j.rows || []) as Row[];
        setActive(rows.filter((r) => ACTIVE.has(r.status)).length);
        setFnfPending(rows.filter((r) => r.status === 'fnf_pending').length);
      })
      .catch(() => { setActive(0); setFnfPending(0); });
  }, []);

  return (
    <Link
      href="/employee/hr/exits"
      className="block mb-4 rounded-xl border border-rose-200 bg-gradient-to-r from-rose-50 to-amber-50 hover:from-rose-100 hover:to-amber-100 p-4 transition group"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-800">
              Separations &amp; F&amp;F
            </div>
            <div className="text-sm text-slate-800">
              Active separations: <b>{active ?? '…'}</b>
              <span className="mx-2 text-slate-300">·</span>
              F&amp;F pending: <b>{fnfPending ?? '…'}</b>
            </div>
          </div>
        </div>
        <div className="text-slate-500 group-hover:text-slate-900 inline-flex items-center gap-1 text-xs font-bold">
          Open <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  );
}
