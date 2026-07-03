/**
 * Share With Client — a compact panel that lets an RM email a signed,
 * tracked, expiring link to the client deliverable instead of manually
 * printing/attaching a PDF. Shared by the Periodic Review, Client
 * Orientation and Investment Proposal review pages (each just points it
 * at its own /[id]/share endpoint — see lib/advisory/share.ts).
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Send, Mail, CheckCircle2, AlertTriangle } from 'lucide-react';

interface ShareHistoryEntry {
  id: number;
  createdAt: string;
  recipients: string[];
  opens: number;
  firstOpenedAt: string | null;
  lastOpenedAt: string | null;
  expiresAt: string;
  revoked: boolean;
}

export function ShareWithClientPanel({
  shareEndpoint,
  label,
  canShare,
}: {
  shareEndpoint: string;
  label: string;
  /** Pass false when the record isn't Approved/Published yet — shows a hint instead of the form. */
  canShare: boolean;
}) {
  const [recipients, setRecipients] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [history, setHistory] = useState<ShareHistoryEntry[]>([]);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch(shareEndpoint);
      const j = await res.json().catch(() => ({}));
      if (res.ok && Array.isArray(j.shares)) setHistory(j.shares);
    } catch {
      // best-effort — history is a nice-to-have, not load-bearing
    }
  }, [shareEndpoint]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  async function handleSend() {
    const emails = recipients
      .split(/[,\n]/)
      .map((e) => e.trim())
      .filter(Boolean);
    if (emails.length === 0) {
      setResult({ type: 'error', text: 'Enter at least one recipient email.' });
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(shareEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmails: emails, message: message.trim() || undefined }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setResult({ type: 'error', text: j.error || 'Failed to send.' });
      } else {
        setResult({ type: 'success', text: `Sent to ${(j.sentTo || emails).join(', ')}.` });
        setRecipients('');
        setMessage('');
        loadHistory();
      }
    } catch {
      setResult({ type: 'error', text: 'Network error — please try again.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
        <Mail className="w-4 h-4" /> Share with Client
      </h2>

      {!canShare ? (
        <p className="text-sm text-slate-500">
          Approve and publish this {label.toLowerCase()} first — sharing is only available once it&rsquo;s client-ready.
        </p>
      ) : (
        <>
          <div className="space-y-2">
            <input
              type="text"
              value={recipients}
              onChange={(e) => setRecipients(e.target.value)}
              placeholder="client@example.com, spouse@example.com"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Optional personal note (default message used if left blank)…"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:border-brand-500"
            />
            {result && (
              <div className={`rounded-lg border p-2.5 flex items-start gap-2 text-sm ${result.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
                {result.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
                <span>{result.text}</span>
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSend}
                disabled={sending}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
              >
                <Send className="w-4 h-4" /> {sending ? 'Sending…' : 'Send Link'}
              </button>
            </div>
          </div>

          {history.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Sent previously</div>
              <ul className="space-y-1.5">
                {history.map((h) => (
                  <li key={h.id} className="text-xs text-slate-600 flex items-center justify-between gap-2">
                    <span className="truncate">{h.recipients.join(', ')} · {new Date(h.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                    <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full font-semibold ${h.opens > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {h.revoked ? 'Revoked' : h.opens > 0 ? `Opened ×${h.opens}` : 'Not opened yet'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
