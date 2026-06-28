'use client';

import { useEffect, useState, use as usePromise } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, FileDown, Printer, Trash2, Package } from 'lucide-react';
import { letterName } from '@/lib/hr/letter-catalog';

interface Letter {
  id: number;
  employee_id: number | null;
  letter_type: string;
  entity: 'TAS' | 'TIB';
  recipient_name: string | null;
  serial_number: string | null;
  status: string;
  generated_html: string | null;
  generated_by: string;
  generated_at: string;
}

export default function LetterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const [letter, setLetter] = useState<Letter | null>(null);
  const [css, setCss] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch(`/api/employee/hr/letters/${id}`)
      .then((r) => r.json())
      .then((j) => { if (j.error) setError(j.error); else { setLetter(j.letter); setCss(j.css || ''); } })
      .catch(() => setError('Failed to load letter'));
  }, [id]);

  const printLetter = () => {
    if (!letter?.generated_html) return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${letter.recipient_name || 'Letter'}</title><style>${css}\n@page{margin:25mm;size:A4}body{margin:0;padding:0}</style></head><body>${letter.generated_html}<script>window.onload=()=>{window.print();setTimeout(()=>window.close(),300);}</script></body></html>`);
    w.document.close();
  };

  const remove = async () => {
    if (!confirm('Delete this letter from the archive? It can be regenerated from the employee record.')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/employee/hr/letters/${id}`, { method: 'DELETE' });
      if (res.ok) router.push('/employee/hr/letters');
      else { const j = await res.json().catch(() => ({})); alert(`Delete failed: ${j.error || res.status}`); }
    } finally { setDeleting(false); }
  };

  if (error) {
    return (
      <div className="p-8 max-w-3xl">
        <Link href="/employee/hr/letters" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back to letters</Link>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-5 text-sm text-rose-800">{error}</div>
      </div>
    );
  }
  if (!letter) return <div className="p-8"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>;

  return (
    <div className="p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link href="/employee/hr/letters" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back</Link>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">{letterName(letter.letter_type)}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {letter.recipient_name || '—'} · {letter.entity}{letter.serial_number ? ` · ${letter.serial_number}` : ''} · {new Date(letter.generated_at).toLocaleDateString('en-IN')}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <a href={`/api/employee/hr/letters/${letter.id}/doc`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800">
            <FileDown className="w-3.5 h-3.5" /> Word
          </a>
          {letter.employee_id && (
            <a href={`/api/employee/hr/letters/zip?employee_id=${letter.employee_id}`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50">
              <Package className="w-3.5 h-3.5" /> All as ZIP
            </a>
          )}
          <button onClick={printLetter} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700">
            <Printer className="w-3.5 h-3.5" /> Print / PDF
          </button>
          <button onClick={remove} disabled={deleting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-50 disabled:opacity-50">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-10 overflow-x-auto">
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div dangerouslySetInnerHTML={{ __html: letter.generated_html || '' }} />
      </div>
    </div>
  );
}
