/**
 * Workbench — "Coming Soon" placeholder for /new pages of the 4 agents
 * whose create-draft flow hasn't been built yet (Meeting Prep,
 * Investment Proposal, Client Orientation, Periodic Review).
 *
 * Portfolio Diagnostic is the reference implementation; the other 4
 * have their dashboards live but the full new → draft → review →
 * approve → publish workflow is scheduled for the next sprint.
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  HardHat,
  CheckCircle2,
  Clock,
  ClipboardList,
} from 'lucide-react';

interface WorkbenchComingSoonProps {
  /** e.g. "Investment Proposal" */
  agentName: string;
  /** Where to go back (dashboard route), e.g. "/admin/investment-proposal" */
  backHref: string;
  /** Short description of what this agent will do */
  description: string;
  /** Bulleted list of features the /new page will offer when built */
  plannedFeatures: string[];
}

export function WorkbenchComingSoon({
  agentName,
  backHref,
  description,
  plannedFeatures,
}: WorkbenchComingSoonProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back link */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to {agentName} dashboard
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-8">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-amber-100 p-3 flex-shrink-0">
            <HardHat className="w-6 h-6 text-amber-700" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-amber-900 mb-1">
              {agentName} — New Draft
            </h1>
            <p className="text-sm text-amber-800">
              The create-draft form for this workbench is in active development.
              Dashboard and queue views are already live; the full intake form
              ships in the next sprint.
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          What this workbench does
        </h2>
        <p className="text-sm text-slate-700 leading-relaxed">{description}</p>
      </div>

      {/* Planned features */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">
          What the /new form will include
        </h2>
        <ul className="space-y-2">
          {plannedFeatures.map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-slate-700">
              <ClipboardList className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Status grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
              Already live
            </span>
          </div>
          <p className="text-sm text-emerald-800">
            Dashboard, role-based queues, status counts, audit log
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-slate-600" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Next sprint
            </span>
          </div>
          <p className="text-sm text-slate-700">
            New draft form, edit/review pages, PDF generation
          </p>
        </div>
      </div>

      {/* CTA back */}
      <div className="text-center pt-2">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-700 text-white text-sm font-semibold hover:bg-primary-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to {agentName} dashboard
        </Link>
      </div>

      {/* Reference */}
      <p className="text-center text-xs text-slate-500">
        For a fully working create-draft flow, see{' '}
        <Link href="/admin/portfolio-diagnostic/new" className="text-brand-600 hover:underline">
          Portfolio Diagnostic
        </Link>
        — the reference implementation for the 5-agent workbench.
      </p>
    </div>
  );
}
