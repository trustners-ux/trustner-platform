'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { FundSearchInput } from '@/components/funds/FundSearchInput';

interface CompareSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (schemeCode: number, slug: string) => void;
  currentCount: number;
}

export function CompareSearchModal({
  isOpen,
  onClose,
  onSelect,
  currentCount,
}: CompareSearchModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Add Fund to Compare</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentCount} of 4 funds selected
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <FundSearchInput
          mode="select"
          placeholder="Search by fund name or AMC..."
          onSelect={(schemeCode, slug) => {
            onSelect(schemeCode, slug);
            onClose();
          }}
        />

        {/* Helper text */}
        <p className="text-xs text-gray-400 mt-3 text-center">
          Type at least 2 characters to search. Select a fund to add it to comparison.
        </p>
      </div>
    </div>
  );
}
