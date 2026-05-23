import { cn } from '@/lib/utils/cn';

const RANK_STYLES: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-amber-100', text: 'text-amber-700', label: '1st' },
  2: { bg: 'bg-slate-100', text: 'text-slate-600', label: '2nd' },
  3: { bg: 'bg-orange-100', text: 'text-orange-700', label: '3rd' },
};

export function RankBadge({ rank }: { rank: number }) {
  const style = RANK_STYLES[rank];

  if (style) {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold',
          style.bg,
          style.text
        )}
      >
        {style.label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-surface-100 text-slate-500 text-xs font-semibold">
      {rank}
    </span>
  );
}
