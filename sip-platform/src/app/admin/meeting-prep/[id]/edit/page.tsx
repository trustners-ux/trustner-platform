/**
 * Meeting Prep — Edit Brief
 *
 * Editor for the 4 main sections of a Meeting Brief:
 *   1. Relationship Snapshot
 *   2. Portfolio Current State (auto-filled, editable)
 *   3. Talking Points
 *   4. Action Items + Opportunities + Anticipated Q&A
 *
 * @owner Trustner Asset Services Pvt. Ltd. | ARN-286886
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Send, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface Brief {
  id: number;
  document_id: string;
  family_name: string;
  status: string;
  meeting_scheduled_at: string;
  meeting_duration_minutes: number;
  meeting_format: string;
  meeting_purpose: string;
  custom_purpose_note: string | null;
  meeting_location: string | null;
  client_since_date: string | null;
  years_with_trustner: number | null;
  last_meeting_date: string | null;
  last_meeting_purpose: string | null;
  relationship_quality_score: number | null;
  relationship_notes: string | null;
  total_aum_inr: number | null;
  total_invested_inr: number | null;
  unrealised_gain_inr: number | null;
  family_xirr_pct: number | null;
  num_holdings: number | null;
  num_active_sips: number | null;
  monthly_sip_flow_inr: number | null;
  action_items: Array<{
    id: number;
    description: string;
    owner: 'Client' | 'RM' | 'Both';
    status: 'Open' | 'In Progress' | 'Blocked' | 'Completed';
    due_date: string | null;
    notes: string | null;
  }>;
  talking_points: Array<{
    id: number;
    order_index: number;
    topic: string;
    key_message: string;
    supporting_data: string | null;
  }>;
  opportunities: Array<{
    id: number;
    title: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    estimated_amount_inr: number | null;
  }>;
  qa: Array<{
    id: number;
    question: string;
    anticipated_answer: string;
    sensitivity: 'Low' | 'Medium' | 'High';
  }>;
}

interface ActionItemForm {
  _key: string;
  description: string;
  owner: 'Client' | 'RM' | 'Both';
  status: 'Open' | 'In Progress' | 'Blocked' | 'Completed';
  dueDate?: string;
  notes?: string;
}
interface TalkingPointForm {
  _key: string;
  orderIndex: number;
  topic: string;
  keyMessage: string;
  supportingData?: string;
}
interface OpportunityForm {
  _key: string;
  title: string;
  description: string;
  priority: 'High' | 'Medium' | 'Low';
  estimatedAmountInr?: number;
}
interface QaForm {
  _key: string;
  question: string;
  anticipatedAnswer: string;
  sensitivity: 'Low' | 'Medium' | 'High';
}

export default function EditMeetingPrepPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(true);

  // Section 1: Relationship snapshot
  const [yearsWithTrustner, setYearsWithTrustner] = useState('');
  const [lastMeetingDate, setLastMeetingDate] = useState('');
  const [relationshipQualityScore, setRelationshipQualityScore] = useState('3');
  const [relationshipNotes, setRelationshipNotes] = useState('');

  // Section 2: Portfolio (editable if auto-pull was empty)
  const [totalAumInr, setTotalAumInr] = useState('');
  const [familyXirrPct, setFamilyXirrPct] = useState('');
  const [numHoldings, setNumHoldings] = useState('');
  const [numActiveSips, setNumActiveSips] = useState('');
  const [monthlySipFlowInr, setMonthlySipFlowInr] = useState('');

  // Section 3: Talking points
  const [talkingPoints, setTalkingPoints] = useState<TalkingPointForm[]>([]);

  // Section 4: Action items / opportunities / Q&A
  const [actionItems, setActionItems] = useState<ActionItemForm[]>([]);
  const [opportunities, setOpportunities] = useState<OpportunityForm[]>([]);
  const [qa, setQa] = useState<QaForm[]>([]);

  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/meeting-prep/${id}`);
      if (res.ok) {
        const data = await res.json();
        const b = data.brief as Brief;
        setBrief(b);
        setYearsWithTrustner(String(b.years_with_trustner ?? ''));
        setLastMeetingDate(b.last_meeting_date ?? '');
        setRelationshipQualityScore(String(b.relationship_quality_score ?? '3'));
        setRelationshipNotes(b.relationship_notes ?? '');
        setTotalAumInr(String(b.total_aum_inr ?? ''));
        setFamilyXirrPct(String(b.family_xirr_pct ?? ''));
        setNumHoldings(String(b.num_holdings ?? ''));
        setNumActiveSips(String(b.num_active_sips ?? ''));
        setMonthlySipFlowInr(String(b.monthly_sip_flow_inr ?? ''));
        setActionItems(
          (b.action_items ?? []).map((i) => ({
            _key: String(i.id),
            description: i.description,
            owner: i.owner,
            status: i.status,
            dueDate: i.due_date ?? undefined,
            notes: i.notes ?? undefined,
          }))
        );
        setTalkingPoints(
          (b.talking_points ?? []).map((p) => ({
            _key: String(p.id),
            orderIndex: p.order_index,
            topic: p.topic,
            keyMessage: p.key_message,
            supportingData: p.supporting_data ?? undefined,
          }))
        );
        setOpportunities(
          (b.opportunities ?? []).map((o) => ({
            _key: String(o.id),
            title: o.title,
            description: o.description,
            priority: o.priority,
            estimatedAmountInr: o.estimated_amount_inr ?? undefined,
          }))
        );
        setQa(
          (b.qa ?? []).map((q) => ({
            _key: String(q.id),
            question: q.question,
            anticipatedAnswer: q.anticipated_answer,
            sensitivity: q.sensitivity,
          }))
        );
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Sub-table editors
  function addActionItem() {
    setActionItems((a) => [
      ...a,
      { _key: `new-${Date.now()}`, description: '', owner: 'RM', status: 'Open' },
    ]);
  }
  function addTalkingPoint() {
    setTalkingPoints((p) => [
      ...p,
      { _key: `new-${Date.now()}`, orderIndex: p.length + 1, topic: '', keyMessage: '' },
    ]);
  }
  function addOpportunity() {
    setOpportunities((o) => [
      ...o,
      { _key: `new-${Date.now()}`, title: '', description: '', priority: 'Medium' },
    ]);
  }
  function addQa() {
    setQa((q) => [
      ...q,
      { _key: `new-${Date.now()}`, question: '', anticipatedAnswer: '', sensitivity: 'Medium' },
    ]);
  }

  async function handleSave(): Promise<boolean> {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/meeting-prep/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yearsWithTrustner: parseFloat(yearsWithTrustner) || null,
          lastMeetingDate: lastMeetingDate || null,
          relationshipQualityScore: parseInt(relationshipQualityScore, 10) || null,
          relationshipNotes: relationshipNotes || null,
          totalAumInr: parseFloat(totalAumInr) || null,
          familyXirrPct: parseFloat(familyXirrPct) || null,
          numHoldings: parseInt(numHoldings, 10) || null,
          numActiveSips: parseInt(numActiveSips, 10) || null,
          monthlySipFlowInr: parseFloat(monthlySipFlowInr) || null,
          actionItems: actionItems.map(({ _key, ...rest }) => rest),
          talkingPoints: talkingPoints.map(({ _key, ...rest }) => rest),
          opportunities: opportunities.map(({ _key, ...rest }) => rest),
          qa: qa.map(({ _key, ...rest }) => rest),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Save failed' });
        return false;
      }
      setMessage({ type: 'success', text: 'Saved' });
      load();
      return true;
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit() {
    if (talkingPoints.length === 0) {
      setMessage({ type: 'error', text: 'Add at least one talking point before submitting.' });
      return;
    }
    setSubmitting(true);
    try {
      const ok = await handleSave();
      if (!ok) {
        setSubmitting(false);
        return;
      }
      const res = await fetch(`/api/admin/meeting-prep/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error ?? 'Submit failed' });
        setSubmitting(false);
        return;
      }
      router.push('/admin/meeting-prep');
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Network error' });
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-96 text-sm text-slate-400 animate-pulse">Loading…</div>;
  }
  if (!brief) {
    return <div className="max-w-3xl mx-auto rounded-lg border border-red-200 bg-red-50 p-6 text-red-800">Brief not found.</div>;
  }

  const readOnly = brief.status !== 'DRAFT' && brief.status !== 'CHANGES_REQUESTED';
  const hoursUntilMeeting = (new Date(brief.meeting_scheduled_at).getTime() - Date.now()) / 3_600_000;
  const meetingLabel = new Date(brief.meeting_scheduled_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <Link href="/admin/meeting-prep" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-slate-500">{brief.document_id}</div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-0.5">{brief.family_name}</h1>
            <p className="text-sm text-slate-500 mt-1">
              {brief.meeting_purpose} · {brief.meeting_format} ·{' '}
              <strong>{meetingLabel}</strong> ({brief.meeting_duration_minutes} min)
            </p>
            {brief.meeting_location && (
              <p className="text-xs text-slate-500 mt-0.5">📍 {brief.meeting_location}</p>
            )}
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
              {brief.status}
            </span>
            <div className={`text-xs mt-1 font-semibold ${hoursUntilMeeting < 24 ? 'text-red-600' : hoursUntilMeeting < 72 ? 'text-amber-600' : 'text-slate-500'}`}>
              {hoursUntilMeeting < 0 ? 'Meeting passed' : `in ${Math.round(hoursUntilMeeting)}h`}
            </div>
          </div>
        </div>
      </div>

      {/* Section 1: Relationship Snapshot */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          1. Relationship Snapshot
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field label="Years with Trustner" value={yearsWithTrustner} onChange={setYearsWithTrustner} disabled={readOnly} step={0.1} type="number" />
          <FieldDate label="Last Meeting" value={lastMeetingDate} onChange={setLastMeetingDate} disabled={readOnly} />
          <Field label="Quality Score (1-5)" value={relationshipQualityScore} onChange={setRelationshipQualityScore} disabled={readOnly} type="number" min={1} max={5} />
        </div>
        <div className="mt-3">
          <label className="block text-xs font-medium text-slate-600 mb-1">Relationship Notes</label>
          <textarea
            value={relationshipNotes}
            onChange={(e) => setRelationshipNotes(e.target.value)}
            disabled={readOnly}
            rows={2}
            placeholder="Key relationship context — family dynamics, decision makers, sensitivities…"
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm disabled:bg-slate-50 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Section 2: Portfolio Snapshot */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            2. Portfolio Snapshot
          </h2>
          <span className="text-xs text-slate-500">Auto-filled from latest diagnostic · editable</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Field label="Total AUM (₹)" value={totalAumInr} onChange={setTotalAumInr} disabled={readOnly} type="number" />
          <Field label="Family XIRR %" value={familyXirrPct} onChange={setFamilyXirrPct} disabled={readOnly} type="number" step={0.1} />
          <Field label="# Holdings" value={numHoldings} onChange={setNumHoldings} disabled={readOnly} type="number" />
          <Field label="# Active SIPs" value={numActiveSips} onChange={setNumActiveSips} disabled={readOnly} type="number" />
          <Field label="Monthly SIP (₹)" value={monthlySipFlowInr} onChange={setMonthlySipFlowInr} disabled={readOnly} type="number" />
        </div>
      </div>

      {/* Section 3: Talking Points */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            3. Talking Points ({talkingPoints.length})
          </h2>
          {!readOnly && (
            <button type="button" onClick={addTalkingPoint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">
              <Plus className="w-3.5 h-3.5" />
              Add Point
            </button>
          )}
        </div>
        {talkingPoints.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No talking points yet. Add at least one before submitting.</p>
        ) : (
          <div className="space-y-3">
            {talkingPoints.map((p, idx) => (
              <div key={p._key} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-slate-500 mt-2 w-6 flex-shrink-0">{idx + 1}.</span>
                  <input
                    type="text"
                    value={p.topic}
                    onChange={(e) => setTalkingPoints((s) => s.map((x) => x._key === p._key ? { ...x, topic: e.target.value } : x))}
                    disabled={readOnly}
                    placeholder="Topic (e.g. Mid-cap allocation drift)"
                    className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm font-semibold disabled:bg-slate-100"
                  />
                  {!readOnly && (
                    <button type="button" onClick={() => setTalkingPoints((s) => s.filter((x) => x._key !== p._key))} className="text-slate-400 hover:text-red-600 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={p.keyMessage}
                  onChange={(e) => setTalkingPoints((s) => s.map((x) => x._key === p._key ? { ...x, keyMessage: e.target.value } : x))}
                  disabled={readOnly}
                  rows={2}
                  placeholder="Key message you want to deliver…"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                />
                <input
                  type="text"
                  value={p.supportingData ?? ''}
                  onChange={(e) => setTalkingPoints((s) => s.map((x) => x._key === p._key ? { ...x, supportingData: e.target.value } : x))}
                  disabled={readOnly}
                  placeholder="Supporting data / numbers (optional)"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-xs text-slate-600 disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 4: Action Items */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            4. Open Action Items ({actionItems.length})
          </h2>
          {!readOnly && (
            <button type="button" onClick={addActionItem} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">
              <Plus className="w-3.5 h-3.5" />
              Add Item
            </button>
          )}
        </div>
        {actionItems.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No open action items.</p>
        ) : (
          <div className="space-y-2">
            {actionItems.map((i) => (
              <div key={i._key} className="rounded-lg border border-slate-200 p-2 bg-slate-50/50">
                <div className="grid grid-cols-12 gap-2 items-center">
                  <input
                    type="text"
                    value={i.description}
                    onChange={(e) => setActionItems((s) => s.map((x) => x._key === i._key ? { ...x, description: e.target.value } : x))}
                    disabled={readOnly}
                    placeholder="Action…"
                    className="col-span-6 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                  />
                  <select value={i.owner} onChange={(e) => setActionItems((s) => s.map((x) => x._key === i._key ? { ...x, owner: e.target.value as 'Client' | 'RM' | 'Both' } : x))} disabled={readOnly} className="col-span-2 px-2 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                    <option>RM</option><option>Client</option><option>Both</option>
                  </select>
                  <select value={i.status} onChange={(e) => setActionItems((s) => s.map((x) => x._key === i._key ? { ...x, status: e.target.value as 'Open' | 'In Progress' | 'Blocked' | 'Completed' } : x))} disabled={readOnly} className="col-span-2 px-2 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                    <option>Open</option><option>In Progress</option><option>Blocked</option><option>Completed</option>
                  </select>
                  <input
                    type="date"
                    value={i.dueDate ?? ''}
                    onChange={(e) => setActionItems((s) => s.map((x) => x._key === i._key ? { ...x, dueDate: e.target.value || undefined } : x))}
                    disabled={readOnly}
                    className="col-span-1 px-2 py-1.5 rounded-md border border-slate-300 text-xs disabled:bg-slate-100"
                  />
                  {!readOnly && (
                    <button type="button" onClick={() => setActionItems((s) => s.filter((x) => x._key !== i._key))} className="col-span-1 text-slate-400 hover:text-red-600 p-1 justify-self-end">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 5: Opportunities */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            5. Opportunities ({opportunities.length})
          </h2>
          {!readOnly && (
            <button type="button" onClick={addOpportunity} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">
              <Plus className="w-3.5 h-3.5" />
              Add Opportunity
            </button>
          )}
        </div>
        {opportunities.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No opportunities identified yet.</p>
        ) : (
          <div className="space-y-2">
            {opportunities.map((o) => (
              <div key={o._key} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                <div className="grid grid-cols-12 gap-2 items-start">
                  <input
                    type="text"
                    value={o.title}
                    onChange={(e) => setOpportunities((s) => s.map((x) => x._key === o._key ? { ...x, title: e.target.value } : x))}
                    disabled={readOnly}
                    placeholder="Title (e.g. NPS top-up for tax saving)"
                    className="col-span-7 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm font-semibold disabled:bg-slate-100"
                  />
                  <select value={o.priority} onChange={(e) => setOpportunities((s) => s.map((x) => x._key === o._key ? { ...x, priority: e.target.value as 'High' | 'Medium' | 'Low' } : x))} disabled={readOnly} className="col-span-2 px-2 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100">
                    <option>High</option><option>Medium</option><option>Low</option>
                  </select>
                  <input
                    type="number"
                    value={o.estimatedAmountInr ?? ''}
                    onChange={(e) => setOpportunities((s) => s.map((x) => x._key === o._key ? { ...x, estimatedAmountInr: parseFloat(e.target.value) || undefined } : x))}
                    disabled={readOnly}
                    placeholder="₹ estimate"
                    className="col-span-2 px-2 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                  />
                  {!readOnly && (
                    <button type="button" onClick={() => setOpportunities((s) => s.filter((x) => x._key !== o._key))} className="col-span-1 text-slate-400 hover:text-red-600 p-1 justify-self-end">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <textarea
                  value={o.description}
                  onChange={(e) => setOpportunities((s) => s.map((x) => x._key === o._key ? { ...x, description: e.target.value } : x))}
                  disabled={readOnly}
                  rows={2}
                  placeholder="Why this matters for the client…"
                  className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section 6: Anticipated Q&A */}
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            6. Anticipated Q&amp;A ({qa.length})
          </h2>
          {!readOnly && (
            <button type="button" onClick={addQa} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-semibold hover:bg-brand-100">
              <Plus className="w-3.5 h-3.5" />
              Add Q&amp;A
            </button>
          )}
        </div>
        {qa.length === 0 ? (
          <p className="text-sm text-slate-500 italic">No anticipated questions yet.</p>
        ) : (
          <div className="space-y-2">
            {qa.map((q) => (
              <div key={q._key} className="rounded-lg border border-slate-200 p-3 bg-slate-50/50 space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-blue-700 mt-2 w-4 flex-shrink-0">Q:</span>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => setQa((s) => s.map((x) => x._key === q._key ? { ...x, question: e.target.value } : x))}
                    disabled={readOnly}
                    placeholder="Anticipated client question…"
                    className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm font-semibold disabled:bg-slate-100"
                  />
                  <select value={q.sensitivity} onChange={(e) => setQa((s) => s.map((x) => x._key === q._key ? { ...x, sensitivity: e.target.value as 'Low' | 'Medium' | 'High' } : x))} disabled={readOnly} className="px-2 py-1.5 rounded-md border border-slate-300 text-xs disabled:bg-slate-100">
                    <option>Low</option><option>Medium</option><option>High</option>
                  </select>
                  {!readOnly && (
                    <button type="button" onClick={() => setQa((s) => s.filter((x) => x._key !== q._key))} className="text-slate-400 hover:text-red-600 p-1.5">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-xs font-bold text-emerald-700 mt-2 w-4 flex-shrink-0">A:</span>
                  <textarea
                    value={q.anticipatedAnswer}
                    onChange={(e) => setQa((s) => s.map((x) => x._key === q._key ? { ...x, anticipatedAnswer: e.target.value } : x))}
                    disabled={readOnly}
                    rows={2}
                    placeholder="Your prepared answer…"
                    className="flex-1 px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {message && (
        <div
          className={`rounded-lg border p-3 flex items-start gap-2 ${
            message.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {!readOnly && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 sticky bottom-4">
          <p className="text-xs text-slate-500">
            At least 1 talking point required to submit.
          </p>
          <div className="flex items-center gap-2">
            <button type="button" onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting || talkingPoints.length === 0} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:bg-slate-300">
              <Send className="w-4 h-4" />
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, value, onChange, disabled, step, type, min, max,
}: {
  label: string; value: string; onChange: (v: string) => void;
  disabled?: boolean; step?: number; type?: string; min?: number; max?: number;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type={type ?? 'text'}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
      />
    </div>
  );
}

function FieldDate({
  label, value, onChange, disabled,
}: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-2.5 py-1.5 rounded-md border border-slate-300 text-sm disabled:bg-slate-100"
      />
    </div>
  );
}
