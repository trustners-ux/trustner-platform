'use client';

import dynamic from 'next/dynamic';

const ReportContent = dynamic(() => import('./ReportContent'), { ssr: false });

export default function ReportPage() {
  return <ReportContent />;
}
