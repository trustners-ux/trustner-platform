'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Loader2, Printer, Search, UserCheck, FileStack, FileDown } from 'lucide-react';
import { HR_FORM_GROUPS, recomputeComp } from '@/lib/hr/letter-fields';
import { LETTER_CATALOG } from '@/lib/hr/letter-catalog';

// Pull letter options from the client-safe catalogue (NOT letter-templates, which
// bundles the server-only signature images). Keep ids in sync there.
const ALL_LETTER_OPTIONS = LETTER_CATALOG.map((t) => ({
  id: t.id,
  label: t.name,
  category: t.category,
  entityScoped: t.entityScoped,
}));

export default function NewLetterPage() {
  const router = useRouter();
  const [templateId, setTemplateId] = useState<string>('offer');
  const [data, setData] = useState<Record<string, unknown>>({
    entity: 'TIB',
    date: new Date().toISOString().slice(0, 10),
    probation_months: '6',
  });
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewCss, setPreviewCss] = useState('');
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);

  // Auto-fill from an existing employee record
  type EmpHit = { id: number; full_name: string; entity: string; designation: string | null; employee_code: string };
  const [empQuery, setEmpQuery] = useState('');
  const [empResults, setEmpResults] = useState<EmpHit[]>([]);
  const [empOpen, setEmpOpen] = useState(false);
  const [selectedEmpId, setSelectedEmpId] = useState<number | null>(null);
  const [packing, setPacking] = useState(false);

  const enriched = useMemo(() => recomputeComp(data), [data]);

  // Debounced employee search for the auto-fill picker
  useEffect(() => {
    if (!empQuery.trim() || selectedEmpId) { setEmpResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/employee/hr/letters/prefill?q=${encodeURIComponent(empQuery)}`)
        .then((r) => r.json())
        .then((j) => setEmpResults(j.results || []))
        .catch(() => setEmpResults([]));
    }, 250);
    return () => clearTimeout(t);
  }, [empQuery, selectedEmpId]);

  const pickEmployee = async (hit: EmpHit) => {
    setEmpOpen(false);
    setEmpQuery(hit.full_name);
    setSelectedEmpId(hit.id);
    const r = await fetch(`/api/employee/hr/letters/prefill?employee_id=${hit.id}`);
    const j = await r.json();
    if (j.data) setData((prev) => ({ ...prev, ...j.data }));
  };

  const generatePack = async () => {
    if (!selectedEmpId) { alert('Search and pick an employee first to generate the joining pack.'); return; }
    if (!confirm(`Generate the full ${String(data.entity || 'TIB')} joining-letter pack for this employee? Each letter is saved as a draft you can review and download.`)) return;
    setPacking(true);
    try {
      const r = await fetch('/api/employee/hr/letters/pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_id: selectedEmpId, entity: data.entity || 'TIB' }),
      });
      const j = await r.json();
      if (!r.ok) { alert(`Pack failed: ${j.error || r.status}`); return; }
      router.push('/employee/hr/letters');
    } finally {
      setPacking(false);
    }
  };

  const downloadWord = () => {
    if (!previewHtml) return;
    const docHtml = `<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"><style>@page{size:A4;margin:18mm 16mm}body{font-family:Calibri,Arial,sans-serif}${previewCss}</style></head><body>${previewHtml}</body></html>`;
    const blob = new Blob(['﻿' + docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const name = String(data.candidate_name || 'letter').replace(/[^a-zA-Z0-9._-]+/g, '_');
    a.href = url;
    a.download = `${name}_${templateId}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Live preview — re-render on data change (debounced)
  useEffect(() => {
    const t = setTimeout(() => {
      setRendering(true);
      fetch('/api/employee/hr/letters/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_id: templateId, data: enriched }),
      })
        .then((r) => r.json())
        .then((j) => {
          if (j.html) {
            setPreviewHtml(j.html);
            setPreviewCss(j.css || '');
          }
        })
        .finally(() => setRendering(false));
    }, 250);
    return () => clearTimeout(t);
  }, [templateId, enriched]);

  const updateField = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (status: 'draft' | 'sent') => {
    setSaving(true);
    try {
      const res = await fetch('/api/employee/hr/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: templateId,
          entity: data.entity || 'TIB',
          recipient_name: data.candidate_name || '',
          data: enriched,
          status,
          serial_number: data.serial || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Save failed: ${err.error || res.status}`);
        return;
      }
      router.push('/employee/hr/letters');
    } catch (e) {
      alert(`Save failed: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>Letter</title><style>${previewCss}\n@page{margin:25mm;size:A4}body{margin:0;padding:0}</style></head><body>${previewHtml}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script></body></html>`);
    w.document.close();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] min-h-screen">
      {/* Form pane */}
      <div className="border-r border-slate-200 bg-white p-6 overflow-y-auto max-h-screen">
        <div className="flex items-center justify-between mb-4">
          <Link href="/employee/hr/letters" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
            {rendering ? 'Rendering…' : 'Live preview'}
          </span>
        </div>

        <h1 className="text-xl font-extrabold text-slate-900 mb-3">Generate Letter</h1>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Letter Template</label>
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none bg-white"
          >
            {/* Group options by category so they're easier to find. Filter by
                the selected entity (TAS vs TIB) so TIB-specific letters like
                "IRDAI Acknowledgement" don't appear under TAS. */}
            {Object.entries(
              ALL_LETTER_OPTIONS
                .filter((o) => (o.entityScoped as readonly string[]).includes(String(data.entity || 'TIB')))
                .reduce<Record<string, typeof ALL_LETTER_OPTIONS>>((acc, o) => {
                  (acc[o.category] = acc[o.category] || []).push(o);
                  return acc;
                }, {})
            ).map(([cat, opts]) => (
              <optgroup key={cat} label={cat}>
                {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </optgroup>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 mt-1">
            {ALL_LETTER_OPTIONS.filter((o) => (o.entityScoped as readonly string[]).includes(String(data.entity || 'TIB'))).length} templates available for {String(data.entity || 'TIB')}
          </div>
        </div>

        {/* Auto-fill from an existing employee + one-click joining pack */}
        <div className="mb-5 relative rounded-lg border border-amber-200 bg-amber-50/60 p-3">
          <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Auto-fill from Employee</label>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              value={empQuery}
              onChange={(e) => { setEmpQuery(e.target.value); setEmpOpen(true); setSelectedEmpId(null); }}
              onFocus={() => setEmpOpen(true)}
              placeholder="Search name or employee code…"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-brand outline-none bg-white"
            />
            {empOpen && empResults.length > 0 && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {empResults.map((e) => (
                  <button key={e.id} type="button" onClick={() => pickEmployee(e)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0">
                    <div className="text-sm font-semibold text-slate-900">{e.full_name}</div>
                    <div className="text-[11px] text-slate-500">{e.employee_code} · {e.entity} · {e.designation || '—'}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {selectedEmpId && (
            <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-700 font-semibold">
              <UserCheck className="w-3.5 h-3.5" /> Filled from employee record — edit any field below before saving.
            </div>
          )}
          <button type="button" onClick={generatePack} disabled={!selectedEmpId || packing}
            className="mt-3 w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 disabled:opacity-50">
            {packing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileStack className="w-4 h-4" />}
            Generate full {String(data.entity || 'TIB')} joining pack
          </button>
          <div className="text-[10px] text-slate-400 mt-1.5">Saves every joining letter for this entity as a draft you can review &amp; download.</div>
        </div>

        {HR_FORM_GROUPS.map((grp) => (
          <div key={grp.group} className="mb-5">
            <div className="text-[11px] font-bold text-brand uppercase tracking-wider border-l-2 border-amber-400 pl-2 mb-2">
              {grp.group}
            </div>
            <div className="space-y-2.5">
              {grp.fields.map((f) => {
                const value =
                  f.type === 'ro' ? String((enriched[f.key] as number) || '') : String((data[f.key] as string) || '');
                if (f.type === 'select') {
                  return (
                    <div key={f.key}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">{f.label}</label>
                      <select
                        value={value}
                        onChange={(e) => updateField(f.key, e.target.value)}
                        className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm focus:border-brand outline-none bg-white"
                      >
                        <option value="">—</option>
                        {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  );
                }
                if (f.type === 'ro') {
                  return (
                    <div key={f.key}>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">{f.label}</label>
                      <input
                        type="text"
                        readOnly
                        value={value ? `₹ ${Number(value).toLocaleString('en-IN')}` : ''}
                        className="w-full px-3 py-1.5 rounded border border-slate-200 bg-slate-50 text-sm text-emerald-700 font-semibold"
                      />
                    </div>
                  );
                }
                return (
                  <div key={f.key}>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">
                      {f.label}{f.required && <span className="text-rose-600"> *</span>}
                    </label>
                    <input
                      type={f.type === 'num' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={value}
                      onChange={(e) => updateField(f.key, e.target.value)}
                      className="w-full px-3 py-1.5 rounded border border-slate-300 text-sm focus:border-brand outline-none"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="sticky bottom-0 bg-white border-t border-slate-200 pt-3 mt-6 flex gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            onClick={() => handleSave('sent')}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-brand text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            Save &amp; Mark Sent
          </button>
        </div>
      </div>

      {/* Preview pane */}
      <div className="bg-slate-100 overflow-y-auto max-h-screen p-6">
        <div className="flex justify-between items-center mb-4 max-w-3xl mx-auto">
          <h2 className="text-sm font-bold text-slate-700">Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={downloadWord}
              disabled={!previewHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50"
            >
              <FileDown className="w-3.5 h-3.5" /> Download Word
            </button>
            <button
              onClick={handlePrint}
              disabled={!previewHtml}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          </div>
        </div>
        <div className="bg-white shadow-md max-w-3xl mx-auto p-10 min-h-[80vh]">
          <style dangerouslySetInnerHTML={{ __html: previewCss }} />
          <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
        </div>
      </div>
    </div>
  );
}
