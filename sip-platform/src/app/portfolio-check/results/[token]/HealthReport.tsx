'use client';

import { useState } from 'react';
import { ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2, ArrowRight, ChevronDown, ChevronUp, MessageCircle, Filter, Share2, Check } from 'lucide-react';

interface Verdict {
  code: string;
  label: string;
  color: string;
  description: string;
}

interface Holding {
  id: number;
  fundName: string;
  category: string | null;
  entityName: string;
  investedInr: number;
  currentValueInr: number;
  gainInr: number;
  gainPct: number;
  verdict: Verdict;
  action: string | null;
  qualityVerdict: string | null;
  suitability: string | null;
  riskTier: string | null;
  suggestion: string | null;
}

interface Sip {
  id: number;
  fundName: string;
  monthlyAmountInr: number;
  frequency: string;
  status: string;
  entityName: string;
  fundVerdict: string | null;
  action: string | null;
}

interface Review {
  id: number;
  documentId: string;
  familyName: string;
  status: string;
  createdAt: string;
  leadName: string;
  summary: {
    numHoldings: number;
    numActiveSips: number;
    numFunds: number;
    numAmcs: number;
    totalInvestedInr: number;
    currentValueInr: number;
    gainInr: number;
    gainPct: number;
    monthlySipFlowInr: number;
    verdicts: { star: number; keep: number; watch: number; swap: number; liquidate: number };
    duplicateFunds: number;
    estimatedTaxInr: number;
  };
  holdings: Holding[];
  sips: Sip[];
}

