import type { Metadata } from 'next';
import Link from 'next/link';
import { Mail, MapPin, TrendingUp, Users, Award, Briefcase, GraduationCap, ArrowRight } from 'lucide-react';
import { COMPANY } from '@/lib/constants/company';

export const metadata: Metadata = {
  title: 'Careers at Trustner | Mera SIP Online',
  description:
    'Join Trustner Asset Services — India\'s research-driven mutual fund distributor and SIP learning hub. AMFI ARN-286886. Hiring across Research, Relationship Management, Technology and Client Services.',
  openGraph: {
    title: 'Careers at Trustner — Build the future of MFD-led wealth management',
    description:
      'We are hiring across Research, Relationship Management, Technology and Client Services. Send your résumé to career@trustner.in.',
    url: 'https://www.merasip.com/careers',
  },
};

const OPEN_ROLES = [
  {
    role: 'Senior Mutual Fund Analyst',
    team: 'Research',
    location: 'Guwahati / Bangalore',
    type: 'Full-time',
    summary:
      'Drive the fund-selection and scoring engine that powers every Trustner client portfolio review. Build the data pipelines, write the methodology, and own the preferred-fund committee outputs.',
  },
  {
    role: 'Relationship Manager — HNI Segment',
    team: 'Client Services',
    location: 'Guwahati / Tezpur / Kolkata',
    type: 'Full-time',
    summary:
      'Own a book of 50-100 affluent and HNI families. Lead quarterly portfolio reviews, goal-mapping conversations and the entire client journey. NISM-V-A required; CFP / CFA preferred.',
  },
  {
    role: 'Full-Stack Engineer (Next.js + Postgres)',
    team: 'Technology',
    location: 'Remote / Guwahati',
    type: 'Full-time',
    summary:
      'Help build the Trustner platform — Portfolio Diagnostic Workbench, AI advisor pipelines, client portal, MFD MIS. Strong TypeScript, Next.js 15, and SQL fundamentals.',
  },
  {
    role: 'Operations Associate',
    team: 'Client Services',
    location: 'Guwahati',
    type: 'Full-time',
    summary:
      'Handle KYC, transactions, redemptions, and client documentation. Detail-oriented, comfortable with BSE StAR-MF and CAMS / Karvy back-office systems.',
  },
  {
    role: 'Content & Education Lead',
    team: 'Research',
    location: 'Remote',
    type: 'Full-time',
    summary:
      'Author the weekly market brief, learning modules, and client communication. Strong writing + finance background. NISM-V-A or equivalent within 6 months of joining.',
  },
  {
    role: 'Internship — Investment Research',
    team: 'Research',
    location: 'Guwahati / Remote',
    type: '3-6 months',
    summary:
      'Work alongside our research team on fund analysis, sector reports, and the portfolio diagnostic methodology. CA/CFA Level 1+ or MBA Finance candidates preferred.',
  },
];

const WHY_TRUSTNER = [
  {
    icon: TrendingUp,
    title: '100+ team, ₹500+ Cr AUM',
    body: 'India\'s only research-grade MFD platform with a real engineering team building the future of mutual fund distribution.',
  },
  {
    icon: GraduationCap,
    title: 'Pay for your NISM / CFP',
    body: 'We fund NISM-V-A, NISM-VA-Investment-Adviser, CFP, and CFA prep for every full-time hire. Continuous learning is the job.',
  },
  {
    icon: Award,
    title: 'Founder-led, low politics',
    body: 'Direct access to leadership. Decisions in days, not committees. CFP-led culture — substance over hierarchy.',
  },
  {
    icon: Users,
    title: 'Multi-city presence',
    body: 'Offices in Guwahati, Tezpur, Bangalore, Kolkata and Hyderabad. Remote-friendly for engineering and research roles.',
  },
];

