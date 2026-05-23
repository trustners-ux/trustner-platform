'use client';

import { useState } from 'react';
import { User, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface PersonalInfoBarProps {
  name: string;
  onNameChange: (name: string) => void;
  age: number | null;
  onAgeChange: (age: number | null) => void;
  ageLabel?: string;
  namePlaceholder?: string;
  showAge?: boolean;
}

export default function PersonalInfoBar({
  name,
  onNameChange,
  age,
  onAgeChange,
  ageLabel = 'Current Age',
  namePlaceholder = 'e.g., Ram',
  showAge = true,
}: PersonalInfoBarProps) {
  const [expanded, setExpanded] = useState(false);

  const hasInfo = name.trim() !== '' || (showAge && age !== null);

  return (
    <div className="mb-5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left',
          hasInfo
            ? 'bg-gradient-to-r from-brand-50 to-teal-50 border-brand-200/50'
            : 'bg-gradient-to-r from-surface-100 to-surface-200 border-surface-300/50 hover:border-brand-200/50'
        )}
      >
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            hasInfo ? 'bg-brand-100' : 'bg-surface-300/50'
          )}>
            <User className={cn('w-4 h-4', hasInfo ? 'text-brand' : 'text-slate-400')} />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-700">
              {hasInfo ? (
                <>
                  {name || 'Unnamed'}
                  {showAge && age !== null && (
                    <span className="text-slate-400 font-normal"> &middot; Age {age}</span>
                  )}
                </>
              ) : (
                'Personalise This Report'
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              {hasInfo ? 'Tap to edit' : 'Add name & age for a personalised plan'}
            </div>
          </div>
        </div>
        <ChevronDown className={cn(
          'w-4 h-4 text-slate-400 transition-transform duration-200',
          expanded && 'rotate-180'
        )} />
      </button>

      {expanded && (
        <div className="mt-2 p-4 rounded-xl bg-white border border-surface-300/50 animate-in space-y-3">
          {/* Name Input */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder={namePlaceholder}
              maxLength={40}
              className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300"
            />
          </div>

          {/* Age Input */}
          {showAge && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">{ageLabel}</label>
              <input
                type="number"
                value={age ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') {
                    onAgeChange(null);
                  } else {
                    const num = parseInt(val, 10);
                    if (!isNaN(num) && num >= 0 && num <= 99) {
                      onAgeChange(num);
                    }
                  }
                }}
                placeholder="e.g., 30"
                min={0}
                max={99}
                className="w-full px-3 py-2.5 text-sm font-medium text-primary-700 bg-surface-50 border border-surface-300 rounded-lg outline-none focus:ring-2 focus:ring-brand-300 focus:border-brand-400 transition-all placeholder:text-slate-300"
              />
            </div>
          )}

          {hasInfo && (
            <div className="text-[10px] text-brand-600 bg-brand-50 rounded-lg px-3 py-2">
              ✨ Results below will be personalised{name ? ` for ${name}` : ''}{showAge && age !== null ? ` (age ${age})` : ''}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
