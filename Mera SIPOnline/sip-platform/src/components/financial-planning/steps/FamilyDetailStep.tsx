'use client';

import { useMemo } from 'react';
import { Heart, Users, Activity, Wallet, TrendingUp } from 'lucide-react';
import CurrencyInput from '@/components/financial-planning/inputs/CurrencyInput';
import RadioCards from '@/components/financial-planning/inputs/RadioCards';
import type { ComprehensiveProfile } from '@/types/financial-planning-v2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  data: ComprehensiveProfile;
  onUpdate: (updates: Partial<ComprehensiveProfile>) => void;
  maritalStatus: string;
  dependentsCount: number;
  childrenAges: number[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INPUT_CLASS =
  'w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-sm';

const HEALTH_CONDITIONS = [
  'Diabetes',
  'Heart Disease',
  'Cancer',
  'Hypertension',
  'Kidney Disease',
  'Stroke',
  'Other',
];

const INCOME_GROWTH_OPTIONS = [
  {
    value: 'conservative',
    label: 'Conservative',
    description: '5-7% annual growth',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    value: 'moderate',
    label: 'Moderate',
    description: '8-12% annual growth',
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    value: 'optimistic',
    label: 'Optimistic',
    description: '13-18% annual growth',
    icon: <TrendingUp className="w-5 h-5" />,
  },
];

const EXPENSE_FIELDS: { key: keyof ComprehensiveProfile['monthlyExpenseBreakdown']; label: string }[] = [
  { key: 'housing', label: 'Housing (Rent / EMI)' },
  { key: 'groceries', label: 'Groceries & Food' },
  { key: 'utilities', label: 'Utilities & Bills' },
  { key: 'transport', label: 'Transport & Fuel' },
  { key: 'education', label: 'Education' },
  { key: 'medical', label: 'Medical & Health' },
  { key: 'entertainment', label: 'Entertainment' },
  { key: 'clothing', label: 'Clothing & Personal' },
  { key: 'other', label: 'Other Expenses' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatIndianCurrency(num: number): string {
  if (num >= 10000000) return `${(num / 10000000).toFixed(1)} Cr`;
  if (num >= 100000) return `${(num / 100000).toFixed(1)} L`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)} K`;
  return `${num}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FamilyDetailStep({
  data,
  onUpdate,
  maritalStatus,
  dependentsCount,
  childrenAges,
}: Props) {
  const isMarried = maritalStatus === 'married';
  const childCount = childrenAges.length;

  // Today's date for DOB max
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Total monthly expenses
  const totalExpenses = useMemo(() => {
    const b = data.monthlyExpenseBreakdown;
    return b.housing + b.groceries + b.utilities + b.transport +
      b.education + b.medical + b.entertainment + b.clothing + b.other;
  }, [data.monthlyExpenseBreakdown]);

  // ---- Handlers ----

  const updateChildDetail = (index: number, field: 'name' | 'dob', value: string) => {
    const updated = [...data.childrenDetails];
    // Ensure the entry exists
    while (updated.length <= index) {
      updated.push({ name: '', dob: '' });
    }
    updated[index] = { ...updated[index], [field]: value };
    onUpdate({ childrenDetails: updated });
  };

  const updateExpense = (key: keyof ComprehensiveProfile['monthlyExpenseBreakdown'], value: number) => {
    onUpdate({
      monthlyExpenseBreakdown: {
        ...data.monthlyExpenseBreakdown,
        [key]: value,
      },
    });
  };

  const toggleHealthCondition = (condition: string) => {
    const current = data.familyHealthHistory;
    const updated = current.includes(condition)
      ? current.filter((c) => c !== condition)
      : [...current, condition];
    onUpdate({ familyHealthHistory: updated });
  };

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------------- */}
      {/* Section 1: Spouse & Children Details */}
      {/* ---------------------------------------------------------- */}
      {isMarried && (
        <>
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
              Spouse &amp; Children Details
            </h3>
          </div>

          {/* Spouse Name */}
          <div>
            <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
              Spouse&apos;s Name
            </label>
            <input
              type="text"
              value={data.spouseName}
              onChange={(e) => onUpdate({ spouseName: e.target.value })}
              placeholder="Enter spouse's full name"
              className={INPUT_CLASS}
            />
          </div>

          {/* Children Details */}
          {childCount > 0 && (
            <div>
              <label className="block text-[13px] font-semibold text-slate-600 mb-1.5">
                Children Details
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Based on {childCount} child{childCount > 1 ? 'ren' : ''} from your profile. Add name and date of birth for each.
              </p>
              <div className="space-y-3">
                {Array.from({ length: childCount }, (_, index) => {
                  const detail = data.childrenDetails[index] || { name: '', dob: '' };
                  const age = childrenAges[index];
                  return (
                    <div key={index} className="p-3 rounded-xl border border-surface-200 bg-surface-50/50 space-y-2">
                      <div className="text-xs font-bold text-slate-500 mb-1">
                        Child {index + 1} {age !== undefined ? `(Age: ${age})` : ''}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Name</label>
                          <input
                            type="text"
                            value={detail.name}
                            onChange={(e) => updateChildDetail(index, 'name', e.target.value)}
                            placeholder={`Child ${index + 1}'s name`}
                            className={INPUT_CLASS}
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-slate-500 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            value={detail.dob}
                            onChange={(e) => updateChildDetail(index, 'dob', e.target.value)}
                            max={today}
                            className={INPUT_CLASS}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100" />
        </>
      )}

      {/* ---------------------------------------------------------- */}
      {/* Section 2: Parents' Information */}
      {/* ---------------------------------------------------------- */}
      <div className={isMarried ? '' : ''}>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Parents&apos; Information
          </h3>
        </div>

        {/* Father */}
        <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/30 space-y-3 mb-4">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Father</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text"
                value={data.fatherName}
                onChange={(e) => onUpdate({ fatherName: e.target.value })}
                placeholder="Father's name"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Age</label>
              <input
                type="number"
                value={data.fatherAge || ''}
                onChange={(e) => onUpdate({ fatherAge: e.target.value ? Number(e.target.value) : 0 })}
                min={30}
                max={120}
                placeholder="e.g. 62"
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Health Notes</label>
            <input
              type="text"
              value={data.fatherHealthNotes}
              onChange={(e) => onUpdate({ fatherHealthNotes: e.target.value })}
              placeholder="e.g. Diabetic since 2015, on medication"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Mother */}
        <div className="p-4 rounded-xl border border-surface-200 bg-surface-50/30 space-y-3">
          <div className="text-xs font-bold text-slate-600 uppercase tracking-wide">Mother</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Name</label>
              <input
                type="text"
                value={data.motherName}
                onChange={(e) => onUpdate({ motherName: e.target.value })}
                placeholder="Mother's name"
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Age</label>
              <input
                type="number"
                value={data.motherAge || ''}
                onChange={(e) => onUpdate({ motherAge: e.target.value ? Number(e.target.value) : 0 })}
                min={30}
                max={120}
                placeholder="e.g. 58"
                className={INPUT_CLASS}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Health Notes</label>
            <input
              type="text"
              value={data.motherHealthNotes}
              onChange={(e) => onUpdate({ motherHealthNotes: e.target.value })}
              placeholder="e.g. Hypertension, thyroid"
              className={INPUT_CLASS}
            />
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Section 3: Family Health History */}
      {/* ---------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Family Health History
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Select any conditions that run in your family. This helps us recommend appropriate health and term insurance coverage.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {HEALTH_CONDITIONS.map((condition) => {
            const isChecked = data.familyHealthHistory.includes(condition);
            return (
              <button
                key={condition}
                type="button"
                onClick={() => toggleHealthCondition(condition)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-left transition-all duration-200 ${
                  isChecked
                    ? 'border-brand bg-brand-50 shadow-sm'
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isChecked
                      ? 'border-brand bg-brand text-white'
                      : 'border-slate-300 bg-white'
                  }`}
                >
                  {isChecked && (
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-xs font-semibold ${isChecked ? 'text-brand-800' : 'text-slate-600'}`}>
                  {condition}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Section 4: Detailed Monthly Expenses */}
      {/* ---------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Detailed Monthly Expenses
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Break down your monthly household expenses. This helps us build an accurate cashflow projection.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXPENSE_FIELDS.map(({ key, label }) => (
            <CurrencyInput
              key={key}
              label={label}
              value={data.monthlyExpenseBreakdown[key]}
              onChange={(val) => updateExpense(key, val)}
              min={0}
              max={10000000}
              step={500}
              placeholder="0"
            />
          ))}
        </div>

        {/* Total Expenses */}
        <div className="mt-4 p-3 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-brand-800">Total Monthly Expenses</span>
          <span className="text-lg font-extrabold text-brand-700">
            {'\u20B9'}{formatIndianCurrency(totalExpenses)}
          </span>
        </div>
      </div>

      {/* ---------------------------------------------------------- */}
      {/* Section 5: Income Growth Outlook */}
      {/* ---------------------------------------------------------- */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-brand-600" />
          <h3 className="text-sm font-semibold text-brand-700 uppercase tracking-wide">
            Income Growth Outlook
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          How do you expect your income to grow over the next 5-10 years? This shapes your cashflow projections and goal feasibility.
        </p>

        <RadioCards
          label="Income Growth Scenario"
          value={data.incomeGrowthScenario}
          onChange={(val) => onUpdate({ incomeGrowthScenario: val as ComprehensiveProfile['incomeGrowthScenario'] })}
          options={INCOME_GROWTH_OPTIONS}
          columns={3}
        />
      </div>
    </div>
  );
}
