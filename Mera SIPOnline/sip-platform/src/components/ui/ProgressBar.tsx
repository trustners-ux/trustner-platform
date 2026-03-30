'use client';

import { cn } from '@/lib/utils/cn';

interface ProgressBarProps {
  percentage: number;
  completed: number;
  total: number;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function ProgressBar({ percentage, completed, total, showLabel = true, size = 'sm', className }: ProgressBarProps) {
  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium text-slate-500">
            {completed}/{total} completed
          </span>
          <span className={cn(
            'text-[10px] font-bold',
            percentage === 100 ? 'text-positive' : 'text-brand'
          )}>
            {percentage}%
          </span>
        </div>
      )}
      <div className={cn(
        'w-full bg-surface-200 rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            percentage === 100
              ? 'bg-gradient-to-r from-positive to-teal-400'
              : 'bg-gradient-to-r from-brand to-teal-700'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
