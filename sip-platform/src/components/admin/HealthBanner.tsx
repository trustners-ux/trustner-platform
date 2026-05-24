/**
 * HealthBanner — admin-wide visibility into platform health.
 *
 * Polls /api/health on mount + every 5 minutes. If anything critical
 * is broken (missing env var, DB unreachable), shows a red dismissible
 * banner with a link to /admin/health for full diagnosis.
 *
 * Surfaces the May-2026 silent-failure class of bugs the moment an
 * admin opens any /admin/* page — before they try (and fail) to do
 * actual work.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

interface HealthSummary {
  ok: boolean;
  summary: string;
  criticalCount: number;
}

const POLL_INTERVAL_MS = 5 * 60 * 1000;     // 5 minutes
const DISMISS_TTL_MS = 30 * 60 * 1000;      // re-show 30 min after dismiss

export function HealthBanner() {
  const [health, setHealth] = useState<HealthSummary | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Honor a recent dismiss
    const dismissedAt = Number(localStorage.getItem('health-banner-dismissed-at') || '0');
    if (dismissedAt && Date.now() - dismissedAt < DISMISS_TTL_MS) {
      setDismissed(true);
    }

    void load();
    const t = setInterval(() => void load(), POLL_INTERVAL_MS);
    return () => clearInterval(t);

    async function load() {
      try {
        const res = await fetch('/api/health', { credentials: 'include' });
        // 401 means not logged in — banner shouldn't show anyway (login page)
        if (res.status === 401) return;
        const data = await res.json();
        const critical =
          (data.env?.criticalMissing?.length ?? 0) +
          (data.env?.criticalMalformed?.length ?? 0) +
          (data.db?.ok === false ? 1 : 0);
        setHealth({
          ok: data.ok === true,
          summary: data.summary ?? '',
          criticalCount: critical,
        });
      } catch {
        // Silently ignore — banner is best-effort
      }
    }
  }, []);

  function handleDismiss() {
    localStorage.setItem('health-banner-dismissed-at', String(Date.now()));
    setDismissed(true);
  }

  if (!health || health.ok || dismissed) return null;

  return (
    <div className="bg-rose-600 text-white px-4 py-2.5 text-sm flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">
          <strong>{health.criticalCount} critical issue{health.criticalCount !== 1 ? 's' : ''}</strong>
          {' · '}
          {health.summary}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href="/admin/health"
          className="underline font-semibold whitespace-nowrap hover:text-rose-100"
        >
          View diagnosis →
        </Link>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-rose-700 rounded"
          aria-label="Dismiss"
          title="Hides for 30 minutes; reappears if issue persists"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
