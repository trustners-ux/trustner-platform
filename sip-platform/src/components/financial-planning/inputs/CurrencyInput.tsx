'use client';

import { useState, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CurrencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  helpText?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Format a number with Indian comma grouping (e.g. 10,00,000 for 1M) */
function formatIndian(num: number): string {
  if (num === 0) return '0';
  const str = Math.abs(Math.round(num)).toString();
  // First group of 3 from right, then groups of 2
  const lastThree = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return (num < 0 ? '-' : '') + (rest ? formatted + ',' + lastThree : lastThree);
}

/** Convert a value into a human-readable INR label (e.g. "10 Lakh", "1.5 Crore") */
function friendlyLabel(num: number): string {
  if (num <= 0) return '';
  if (num >= 10000000) {
    const crore = num / 10000000;
    return `${crore % 1 === 0 ? crore.toFixed(0) : crore.toFixed(1)} Crore`;
  }
  if (num >= 100000) {
    const lakh = num / 100000;
    return `${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(1)} Lakh`;
  }
  if (num >= 1000) {
    const k = num / 1000;
    return `${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)} Thousand`;
  }
  return '';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CurrencyInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  placeholder = '0',
  helpText,
}: CurrencyInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [rawText, setRawText] = useState('');

  // Clamp value within bounds
  const clamp = useCallback(
    (num: number): number => {
      let clamped = num;
      if (min !== undefined) clamped = Math.max(min, clamped);
      if (max !== undefined) clamped = Math.min(max, clamped);
      return clamped;
    },
    [min, max]
  );

  const handleFocus = () => {
    setIsFocused(true);
    // Show the raw numeric value (no commas) for easy editing
    setRawText(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Parse whatever the user typed and commit it
    const cleaned = rawText.replace(/,/g, '').trim();
    const parsed = parseFloat(cleaned);
    if (!isNaN(parsed)) {
      onChange(clamp(Math.round(parsed / step) * step));
    } else {
      onChange(min ?? 0);
    }
    setRawText('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    // Allow digits, commas, and a single decimal point while typing
    if (/^[\d,]*\.?\d*$/.test(text) || text === '') {
      setRawText(text);
      // Live-update the parent value
      const cleaned = text.replace(/,/g, '');
      const parsed = parseFloat(cleaned);
      if (!isNaN(parsed)) {
        onChange(clamp(parsed));
      }
    }
  };

  // Increment / decrement via arrow buttons
  const increment = () => {
    const next = value + step;
    onChange(max !== undefined ? Math.min(max, next) : next);
  };

  const decrement = () => {
    const next = value - step;
    onChange(min !== undefined ? Math.max(min, next) : next);
  };

  const friendly = friendlyLabel(value);

  return (
    <div>
      <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
        {label}
      </label>

      {/* Input wrapper */}
      <div className="flex items-center border border-surface-300 rounded-xl bg-white focus-within:ring-2 focus-within:ring-brand-300 focus-within:border-brand-400 transition-all">
        {/* Rupee prefix */}
        <span className="pl-3 pr-1 text-sm text-slate-400 select-none font-medium">
          ₹
        </span>

        {/* Text input */}
        <input
          type="text"
          inputMode="decimal"
          placeholder={placeholder}
          value={isFocused ? rawText : formatIndian(value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          className="flex-1 py-3 px-2 text-base font-semibold text-primary-700 bg-transparent outline-none min-w-0 leading-normal"
        />

        {/* Increment / Decrement arrows */}
        <div className="flex flex-col border-l border-surface-300 rounded-r-xl overflow-hidden">
          <button
            type="button"
            onClick={increment}
            className="px-2 py-0.5 text-slate-400 hover:text-brand hover:bg-brand-50 transition-colors text-xs leading-none"
            tabIndex={-1}
          >
            &#9650;
          </button>
          <button
            type="button"
            onClick={decrement}
            className="px-2 py-0.5 text-slate-400 hover:text-brand hover:bg-brand-50 transition-colors text-xs leading-none border-t border-surface-200"
            tabIndex={-1}
          >
            &#9660;
          </button>
        </div>
      </div>

      {/* Friendly label (e.g. "₹10 Lakh") */}
      {friendly && (
        <p className="text-[11px] text-brand-700 font-medium mt-1">
          ₹{friendly}
        </p>
      )}

      {/* Help text */}
      {helpText && (
        <p className="text-[10px] text-slate-400 mt-1">{helpText}</p>
      )}
    </div>
  );
}
