'use client';

import { useState } from 'react';
import { Download, Loader2, FileDown } from 'lucide-react';
import { generateCalculatorPDF } from '@/lib/utils/pdf-generator';

interface DownloadPDFButtonProps {
  elementId: string;
  title: string;
  fileName: string;
}

export default function DownloadPDFButton({ elementId, title, fileName }: DownloadPDFButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      await generateCalculatorPDF({ elementId, title, fileName });
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('PDF generation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold rounded-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed"
      style={{
        background: loading ? '#6B7280' : 'linear-gradient(135deg, #E8553A, #C4381A)',
        color: '#ffffff',
        boxShadow: '0 4px 14px rgba(232, 85, 58, 0.35)',
      }}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          Generating PDF...
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          Download PDF
        </>
      )}
    </button>
  );
}
