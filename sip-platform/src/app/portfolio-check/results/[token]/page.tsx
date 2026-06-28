import type { Metadata } from 'next';
import HealthReport from './HealthReport';

export const metadata: Metadata = {
  title: 'Your Portfolio Health Report | MeraSIP by Trustner',
  description: 'AI-powered mutual fund portfolio analysis — fund-by-fund verdicts, risk assessment, duplicate detection, and tax estimates.',
  robots: { index: false, follow: false },
  openGraph: {
    title: 'Portfolio Health Report — MeraSIP by Trustner',
    description: 'Fund-by-fund verdicts, duplicate detection, risk assessment & tax estimates. Free, powered by the Trustner PD Engine.',
    type: 'website',
    siteName: 'MeraSIP by Trustner',
  },
};

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');

  const res = await fetch(`${baseUrl}/api/portfolio-check/results/${token}`, { cache: 'no-store' });

  if (!res.ok) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-extrabold text-slate-800 mb-2">Results not found</h1>
          <p className="text-sm text-slate-500 mb-6">
            This link may have expired or the analysis is still processing. Try uploading your CAS again.
          </p>
          <a href="/portfolio-check" className="inline-flex items-center gap-2 bg-teal-600 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-teal-700 transition-colors">
            Run a new check
          </a>
        </div>
      </main>
    );
  }

  const data = await res.json();

  return <HealthReport review={data.review} />;
}
