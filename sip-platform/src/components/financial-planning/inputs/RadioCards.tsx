'use client';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface RadioCardsProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioCardOption[];
  columns?: 2 | 3 | 4;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGridCols(columns: 2 | 3 | 4): string {
  switch (columns) {
    case 2:
      return 'grid-cols-2';
    case 3:
      return 'grid-cols-2 sm:grid-cols-3';
    case 4:
      return 'grid-cols-2 sm:grid-cols-4';
    default:
      return 'grid-cols-2';
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function RadioCards({
  label,
  value,
  onChange,
  options,
  columns = 2,
}: RadioCardsProps) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-2">
        {label}
      </label>
      <div className={`grid ${getGridCols(columns)} gap-3`}>
        {options.map((opt) => {
          const isSelected = value === opt.value;

          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                isSelected
                  ? 'border-brand bg-brand-50 shadow-glow-brand'
                  : 'border-surface-300 bg-white hover:border-brand-400 hover:bg-brand-50/30'
              }`}
            >
              {/* Icon */}
              {opt.icon && (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-surface-200 text-slate-400'
                  }`}
                >
                  {opt.icon}
                </div>
              )}

              {/* Label */}
              <span
                className={`text-xs font-semibold transition-colors ${
                  isSelected ? 'text-brand-800' : 'text-primary-700'
                }`}
              >
                {opt.label}
              </span>

              {/* Description */}
              {opt.description && (
                <span className="text-[10px] text-slate-400 leading-tight">
                  {opt.description}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