export default function CareersPage() {
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white py-20 sm:py-28">
        <div className="container-custom">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider mb-5">
              <Briefcase className="w-3.5 h-3.5 text-brand-300" />
              Hiring
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold mb-5 leading-[1.05]">
              Build the future of <span className="text-brand-300">MFD-led wealth management</span>.
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed">
              We are an AMFI-registered Mutual Fund Distributor ({COMPANY.mfEntity.amfiArn}) running one of
              India&apos;s most research-driven SIP platforms. Six roles are open across Research, RM, Tech and
              Operations. Send your CV to <a href={`mailto:${COMPANY.contact.careersEmail}`} className="text-brand-300 font-semibold underline-offset-4 hover:underline">{COMPANY.contact.careersEmail}</a> and we&apos;ll get back within five working days.
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-7">
              <a
                href={`mailto:${COMPANY.contact.careersEmail}?subject=Application — [Your Name] — [Role]`}
                className="inline-flex items-center gap-2 bg-brand text-white font-semibold rounded-xl px-5 py-3 hover:bg-brand-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send your résumé
              </a>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 text-white/80 hover:text-white text-sm font-semibold transition-colors"
              >
                About Trustner <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trustner */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="container-custom">
          <h2 className="text-3xl font-extrabold text-primary-800 mb-2">Why join us</h2>
          <p className="text-slate-600 mb-10 max-w-2xl">
            We are small enough that your work shows up the same week, and ambitious enough that the work matters
            to the next 10,000 Trustner client families.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {WHY_TRUSTNER.map((w) => {
              const Icon = w.icon;
              return (
                <div key={w.title} className="bg-white rounded-2xl border border-slate-200 p-5 hover:border-brand/40 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-xl bg-brand/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-brand" />
                  </div>
                  <h3 className="font-bold text-primary-800 mb-1.5">{w.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{w.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container-custom">
          <h2 className="text-3xl font-extrabold text-primary-800 mb-2">Open roles</h2>
          <p className="text-slate-600 mb-10 max-w-2xl">
            Don&apos;t see a fit? Email us anyway — we hire for talent, not just open seats.
          </p>
          <div className="space-y-3">
            {OPEN_ROLES.map((r) => (
              <article
                key={r.role}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 hover:border-brand/40 hover:shadow-sm transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <h3 className="text-lg sm:text-xl font-bold text-primary-800">{r.role}</h3>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-brand/10 text-brand rounded-full uppercase tracking-wider">
                        {r.team}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mb-2">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {r.location}
                      </span>
                      <span>·</span>
                      <span>{r.type}</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed">{r.summary}</p>
                  </div>
                  <a
                    href={`mailto:${COMPANY.contact.careersEmail}?subject=Application — ${encodeURIComponent(r.role)}&body=Hi Trustner team,%0D%0A%0D%0AI'd like to apply for ${encodeURIComponent(r.role)}.%0D%0A%0D%0AAttached: my résumé.%0D%0A%0D%0AHappy to share more — best time to talk:%0D%0A%0D%0AThanks,`}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-brand text-white text-sm font-semibold rounded-xl hover:bg-brand-600 transition-colors whitespace-nowrap"
                  >
                    Apply <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How to apply */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="container-custom max-w-3xl">
          <h2 className="text-3xl font-extrabold text-primary-800 mb-6">How to apply</h2>
          <ol className="space-y-4">
            {[
              {
                title: 'Email your résumé',
                body: (
                  <>
                    Send your CV plus a 5-line note about why you&apos;re a fit to{' '}
                    <a
                      href={`mailto:${COMPANY.contact.careersEmail}`}
                      className="text-brand font-semibold hover:underline underline-offset-2"
                    >
                      {COMPANY.contact.careersEmail}
                    </a>
                    . Use the subject line <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded">Application — [Your Name] — [Role]</code>.
                  </>
                ),
              },
              {
                title: 'Initial screen (15 min call)',
                body: 'A short conversation about your background, what you want next, and whether the role looks right for both sides. Usually within 5 working days.',
              },
              {
                title: 'Take-home or case (role-specific)',
                body: 'For Research and Tech roles: a 4-6 hour take-home. For RM roles: a structured case discussion. No leetcode, no surprise tests — we send the brief in advance.',
              },
              {
                title: 'Final round + offer',
                body: 'Conversations with 1-2 team members and one founder. Decision communicated within 7 days. Compensation discussed openly; we share band on first call.',
              },
            ].map((step, i) => (
              <li key={step.title} className="flex gap-4">
                <div className="w-9 h-9 rounded-full bg-brand text-white font-bold text-sm flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-primary-800 mb-1">{step.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-10 p-5 bg-brand/5 border border-brand/20 rounded-2xl flex items-start gap-3">
            <Mail className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-primary-800 mb-0.5">Direct résumé inbox</h3>
              <p className="text-sm text-slate-700">
                <a
                  href={`mailto:${COMPANY.contact.careersEmail}`}
                  className="text-brand font-semibold hover:underline underline-offset-2"
                >
                  {COMPANY.contact.careersEmail}
                </a>{' '}
                · Replies within 5 working days
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
