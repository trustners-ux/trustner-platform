'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Download, Loader2, Award } from 'lucide-react';

interface Letter {
  id: number;
  letter_type: string;
  entity: string;
  serial_number: string | null;
  status: string;
  generated_at: string;
}
interface Doc {
  id: number;
  category: string;
  filename: string;
  blob_url: string;
  status: string;
  created_at: string;
}

export default function MyDocumentsPage() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/employee/hr/me')
      .then((r) => r.json())
      .then((j) => {
        setLetters(j.my_letters || []);
        setDocs(j.my_documents || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employee/hr/me" className="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
      </div>

      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
          <FileText className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">My Documents</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Loading…' : `${letters.length} letter(s) + ${docs.length} document(s)`}
          </p>
        </div>
      </div>

      {/* Letters */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-6">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-600" />
          Letters from HR ({letters.length})
        </div>
        {letters.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No letters issued to you yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Type</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Entity</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Serial</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Issued</th>
              </tr>
            </thead>
            <tbody>
              {letters.map((l, i) => (
                <tr key={l.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5 capitalize font-semibold text-slate-900">{l.letter_type.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${l.entity === 'TAS' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'}`}>{l.entity}</span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{l.serial_number || '—'}</td>
                  <td className="px-4 py-2.5 text-xs uppercase font-bold text-slate-600">{l.status}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 font-mono">{new Date(l.generated_at).toLocaleDateString('en-IN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* HR uploaded docs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 text-sm font-bold text-slate-700 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          Uploaded Documents ({docs.length})
        </div>
        {docs.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-500">
            No documents on file. HR will upload your onboarding records here.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Category</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Filename</th>
                <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">Status</th>
                <th className="px-4 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">Open</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((d, i) => (
                <tr key={d.id} className={`border-b border-slate-100 ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                  <td className="px-4 py-2.5 text-xs uppercase font-bold text-slate-700">{d.category.replace(/_/g, ' ')}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-700">{d.filename}</td>
                  <td className="px-4 py-2.5 text-xs uppercase font-bold text-slate-600">{d.status}</td>
                  <td className="px-4 py-2.5 text-right">
                    <a href={d.blob_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 text-xs text-brand font-bold hover:underline">
                      <Download className="w-3 h-3" /> View
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {loading && <div className="mt-4 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /></div>}
    </div>
  );
}
