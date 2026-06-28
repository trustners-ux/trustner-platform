import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ShieldCheck, MessageCircle, AlertTriangle, ArrowLeft, ChevronRight, Building2, Database, BadgeCheck,
} from 'lucide-react';
import { generateSEOMetadata, generateBreadcrumbSchema } from '@/lib/seo';
import { COMPANY, DISCLAIMER } from '@/lib/constants/company';
import { getSifUniverseRich, type SifRichRow } from '@/lib/services/sif-data';
import { SIF_EDITORIAL, type SifCat, type SifVerdict } from '@/data/sif/sif-editorial';

export const revalidate = 1800; // 30 min — matches the SIF engine cache

/** Pre-render a page for every known SIF id. */
export function generateStaticParams() {
  return SIF_EDITORIAL.map((e) => ({ id: e.id }));
}

const STRATEGY_EXPLAINER: Record<SifCat, string> = {
  hybrid: 'A Hybrid Long-Short SIF blends equity and debt with a long-short overlay via derivatives — aiming for a smoother ride than pure equity by hedging part of the book. The most popular, lowest-volatility SIF type.',
  equity: 'An Equity Long-Short SIF holds core long equity positions and takes short positions through derivatives, aiming to make money in both rising and falling markets while managing net market exposure.',
  ex100: 'An Equity Ex-Top 100 Long-Short SIF focuses on mid- and small-caps outside the top 100 by market cap, with a long-short overlay — higher return potential and higher volatility than large-cap-led strategies.',
  aaa: 'An Active Asset Allocator SIF runs an all-weather mandate, shifting dynamically across equity, debt, gold and derivatives based on the manager’s macro and valuation read.',
  sector: 'A Sector Rotation Long-Short SIF tactically rotates between sectors using momentum and macro signals, going long preferred sectors and shorting weaker ones.',
};

const VERDICT_NOTE: Record<SifVerdict, string> = {
  '★ Buy': 'On the Trustner Research Desk’s preferred list for this strategy — a core consideration for suitable investors.',
  '★ Buy (sat.)': 'A preferred pick used as a satellite (smaller, complementary) position rather than a core holding.',
  Accumulate: 'A solid option the desk is comfortable building into over time for suitable investors.',
  Hold: 'Worth holding if already invested; the desk is watching for more track record before a stronger call.',
  Monitor: 'Too new to rate — on the desk’s watchlist as its NAV history accrues. No score yet.',
};

const VERDICT_STYLE: Record<SifVerdict, string> = {
  '★ Buy': 'bg-[#F5EFE3] text-[#8A6A40] border-[#D8C7A6]',
  '★ Buy (sat.)': 'bg-[#F5EFE3] text-[#8A6A40] border-[#D8C7A6]',
  Accumulate: 'bg-[#E8F1EC] text-[#2F6F4F] border-[#B9D4C5]',
  Hold: 'bg-slate-100 text-slate-600 border-slate-300',
  Monitor: 'bg-slate-50 text-slate-500 border-slate-200',
};
const RISK_LABEL = ['', 'Low', 'Low–Moderate', 'Moderate', 'Moderate–High', 'High', 'Very High'];

const fmtNav = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}`);
const fmtPct = (n: number | null) => (n == null ? '—' : `${n > 0 ? '+' : ''}${n.toFixed(2)}%`);
const fmtAum = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')} Cr`);
const fmtTer = (n: number | null) => (n == null ? '—' : `${n.toFixed(2)}%`);
const monthYear = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};
const pctClass = (n: number | null) => (n == null ? 'text-slate-400' : n > 0 ? 'text-emerald-700' : n < 0 ? 'text-rose-700' : 'text-slate-500');

async function getFund(id: string): Promise<{ fund: SifRichRow | null; navAsOf: string | null; vrAsOf: string }> {
  const u = await getSifUniverseRich();
  return { fund: u.rows.find((r) => r.id === id) ?? null, navAsOf: u.navAsOf, vrAsOf: u.vrAsOf };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const e = SIF_EDITORIAL.find((x) => x.id === id);
  if (!e) return { title: 'SIF Fund — Mera SIP' };
  return generateSEOMetadata({
    title: `${e.name} — NAV, Returns & Trustner View | SIF`,
    description: `${e.name} (${e.amc}) — official AMFI NAV, since-inception, 1M & 3M returns, AUM, risk band, TER and the Trustner Fund Score. A Specialized Investment Fund from ${e.amc}, since ${monthYear(e.incept)}. Trustner is an AMFI-registered SIF Distributor (ARN-286886).`,
    path: `/funds/sif/${id}`,
    keywords: [`${e.name} NAV`, `${e.name} returns`, 'SIF NAV', `${e.amc} SIF`, 'specialized investment fund'],
  });
}

