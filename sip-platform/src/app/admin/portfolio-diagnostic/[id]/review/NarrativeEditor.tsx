/**
 * Narrative Editor — Phase-2 reviewer override UI.
 *
 * Slot: lives inside the review page as a tab. Reads the LLM-generated
 * NarrativeJSON, presents each section as an editable textarea, saves
 * reviewer edits into pd_diagnostic_narratives.edited_json (the renderer
 * uses edited_json if non-null, else narrative_json).
 *
 * Edit model:
 *   - Each text field is independently editable
 *   - We track which sections are "edited" (different from LLM original)
 *   - Save sends the FULL edited_json (not a delta) — simpler audit
 *   - Reset section = revert that field to the LLM value
 *   - Reset all = clear edited_json (renderer falls back to narrative_json)
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  Sparkles, RefreshCw, Save, RotateCcw, Loader2, AlertCircle,
  CheckCircle2, Edit3, Eye, ChevronDown, ChevronRight,
} from 'lucide-react';
import type { NarrativeJSON } from '@/lib/portfolio-diagnostic/narrative-engine';

interface NarrativeApiResponse {
  narrative_json: NarrativeJSON | null;
  edited_json: NarrativeJSON | null;
  meta: {
    id: number;
    modelVersion: string;
    promptVersion: string;
    generatedAt: string;
    generationMs: number;
    inputTokens: number;
    outputTokens: number;
    cacheReadTokens: number;
    cacheCreationTokens: number;
    estimatedCostUsd: number;
    editedByEmployeeId: number | null;
    editedAt: string | null;
    reviewerRating: number | null;
    reviewerNotes: string | null;
    hasEdits: boolean;
  } | null;
}

interface Props {
  diagnosticRunId: number;
}

export function NarrativeEditor({ diagnosticRunId }: Props) {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NarrativeApiResponse | null>(null);
  const [working, setWorking] = useState<NarrativeJSON | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    centralFinding: true,
    bottomLine: true,
  });
  const [confirmRegen, setConfirmRegen] = useState(false);

  // The "baseline" we diff edits against — edited_json if present, else narrative_json
  const baseline = useMemo<NarrativeJSON | null>(
    () => data?.edited_json ?? data?.narrative_json ?? null,
    [data]
  );

  // Field-level dirty detection (for the "edited" badge)
  const dirtyFields = useMemo(() => {
    if (!working || !data?.narrative_json) return new Set<string>();
    const dirty = new Set<string>();
    const llm = data.narrative_json as unknown as Record<string, unknown>;
    const cur = working as unknown as Record<string, unknown>;
    for (const k of Object.keys(cur)) {
      if (JSON.stringify(llm[k]) !== JSON.stringify(cur[k])) dirty.add(k);
    }
    return dirty;
  }, [working, data]);

  const hasUnsavedChanges = useMemo(() => {
    if (!working || !baseline) return false;
    return JSON.stringify(working) !== JSON.stringify(baseline);
  }, [working, baseline]);

  // Initial fetch
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative`,
          { credentials: 'include' }
        );
        if (cancelled) return;
        if (res.status === 404) {
          setData({ narrative_json: null, edited_json: null, meta: null });
          setWorking(null);
        } else if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          setError(err.error ?? `Fetch failed (${res.status})`);
        } else {
          const body = (await res.json()) as NarrativeApiResponse;
          setData(body);
          setWorking((body.edited_json ?? body.narrative_json) as NarrativeJSON | null);
          if (body.meta?.reviewerNotes) setReviewerNotes(body.meta.reviewerNotes);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [diagnosticRunId]);

  async function triggerInitialGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative?generate=1`,
        { credentials: 'include' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Generation failed');
        return;
      }
      const body = (await res.json()) as NarrativeApiResponse;
      setData(body);
      setWorking((body.edited_json ?? body.narrative_json) as NarrativeJSON | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function regenerate() {
    setGenerating(true);
    setError(null);
    setConfirmRegen(false);
    try {
      const res = await fetch(
        `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative/regenerate`,
        { method: 'POST', credentials: 'include' }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Regen failed');
        return;
      }
      // Re-fetch to get the canonical row shape
      const refetch = await fetch(
        `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative`,
        { credentials: 'include' }
      );
      const body = (await refetch.json()) as NarrativeApiResponse;
      setData(body);
      setWorking((body.edited_json ?? body.narrative_json) as NarrativeJSON | null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function save() {
    if (!working) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edited_json: working, reviewer_notes: reviewerNotes || undefined }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? `Save failed (${res.status})`);
        return;
      }
      // Update local state to reflect that working is now the new baseline
      setData((prev) => prev ? { ...prev, edited_json: working, meta: prev.meta ? { ...prev.meta, hasEdits: true, editedAt: new Date().toISOString() } : prev.meta } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function clearAllEdits() {
    if (!confirm('Discard all your edits and revert every section to the LLM output?')) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/admin/portfolio-diagnostic/${diagnosticRunId}/narrative`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ edited_json: null }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setError(err.error ?? 'Reset failed');
        return;
      }
      if (data?.narrative_json) setWorking(data.narrative_json);
      setData((prev) => prev ? { ...prev, edited_json: null, meta: prev.meta ? { ...prev.meta, hasEdits: false, editedAt: null } : prev.meta } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function resetSection<K extends keyof NarrativeJSON>(key: K) {
    if (!data?.narrative_json || !working) return;
    setWorking({ ...working, [key]: data.narrative_json[key] } as NarrativeJSON);
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Render branches ────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
        Loading narrative…
      </div>
    );
  }

  if (!data || !data.narrative_json) {
    // No narrative yet — offer to generate
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-8">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-amber-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-amber-900">No narrative draft yet</h3>
            <p className="text-sm text-amber-800 mt-1">
              Click <strong>Generate Narrative</strong> to have Claude Opus 4.7 produce a Trustner-quality
              advisor narrative for this diagnostic. Takes 40-60 seconds. Costs ~₹9 (cached: ~₹3-4).
            </p>
            {error && (
              <div className="mt-3 rounded bg-rose-100 border border-rose-300 px-3 py-2 text-xs text-rose-900">
                <AlertCircle className="h-3.5 w-3.5 inline mr-1" /> {error}
              </div>
            )}
            <button
              onClick={triggerInitialGenerate}
              disabled={generating}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {generating ? 'Generating (40-60 sec)…' : 'Generate Narrative'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!working) return null;

  return (
    <div className="space-y-4">
      {/* HEADER STRIP — meta + action buttons */}
      <div className="rounded-lg border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Narrative Review</h3>
              <p className="text-xs text-slate-600">
                LLM-generated advisor narrative. Edit any section; the PDF picks up your edits automatically.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/admin/portfolio-diagnostic/${diagnosticRunId}/report?type=narrative`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Eye className="h-3.5 w-3.5" /> Preview PDF
            </a>
            <button
              onClick={() => setConfirmRegen(true)}
              disabled={generating || saving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
              title="Discard everything and call Claude again (~₹9 cost)"
            >
              {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Regenerate
            </button>
            {data?.meta?.hasEdits && (
              <button
                onClick={clearAllEdits}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                title="Revert all sections to LLM output"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Clear all edits
              </button>
            )}
            <button
              onClick={save}
              disabled={!hasUnsavedChanges || saving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 disabled:opacity-40"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              {hasUnsavedChanges ? 'Save edits' : 'Saved'}
            </button>
          </div>
        </div>

        {/* META STRIP */}
        {data.meta && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
            <span>Model: <strong className="text-slate-700">{data.meta.modelVersion}</strong></span>
            <span>Generated: <strong className="text-slate-700">{new Date(data.meta.generatedAt).toLocaleString('en-IN')}</strong></span>
            <span>Latency: <strong className="text-slate-700">{(data.meta.generationMs / 1000).toFixed(1)}s</strong></span>
            <span>Tokens: <strong className="text-slate-700">{data.meta.inputTokens}↓ + {data.meta.outputTokens}↑</strong></span>
            <span>Cost: <strong className="text-slate-700">${data.meta.estimatedCostUsd?.toFixed(4)} (~₹{((data.meta.estimatedCostUsd ?? 0) * 83).toFixed(2)})</strong></span>
            {data.meta.hasEdits && (
              <span className="rounded bg-amber-100 px-1.5 py-0.5 text-amber-900 font-semibold">
                Reviewer edits applied{data.meta.editedAt ? ` · ${new Date(data.meta.editedAt).toLocaleString('en-IN')}` : ''}
              </span>
            )}
          </div>
        )}

        {confirmRegen && (
          <div className="mt-3 rounded-lg border-2 border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-semibold">Regenerate from scratch?</p>
            <p className="text-xs mt-1">This will discard ALL current text (including your edits) and call Claude Opus 4.7 again. Cost: ~₹9. Use when the underlying holdings have materially changed.</p>
            <div className="mt-2 flex gap-2">
              <button onClick={regenerate} className="rounded bg-amber-600 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-700">Yes, regenerate</button>
              <button onClick={() => setConfirmRegen(false)} className="rounded border border-amber-400 px-3 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100">Cancel</button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-3 rounded bg-rose-100 border border-rose-300 px-3 py-2 text-xs text-rose-900">
            <AlertCircle className="h-3.5 w-3.5 inline mr-1" /> {error}
          </div>
        )}
      </div>

      {/* SECTION EDITORS */}
      <TextSection
        sectionKey="centralFinding"
        label="Central finding (the lede)"
        hint="2-3 sentence headline — the single most important observation. Appears at the top of every PDF."
        value={working.centralFinding}
        onChange={(v) => setWorking({ ...working, centralFinding: v })}
        edited={dirtyFields.has('centralFinding')}
        expanded={expandedSections['centralFinding'] ?? true}
        onToggle={() => toggleSection('centralFinding')}
        onReset={() => resetSection('centralFinding')}
        rows={4}
      />

      <TextSection
        sectionKey="bottomLine"
        label="Bottom line (Section 1)"
        hint="1-paragraph summary that appears under Family Snapshot."
        value={working.bottomLine}
        onChange={(v) => setWorking({ ...working, bottomLine: v })}
        edited={dirtyFields.has('bottomLine')}
        expanded={expandedSections['bottomLine'] ?? true}
        onToggle={() => toggleSection('bottomLine')}
        onReset={() => resetSection('bottomLine')}
        rows={5}
      />

      <TextSection
        sectionKey="panLevelObservation"
        label="PAN-level observation (Section 2)"
        hint="XIRR-gap finding across PANs. Leave empty if single PAN."
        value={working.panLevelObservation}
        onChange={(v) => setWorking({ ...working, panLevelObservation: v })}
        edited={dirtyFields.has('panLevelObservation')}
        expanded={expandedSections['panLevelObservation'] ?? false}
        onToggle={() => toggleSection('panLevelObservation')}
        onReset={() => resetSection('panLevelObservation')}
        rows={4}
      />

      <TextSection
        sectionKey="directNote"
        label="Direct note for the family (Section 12)"
        hint="3-4 paragraph empathetic close. Use blank lines to separate paragraphs."
        value={working.directNote}
        onChange={(v) => setWorking({ ...working, directNote: v })}
        edited={dirtyFields.has('directNote')}
        expanded={expandedSections['directNote'] ?? true}
        onToggle={() => toggleSection('directNote')}
        onReset={() => resetSection('directNote')}
        rows={10}
      />

      <TextSection
        sectionKey="toneNote"
        label="Tone for the meeting (Section 13 — advisor only)"
        hint="Internal guidance for Sangeeta/Ram about how to pace the conversation."
        value={working.toneNote}
        onChange={(v) => setWorking({ ...working, toneNote: v })}
        edited={dirtyFields.has('toneNote')}
        expanded={expandedSections['toneNote'] ?? false}
        onToggle={() => toggleSection('toneNote')}
        onReset={() => resetSection('toneNote')}
        rows={5}
      />

      {/* ARRAY EDITORS — render as line-per-item textareas for fast editing */}
      <ArraySection
        sectionKey="topActions"
        label="Top actions — what to do FIRST (Section 10)"
        hint="One action per line. Numbered automatically."
        items={working.topActions}
        onChange={(items) => setWorking({ ...working, topActions: items })}
        edited={dirtyFields.has('topActions')}
        expanded={expandedSections['topActions'] ?? false}
        onToggle={() => toggleSection('topActions')}
        onReset={() => resetSection('topActions')}
      />

      <ArraySection
        sectionKey="whatNotToDo"
        label="What NOT to do (Section 11)"
        hint="One item per line."
        items={working.whatNotToDo}
        onChange={(items) => setWorking({ ...working, whatNotToDo: items })}
        edited={dirtyFields.has('whatNotToDo')}
        expanded={expandedSections['whatNotToDo'] ?? false}
        onToggle={() => toggleSection('whatNotToDo')}
        onReset={() => resetSection('whatNotToDo')}
      />

      {/* COMPLEX SECTIONS — show read-only summary with "Edit JSON" option */}
      <ComplexSection
        sectionKey="perHoldingWhy"
        label={`Per-holding 'why' reasoning (${working.perHoldingWhy?.length ?? 0} entries)`}
        hint="Per-holding verdict reasoning. Edit via the Holdings tab (per-holding override) or via raw JSON."
        json={working.perHoldingWhy}
        edited={dirtyFields.has('perHoldingWhy')}
        expanded={expandedSections['perHoldingWhy'] ?? false}
        onToggle={() => toggleSection('perHoldingWhy')}
        onReset={() => resetSection('perHoldingWhy')}
        onChange={(json) => setWorking({ ...working, perHoldingWhy: json as NarrativeJSON['perHoldingWhy'] })}
      />

      <ComplexSection
        sectionKey="deadMoneyFindings"
        label="Dead-money findings (Section 3)"
        hint="Underperformer findings. Set to null if no laggards worth surfacing."
        json={working.deadMoneyFindings}
        edited={dirtyFields.has('deadMoneyFindings')}
        expanded={expandedSections['deadMoneyFindings'] ?? false}
        onToggle={() => toggleSection('deadMoneyFindings')}
        onReset={() => resetSection('deadMoneyFindings')}
        onChange={(json) => setWorking({ ...working, deadMoneyFindings: json as NarrativeJSON['deadMoneyFindings'] })}
      />

      <ComplexSection
        sectionKey="sipAudit"
        label="SIP audit (Section 4)"
        hint="SIP-related findings. Set to null if no SIP issues."
        json={working.sipAudit}
        edited={dirtyFields.has('sipAudit')}
        expanded={expandedSections['sipAudit'] ?? false}
        onToggle={() => toggleSection('sipAudit')}
        onReset={() => resetSection('sipAudit')}
        onChange={(json) => setWorking({ ...working, sipAudit: json as NarrativeJSON['sipAudit'] })}
      />

      <ComplexSection
        sectionKey="portfolioOverlap"
        label="Portfolio overlap analysis (Section 6)"
        hint="Category-level overlap findings."
        json={working.portfolioOverlap}
        edited={dirtyFields.has('portfolioOverlap')}
        expanded={expandedSections['portfolioOverlap'] ?? false}
        onToggle={() => toggleSection('portfolioOverlap')}
        onReset={() => resetSection('portfolioOverlap')}
        onChange={(json) => setWorking({ ...working, portfolioOverlap: json as NarrativeJSON['portfolioOverlap'] })}
      />

      <ComplexSection
        sectionKey="internationalPlan"
        label="International diversification plan (Section 7)"
        hint="Set to null if not applicable for this family."
        json={working.internationalPlan}
        edited={dirtyFields.has('internationalPlan')}
        expanded={expandedSections['internationalPlan'] ?? false}
        onToggle={() => toggleSection('internationalPlan')}
        onReset={() => resetSection('internationalPlan')}
        onChange={(json) => setWorking({ ...working, internationalPlan: json as NarrativeJSON['internationalPlan'] })}
      />

      <ComplexSection
        sectionKey="taxImpact"
        label="Tax impact (Section 8)"
        hint="Per-swap tax rollup + net + summary."
        json={working.taxImpact}
        edited={dirtyFields.has('taxImpact')}
        expanded={expandedSections['taxImpact'] ?? false}
        onToggle={() => toggleSection('taxImpact')}
        onReset={() => resetSection('taxImpact')}
        onChange={(json) => setWorking({ ...working, taxImpact: json as NarrativeJSON['taxImpact'] })}
      />

      <ComplexSection
        sectionKey="wealthScenarios"
        label={`Wealth scenarios (Section 9 — ${working.wealthScenarios?.length ?? 0} scenarios)`}
        hint="5-year AUM projections per action path."
        json={working.wealthScenarios}
        edited={dirtyFields.has('wealthScenarios')}
        expanded={expandedSections['wealthScenarios'] ?? false}
        onToggle={() => toggleSection('wealthScenarios')}
        onReset={() => resetSection('wealthScenarios')}
        onChange={(json) => setWorking({ ...working, wealthScenarios: json as NarrativeJSON['wealthScenarios'] })}
      />

      <ComplexSection
        sectionKey="meetingAgenda"
        label={`Meeting agenda (Section 13 — ${working.meetingAgenda?.length ?? 0} items)`}
        hint="Time-allocated agenda for the family meeting."
        json={working.meetingAgenda}
        edited={dirtyFields.has('meetingAgenda')}
        expanded={expandedSections['meetingAgenda'] ?? false}
        onToggle={() => toggleSection('meetingAgenda')}
        onReset={() => resetSection('meetingAgenda')}
        onChange={(json) => setWorking({ ...working, meetingAgenda: json as NarrativeJSON['meetingAgenda'] })}
      />

      <ComplexSection
        sectionKey="anticipatedQA"
        label={`Anticipated Q&A (Section 14 — ${working.anticipatedQA?.length ?? 0} questions)`}
        hint="Scripted answers to questions the family is likely to ask."
        json={working.anticipatedQA}
        edited={dirtyFields.has('anticipatedQA')}
        expanded={expandedSections['anticipatedQA'] ?? false}
        onToggle={() => toggleSection('anticipatedQA')}
        onReset={() => resetSection('anticipatedQA')}
        onChange={(json) => setWorking({ ...working, anticipatedQA: json as NarrativeJSON['anticipatedQA'] })}
      />

      {/* REVIEWER NOTES */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="block text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">
          Reviewer notes (internal, not in PDF)
        </label>
        <textarea
          value={reviewerNotes}
          onChange={(e) => setReviewerNotes(e.target.value)}
          rows={2}
          placeholder="Anything to flag for the next reviewer / yourself later…"
          className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SECTION SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────

interface SectionShellProps {
  sectionKey: string;
  label: string;
  hint: string;
  edited: boolean;
  expanded: boolean;
  onToggle: () => void;
  onReset: () => void;
  children: React.ReactNode;
}

function SectionShell({ label, hint, edited, expanded, onToggle, onReset, children }: SectionShellProps) {
  return (
    <div className={`rounded-lg border ${edited ? 'border-amber-300 bg-amber-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between px-4 py-2.5">
        <button onClick={onToggle} className="flex items-center gap-2 text-left flex-1">
          {expanded ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
          <span className="text-sm font-semibold text-slate-900">{label}</span>
          {edited && (
            <span className="inline-flex items-center gap-1 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">
              <Edit3 className="h-2.5 w-2.5" /> Edited
            </span>
          )}
        </button>
        {edited && (
          <button
            onClick={onReset}
            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
            title="Revert this section to the LLM output"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
      {expanded && (
        <div className="border-t border-slate-200 px-4 py-3 space-y-2">
          <p className="text-[11px] text-slate-500 italic">{hint}</p>
          {children}
        </div>
      )}
    </div>
  );
}

function TextSection({
  sectionKey, label, hint, value, onChange, edited, expanded, onToggle, onReset, rows = 4,
}: {
  sectionKey: string; label: string; hint: string;
  value: string; onChange: (v: string) => void;
  edited: boolean; expanded: boolean; onToggle: () => void; onReset: () => void;
  rows?: number;
}) {
  return (
    <SectionShell sectionKey={sectionKey} label={label} hint={hint} edited={edited} expanded={expanded} onToggle={onToggle} onReset={onReset}>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none leading-relaxed"
      />
      <p className="text-[10px] text-slate-400 mt-1">{(value ?? '').length} characters</p>
    </SectionShell>
  );
}

function ArraySection({
  sectionKey, label, hint, items, onChange, edited, expanded, onToggle, onReset,
}: {
  sectionKey: string; label: string; hint: string;
  items: string[]; onChange: (items: string[]) => void;
  edited: boolean; expanded: boolean; onToggle: () => void; onReset: () => void;
}) {
  const text = (items ?? []).join('\n');
  return (
    <SectionShell sectionKey={sectionKey} label={label} hint={hint} edited={edited} expanded={expanded} onToggle={onToggle} onReset={onReset}>
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value.split('\n').filter(s => s.trim().length > 0))}
        rows={Math.max(3, (items?.length ?? 0) + 1)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-mono focus:border-primary-500 focus:outline-none"
        placeholder="One item per line"
      />
      <p className="text-[10px] text-slate-400 mt-1">{items?.length ?? 0} items</p>
    </SectionShell>
  );
}

function ComplexSection({
  sectionKey, label, hint, json, onChange, edited, expanded, onToggle, onReset,
}: {
  sectionKey: string; label: string; hint: string;
  json: unknown; onChange: (json: unknown) => void;
  edited: boolean; expanded: boolean; onToggle: () => void; onReset: () => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(json, null, 2));
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(JSON.stringify(json, null, 2));
  }, [json]);

  function commit() {
    try {
      const parsed = JSON.parse(draft);
      setParseError(null);
      onChange(parsed);
    } catch (e) {
      setParseError(e instanceof Error ? e.message : 'Invalid JSON');
    }
  }

  return (
    <SectionShell sectionKey={sectionKey} label={label} hint={hint} edited={edited} expanded={expanded} onToggle={onToggle} onReset={onReset}>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        rows={Math.min(20, draft.split('\n').length + 1)}
        className="w-full rounded border border-slate-300 px-3 py-2 text-xs font-mono focus:border-primary-500 focus:outline-none leading-relaxed"
        spellCheck={false}
      />
      {parseError && (
        <p className="text-[11px] text-rose-700 mt-1">
          <AlertCircle className="h-3 w-3 inline mr-1" /> JSON error: {parseError}
        </p>
      )}
      {!parseError && draft !== JSON.stringify(json, null, 2) && (
        <p className="text-[11px] text-amber-700 mt-1">
          <CheckCircle2 className="h-3 w-3 inline mr-1" /> Click outside the box to apply changes
        </p>
      )}
    </SectionShell>
  );
}