function inr(n: number): string {
  if (Math.abs(n) >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (Math.abs(n) >= 1e5) return `₹${(n / 1e5).toFixed(1)} L`;
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

const VERDICT_ORDER: Record<string, number> = { LIQUIDATE: 0, SWAP: 1, WATCH: 2, KEEP: 3, STAR: 4 };

type SortKey = 'priority' | 'value' | 'gain';

export default function HealthReport({ review }: { review: Review }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>('priority');
  const [filterVerdict, setFilterVerdict] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function copyLink() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  const s = review.summary;
  const v = s.verdicts;
  const totalVerdicts = v.star + v.keep + v.watch + v.swap + v.liquidate;
  const healthScore = totalVerdicts > 0
    ? Math.round(((v.star * 100 + v.keep * 80 + v.watch * 50 + v.swap * 20 + v.liquidate * 0) / totalVerdicts))
    : 50;

  const scoreColor = healthScore >= 75 ? '#059669' : healthScore >= 50 ? '#D97706' : '#DC2626';
  const scoreLabel = healthScore >= 75 ? 'Healthy' : healthScore >= 50 ? 'Needs Attention' : 'Action Required';

  const sorted = [...review.holdings]
    .filter((h) => !filterVerdict || h.verdict.code === filterVerdict)
    .sort((a, b) => {
      if (sortBy === 'priority') return (VERDICT_ORDER[a.verdict.code] ?? 2) - (VERDICT_ORDER[b.verdict.code] ?? 2);
      if (sortBy === 'value') return Number(b.currentValueInr) - Number(a.currentValueInr);
      return Number(b.gainPct) - Number(a.gainPct);
    });

  const wa = `https://wa.me/916003903737?text=${encodeURIComponent(`Hi Trustner team, I just ran the Free Portfolio Health Check on MeraSIP. My report ID is ${review.documentId}. I'd like to discuss my results and get specific recommendations.`)}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#0A1628] via-[#1E3A5F] to-[#0D4F6B] text-white py-10 sm:py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs text-slate-300 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" /> AMFI-registered distributor · ARN-286886 · Powered by Trustner PD Engine v2
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight mb-1">
                Portfolio Health Report
              </h1>
              <p className="text-sm text-slate-300">
                {review.leadName || review.familyName} · {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <button
              onClick={copyLink}
              className="flex-shrink-0 mt-1 inline-flex items-center gap-1.5 bg-white/10 border border-white/25 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-white/20 transition-colors"
            >
              {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Share2 className="w-3.5 h-3.5" /> Share</>}
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-6 pb-16 space-y-5">
        {/* Health Score + Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Health Score Ring */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5 flex flex-col items-center justify-center">
            <svg viewBox="0 0 120 120" className="w-28 h-28 mb-2">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E2E8F0" strokeWidth="10" />
              <circle
                cx="60" cy="60" r="50" fill="none"
                stroke={scoreColor} strokeWidth="10"
                strokeDasharray={`${healthScore * 3.14} ${314 - healthScore * 3.14}`}
                strokeLinecap="round"
                transform="rotate(-90 60 60)"
              />
              <text x="60" y="55" textAnchor="middle" className="text-2xl font-extrabold" fill={scoreColor} fontSize="28" fontWeight="800">{healthScore}</text>
              <text x="60" y="72" textAnchor="middle" fill="#64748B" fontSize="10" fontWeight="600">/100</text>
            </svg>
            <div className="text-sm font-extrabold" style={{ color: scoreColor }}>{scoreLabel}</div>
            <div className="text-[10px] text-slate-400 mt-1">Portfolio Health Score</div>
          </div>

          {/* Portfolio Value */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Portfolio Snapshot</div>
            <div className="space-y-2.5">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Current value</span>
                <span className="text-lg font-extrabold text-slate-800">{inr(s.currentValueInr)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Invested</span>
                <span className="text-sm font-bold text-slate-600">{inr(s.totalInvestedInr)}</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Gain</span>
                <span className={`text-sm font-extrabold ${s.gainInr >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {s.gainInr >= 0 ? '+' : ''}{inr(s.gainInr)} ({s.gainPct > 0 ? '+' : ''}{s.gainPct}%)
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 flex justify-between items-baseline">
                <span className="text-xs text-slate-500">Holdings</span>
                <span className="text-sm font-bold text-slate-600">{s.numHoldings} across {s.numAmcs} AMCs</span>
              </div>
            </div>
          </div>

          {/* Verdict Summary */}
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-5">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Verdict Breakdown</div>
            <div className="space-y-1.5">
              {[
                { key: 'star', label: 'Excellent', color: '#059669', count: v.star },
                { key: 'keep', label: 'Good', color: '#0D9488', count: v.keep },
                { key: 'watch', label: 'Monitor', color: '#D97706', count: v.watch },
                { key: 'swap', label: 'Needs Change', color: '#EA580C', count: v.swap },
                { key: 'liquidate', label: 'Exit', color: '#DC2626', count: v.liquidate },
              ].map((vd) => (
                <button
                  key={vd.key}
                  onClick={() => setFilterVerdict(filterVerdict === vd.key.toUpperCase() ? null : vd.key.toUpperCase())}
                  className={`w-full flex items-center gap-2 text-left rounded-lg px-2 py-1.5 transition-colors ${filterVerdict === vd.key.toUpperCase() ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: vd.color }} />
                  <span className="flex-1 text-xs font-semibold text-slate-600">{vd.label}</span>
                  <span className="text-sm font-extrabold" style={{ color: vd.color }}>{vd.count}</span>
                  <div className="flex-1 max-w-[60px] h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full" style={{ background: vd.color, width: `${totalVerdicts > 0 ? (vd.count / totalVerdicts) * 100 : 0}%` }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Insight Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {s.duplicateFunds > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 mb-1" />
              <div className="text-lg font-extrabold text-amber-800">{s.duplicateFunds}</div>
              <div className="text-[10px] font-bold text-amber-600 uppercase">Duplicate groups</div>
              <div className="text-[10px] text-amber-700 mt-1">Multiple funds doing the same job</div>
            </div>
          )}
          {s.estimatedTaxInr > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
              <TrendingUp className="w-4 h-4 text-blue-600 mb-1" />
              <div className="text-lg font-extrabold text-blue-800">{inr(s.estimatedTaxInr)}</div>
              <div className="text-[10px] font-bold text-blue-600 uppercase">Est. tax on exits</div>
              <div className="text-[10px] text-blue-700 mt-1">Tax-efficient sequencing matters</div>
            </div>
          )}
          {s.numActiveSips > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mb-1" />
              <div className="text-lg font-extrabold text-emerald-800">{s.numActiveSips}</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Active SIPs</div>
              <div className="text-[10px] text-emerald-700 mt-1">{inr(s.monthlySipFlowInr)}/mo</div>
            </div>
          )}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-lg font-extrabold text-slate-800">{s.numFunds}</div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Unique funds</div>
            <div className="text-[10px] text-slate-500 mt-1">across {s.numAmcs} AMCs</div>
          </div>
        </div>

        {/* Fund-by-Fund Cards */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
              Fund-by-Fund Analysis
              {filterVerdict && (
                <button onClick={() => setFilterVerdict(null)} className="ml-2 text-[10px] font-semibold text-teal-600 normal-case bg-teal-50 px-2 py-0.5 rounded-full">
                  <Filter className="w-3 h-3 inline mr-0.5" /> Clear filter
                </button>
              )}
            </h2>
            <div className="flex gap-1">
              {(['priority', 'value', 'gain'] as SortKey[]).map((sk) => (
                <button
                  key={sk}
                  onClick={() => setSortBy(sk)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${sortBy === sk ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {sk === 'priority' ? 'Priority' : sk === 'value' ? 'Value' : 'Gain'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {sorted.map((h) => {
              const isExpanded = expandedId === h.id;
              return (
                <div key={h.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow transition-shadow">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : h.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3"
                  >
                    <span
                      className="flex-shrink-0 mt-0.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold text-white"
                      style={{ background: h.verdict.color }}
                    >
                      {h.verdict.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{h.fundName}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{h.category || 'Equity'} · {h.entityName}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs font-extrabold text-slate-800">{inr(Number(h.currentValueInr))}</div>
                      <div className={`text-[10px] font-bold ${Number(h.gainInr) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {Number(h.gainInr) >= 0 ? '+' : ''}{h.gainPct}%
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-3 border-t border-slate-100 pt-3 space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="text-xs font-extrabold text-slate-700">{inr(Number(h.investedInr))}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Invested</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="text-xs font-extrabold text-slate-700">{inr(Number(h.currentValueInr))}</div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Current</div>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className={`text-xs font-extrabold ${Number(h.gainInr) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {Number(h.gainInr) >= 0 ? '+' : ''}{inr(Number(h.gainInr))}
                          </div>
                          <div className="text-[9px] text-slate-400 uppercase font-bold">Gain/Loss</div>
                        </div>
                      </div>

                      {(h.riskTier || h.qualityVerdict || h.suitability) && (
                        <div className="flex flex-wrap gap-1.5">
                          {h.riskTier && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Risk: {h.riskTier}
                            </span>
                          )}
                          {h.qualityVerdict && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Quality: {h.qualityVerdict}
                            </span>
                          )}
                          {h.suitability && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              Suitability: {h.suitability}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="text-xs text-slate-600 leading-relaxed">
                        <span className="font-bold">{h.verdict.description}</span>
                        {h.action && <span className="ml-1 text-slate-500">{h.action}</span>}
                      </div>

                      {h.suggestion && (
                        <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-800">
                          <ArrowRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                          {h.suggestion}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SIPs Section */}
        {review.sips.length > 0 && (
          <div>
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide mb-3">
              Active SIPs ({review.sips.filter((s) => s.status === 'Active').length})
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-sm">
              {review.sips.filter((s) => s.status === 'Active').map((sip) => (
                <div key={sip.id} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-700 truncate">{sip.fundName}</div>
                    <div className="text-[10px] text-slate-400">{sip.entityName} · {sip.frequency}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-extrabold text-slate-800">{inr(Number(sip.monthlyAmountInr))}/mo</div>
                    {sip.fundVerdict && (
                      <div className="text-[9px] font-bold text-slate-400 uppercase">{sip.fundVerdict}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[#0A1628] to-[#1E40AF] rounded-2xl p-6 text-white text-center">
          <h3 className="text-lg font-extrabold mb-2">Ready for the next step?</h3>
          <p className="text-sm text-slate-300 max-w-lg mx-auto mb-5">
            This report shows exactly what needs attention. Our research desk will walk you through specific fund replacements,
            tax-efficient exit sequencing, and a forward SIP plan — free, no obligation.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-[#0A1628] px-6 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Talk to us on WhatsApp
            </a>
            <a
              href="/contact"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
            >
              Request a callback
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-slate-400 leading-relaxed text-center max-w-2xl mx-auto">
          Mutual Fund investments are subject to market risks. Read all scheme-related documents carefully.
          This analysis is generated by the Trustner PD Engine v2 based on your uploaded CAS data and does NOT
          constitute investment advice as defined under the SEBI (Investment Advisers) Regulations, 2013.
          Fund verdicts are based on our 12-point research checklist and may change with market conditions.
          Trustner Asset Services Pvt. Ltd. — AMFI registered Mutual Fund Distributor and SIF Distributor,
          APMI registered PMS Distributor: ARN-286886.
        </p>
      </div>
    </main>
  );
}
