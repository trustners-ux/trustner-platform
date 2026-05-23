'use client';

import DownloadPDFButton from '@/components/ui/DownloadPDFButton';

interface MFDBrandBarProps {
  subBrokerName: string;
  onSubBrokerNameChange: (v: string) => void;
  firmName: string;
  onFirmNameChange: (v: string) => void;
  arn: string;
  onArnChange: (v: string) => void;
  pdfElementId: string;
  pdfTitle: string;
  pdfFileName: string;
  reportLabel: string;
}

/**
 * Personalisation + download bar for MFD calculators.
 *
 * Renders three fields (Sub-Broker Name / Firm Name / ARN) and a DownloadPDFButton.
 * The bar itself is marked `data-pdf-hide` so it doesn't appear inside the exported PDF —
 * instead, use <MFDBrandHeader> (below) inside the PDF-captured container to show the
 * sub-broker branding on the printed report.
 */
export function MFDBrandBar({
  subBrokerName,
  onSubBrokerNameChange,
  firmName,
  onFirmNameChange,
  arn,
  onArnChange,
  pdfElementId,
  pdfTitle,
  pdfFileName,
}: MFDBrandBarProps) {
  return (
    <section
      className="py-5 bg-amber-50/40 border-b border-amber-200/50"
      data-pdf-hide
    >
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          <div className="flex-1 grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Sub-Broker / MFD Name
              </label>
              <input
                type="text"
                value={subBrokerName}
                onChange={(e) => onSubBrokerNameChange(e.target.value)}
                placeholder="e.g., Rajesh Kumar"
                className="w-full py-2.5 px-3 text-sm font-semibold text-primary-700 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                Firm Name <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={firmName}
                onChange={(e) => onFirmNameChange(e.target.value)}
                placeholder="e.g., Kumar Financial Services"
                className="w-full py-2.5 px-3 text-sm font-semibold text-primary-700 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wider">
                ARN <span className="text-slate-400 font-normal normal-case">(optional)</span>
              </label>
              <input
                type="text"
                value={arn}
                onChange={(e) => onArnChange(e.target.value)}
                placeholder="e.g., ARN-123456"
                className="w-full py-2.5 px-3 text-sm font-semibold text-primary-700 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-300 focus:border-amber-400 transition-all"
              />
            </div>
          </div>
          <div className="lg:shrink-0">
            <DownloadPDFButton elementId={pdfElementId} title={pdfTitle} fileName={pdfFileName} />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Branded header shown inside the results container so that the exported PDF carries
 * the sub-broker's name + firm + ARN + report label + date.
 * Renders nothing if all branding fields are empty.
 */
export function MFDBrandHeader({
  subBrokerName,
  firmName,
  arn,
  reportLabel,
}: {
  subBrokerName: string;
  firmName: string;
  arn: string;
  reportLabel: string;
}) {
  if (!subBrokerName && !firmName && !arn) return null;
  const today = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  return (
    <div className="mb-6 p-4 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {subBrokerName && (
          <span className="text-lg font-bold text-primary-700">{subBrokerName}</span>
        )}
        {firmName && <span className="text-sm text-slate-600">· {firmName}</span>}
        {arn && (
          <span className="text-xs font-mono text-amber-700 bg-white px-2 py-0.5 rounded border border-amber-200">
            {arn}
          </span>
        )}
        <span className="text-xs text-slate-500 ml-auto">
          {reportLabel} · {today}
        </span>
      </div>
    </div>
  );
}