export default async function SifFundDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { fund: f, navAsOf } = await getFund(id);
  if (!f) notFound();

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Funds', url: '/funds' },
    { name: 'Live SIF Universe', url: '/funds/sif' },
    { name: f.name, url: `/funds/sif/${id}` },
  ]);
  const wa = COMPANY.contact?.whatsapp?.replace('+', '') || '916003903737';
  const waLink = `https://wa.me/${wa}?text=${encodeURIComponent(`Hi Trustner, I'd like to understand ${f.name} and whether it fits my portfolio. Please guide me.`)}`;

  const Metric = ({ label, value, cls }: { label: string; value: string; cls?: string }) => (
    <div className="rounded-xl border border-surface-200 bg-white p-4 text-center">
      <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">{label}</div>
      <div className={`text-lg font-extrabold tabular-nums mt-1 ${cls ?? 'text-primary-700'}`}>{value}</div>
    </div>
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="bg-surface-100 border-b border-surface-200">
        <div className="container-custom py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3" />
            <Link href="/funds/sif" className="hover:text-brand transition-colors">Live SIF Universe</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-700 font-medium">{f.name}</span>
          </nav>
        </div>
      </div>

      {/* Hero */}
      <section className="bg-hero-pattern text-white py-12">
        <div className="container-custom">
          <Link href="/funds/sif" className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to the SIF universe
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-[11px] font-semibold mb-3 border border-white/10">
                {f.catLabel} · {f.amc}
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight">{f.name}</h1>
              <p className="text-slate-300 mt-2 text-sm">
                A Specialized Investment Fund · since {monthYear(f.incept)} · {f.sd ? `AMFI ${f.sd} · ` : ''}₹10 lakh minimum (Regular-Growth)
              </p>
              <div className="flex items-center gap-3 mt-4">
                <span className={`inline-block px-3 py-1 rounded-full border text-xs font-bold ${VERDICT_STYLE[f.verdict]}`}>{f.verdict}</span>
                {f.tfs != null && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-slate-200">
                    <BadgeCheck className="w-4 h-4 text-accent" /> Trustner Fund Score <strong className="text-white text-base tabular-nums">{f.tfs}</strong>/100
                  </span>
                )}
              </div>
            </div>
            {/* NAV card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/15 p-5 min-w-[200px]">
              <div className="text-[11px] uppercase tracking-wide text-slate-300 font-semibold flex items-center gap-1.5">
                {f.source === 'amfi' && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />} Official NAV
              </div>
              <div className="text-3xl font-extrabold tabular-nums mt-1">{fmtNav(f.nav)}</div>
              <div className="text-[11px] text-slate-300 mt-1">{navAsOf ? `AMFI · as of ${navAsOf}` : 'Awaiting first NAV'}</div>
              <div className={`text-sm font-bold tabular-nums mt-2 ${pctClass(f.si)}`}>{fmtPct(f.si)} <span className="text-[11px] font-normal text-slate-300">since inception</span></div>
            </div>
          </div>
          <div className="mt-6">
            <a href={waLink} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 text-slate-900 px-6 py-3 rounded-lg font-bold hover:bg-amber-300 transition-colors text-sm">
              <MessageCircle className="w-4 h-4" /> Talk to Trustner about {f.name.split(' ').slice(0, 2).join(' ')}
            </a>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-b border-surface-200">
        <div className="container-custom py-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-600">
            <span className="inline-flex items-center gap-1.5 font-semibold text-primary-700">
              <ShieldCheck className="w-4 h-4 text-brand" /> {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'}
            </span>
            <span>AMFI-registered SIF Distributor · {COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'} · empanelled with {f.amc}</span>
            <span className="inline-flex items-center gap-1.5 text-slate-500"><Database className="w-3.5 h-3.5" /> Source: AMFI official SIF NAV feed</span>
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto space-y-8">

            {/* Returns */}
            <div>
              <h2 className="text-lg font-bold text-primary-700 mb-3">Returns</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <Metric label="1 Day" value={fmtPct(f.d1)} cls={pctClass(f.d1)} />
                <Metric label="5 Day" value={fmtPct(f.d5)} cls={pctClass(f.d5)} />
                <Metric label="1 Month" value={fmtPct(f.m1)} cls={pctClass(f.m1)} />
                <Metric label="3 Month" value={fmtPct(f.m3)} cls={pctClass(f.m3)} />
                <Metric label="Since Incept." value={fmtPct(f.si)} cls={pctClass(f.si)} />
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Since-inception is exact (NAV vs ₹{f.face.toLocaleString('en-IN')} face value). 1D/5D build from the official daily-NAV archive; 1M/3M from Value Research until the archive spans those windows.
              </p>
            </div>

            {/* Profile */}
            <div>
              <h2 className="text-lg font-bold text-primary-700 mb-3">Fund profile</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Metric label="AUM" value={fmtAum(f.aum)} cls="text-slate-800" />
                <Metric label="Risk band" value={f.risk == null ? '—' : RISK_LABEL[f.risk] ?? String(f.risk)} cls="text-slate-800" />
                <Metric label="TER" value={fmtTer(f.ter)} cls="text-slate-800" />
                <Metric label="Min. investment" value="₹10 L" cls="text-slate-800" />
              </div>
            </div>

            {/* Strategy */}
            <div className="rounded-xl border border-surface-200 bg-surface-100 p-5">
              <h2 className="text-base font-bold text-primary-700 mb-1">{f.catLabel} — what it does</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{STRATEGY_EXPLAINER[f.cat]}</p>
            </div>

            {/* Trustner view */}
            <div className="rounded-xl border-l-[3px] border-[#9A7B4F] bg-[#FAF7F2] p-5">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-bold text-primary-700">The Trustner view</h2>
                <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${VERDICT_STYLE[f.verdict]}`}>{f.verdict}</span>
                {f.tfs != null && <span className="text-xs text-slate-500">TFS <strong className="text-[#8A6A40] tabular-nums">{f.tfs}</strong>/100</span>}
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{VERDICT_NOTE[f.verdict]}</p>
              <p className="text-[11px] text-slate-500 mt-2">
                The Trustner Fund Score and verdict are the Trustner Research Desk&rsquo;s proprietary, qualitative educational view, reviewed monthly. They are <strong>not</strong> a recommendation to buy or sell, nor personalised advice under the SEBI (Investment Advisers) Regulations, 2013.
              </p>
            </div>

            {/* sub-1yr flag */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 leading-relaxed">
                This SIF launched in {monthYear(f.incept)}, so it carries <strong>under one year of track record</strong>. Returns are for context only — <strong>past performance is not indicative of future results</strong>. SIFs use derivatives and short positions; read the ISID, SID, SAI and KIM before investing.
              </p>
            </div>

            {/* Why Trustner */}
            <div className="rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-white p-6">
              <div className="flex items-start gap-3">
                <Building2 className="w-6 h-6 text-brand shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-primary-700 mb-1">Ready to look at {f.name.split(' ').slice(0, 2).join(' ')} for your portfolio?</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    We&rsquo;re an AMFI-registered SIF Distributor empanelled with {f.amc}. We&rsquo;ll explain whether this strategy fits your goals
                    and risk profile, compare it with the other live SIFs, and handle onboarding in the Regular plan with ongoing servicing.
                  </p>
                  <a href={waLink} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-3 bg-brand text-white px-5 py-2.5 rounded-lg font-bold hover:bg-brand-700 transition-colors text-sm">
                    <MessageCircle className="w-4 h-4" /> Talk to Trustner
                  </a>
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="space-y-2 pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-600">Important:</strong> NAV is sourced from AMFI&rsquo;s official Specialized Investment Fund feed (Regular-Growth plan). This page is educational and for comparison; it does <strong>not</strong> constitute investment advice or a recommendation to buy any scheme.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-slate-500">Disclaimer:</strong> {DISCLAIMER.mutual_fund}{' '}
                {COMPANY.mfEntity?.name ?? 'Trustner Asset Services Pvt. Ltd.'} is an AMFI-registered Mutual Fund &amp; SIF Distributor
                ({COMPANY.mfEntity?.amfiArn ?? 'ARN-286886'}) and recommends Regular plans only; it is not a SEBI Registered Investment Adviser.
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
