'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TrustnerCuratedFund, FundCategory } from '@/types/funds';

// ─── Types ───

interface FundEditorProps {
  fund?: TrustnerCuratedFund;
  category?: FundCategory;
  onSubmit: (fund: TrustnerCuratedFund) => void;
  onCancel: () => void;
}

interface FormErrors {
  [key: string]: string;
}

// ─── Utils ───

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const ALL_CATEGORIES: FundCategory[] = [
  'Large Cap', 'Large & Mid Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap',
  'Multi Cap', 'Value', 'Contra', 'Multi Asset', 'Balanced Advantage',
  'Aggressive Hybrid', 'Equity Savings', 'Conservative Hybrid',
  'Gold & Silver', 'Fund of Fund',
];

// ─── Component ───

export function FundEditor({ fund, category, onSubmit, onCancel }: FundEditorProps) {
  const isEdit = !!fund;

  // ── Form state ──

  const [name, setName] = useState(fund?.name || '');
  const [fundManager, setFundManager] = useState(fund?.fundManager || '');
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>(
    fund?.category || category || 'Large Cap'
  );
  const [ageOfFund, setAgeOfFund] = useState(fund ? String(fund.ageOfFund) : '');
  const [aumCr, setAumCr] = useState(fund ? String(fund.aumCr) : '');
  const [ter, setTer] = useState(fund ? String((fund.ter * 100).toFixed(2)) : '');
  const [standardDeviation, setStandardDeviation] = useState(
    fund ? String((fund.standardDeviation * 100).toFixed(2)) : ''
  );
  const [sharpeRatio, setSharpeRatio] = useState(fund ? String(fund.sharpeRatio) : '');
  const [mtd, setMtd] = useState(fund ? String((fund.returns.mtd * 100).toFixed(2)) : '');
  const [ytd, setYtd] = useState(fund ? String((fund.returns.ytd * 100).toFixed(2)) : '');
  const [oneYear, setOneYear] = useState(fund ? String((fund.returns.oneYear * 100).toFixed(2)) : '');
  const [twoYear, setTwoYear] = useState(fund ? String((fund.returns.twoYear * 100).toFixed(2)) : '');
  const [threeYear, setThreeYear] = useState(fund ? String((fund.returns.threeYear * 100).toFixed(2)) : '');
  const [fiveYear, setFiveYear] = useState(fund ? String((fund.returns.fiveYear * 100).toFixed(2)) : '');
  const [numberOfHoldings, setNumberOfHoldings] = useState(fund ? String(fund.numberOfHoldings) : '');
  const [rank, setRank] = useState(fund ? String(fund.rank) : '1');
  const [skinAmountCr, setSkinAmountCr] = useState(
    fund?.skinInTheGame ? String(fund.skinInTheGame.amountCr) : ''
  );
  const [skinPercentOfAum, setSkinPercentOfAum] = useState(
    fund?.skinInTheGame ? String((fund.skinInTheGame.percentOfAum * 100).toFixed(4)) : ''
  );

  const [errors, setErrors] = useState<FormErrors>({});

  // Auto-generate ID preview
  const generatedId = slugify(name);

  // ── Validation ──

  const validate = useCallback((): boolean => {
    const errs: FormErrors = {};

    if (!name.trim()) errs.name = 'Fund name is required';
    if (!fundManager.trim()) errs.fundManager = 'Fund manager is required';
    if (!ageOfFund || isNaN(parseFloat(ageOfFund))) errs.ageOfFund = 'Valid age is required';
    if (!aumCr || isNaN(parseFloat(aumCr))) errs.aumCr = 'Valid AUM is required';
    if (!ter || isNaN(parseFloat(ter))) errs.ter = 'Valid TER is required';
    if (!standardDeviation || isNaN(parseFloat(standardDeviation)))
      errs.standardDeviation = 'Valid standard deviation is required';
    if (!sharpeRatio || isNaN(parseFloat(sharpeRatio))) errs.sharpeRatio = 'Valid Sharpe ratio is required';
    if (mtd !== '' && isNaN(parseFloat(mtd))) errs.mtd = 'Must be a valid number';
    if (ytd !== '' && isNaN(parseFloat(ytd))) errs.ytd = 'Must be a valid number';
    if (!oneYear || isNaN(parseFloat(oneYear))) errs.oneYear = 'Valid 1Y return is required';
    if (twoYear && isNaN(parseFloat(twoYear))) errs.twoYear = 'Must be a valid number';
    if (threeYear && isNaN(parseFloat(threeYear))) errs.threeYear = 'Must be a valid number';
    if (fiveYear && isNaN(parseFloat(fiveYear))) errs.fiveYear = 'Must be a valid number';
    if (!rank || isNaN(parseInt(rank)) || parseInt(rank) < 1) errs.rank = 'Valid rank (1+) is required';

    // Skin in the game: if one is filled, both should be
    if (skinAmountCr && !skinPercentOfAum) errs.skinPercentOfAum = 'Required when amount is provided';
    if (skinPercentOfAum && !skinAmountCr) errs.skinAmountCr = 'Required when percentage is provided';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }, [name, fundManager, ageOfFund, aumCr, ter, standardDeviation, sharpeRatio, mtd, ytd, oneYear, twoYear, threeYear, fiveYear, rank, skinAmountCr, skinPercentOfAum]);

  // ── Submit ──

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      const hasSkin = skinAmountCr && parseFloat(skinAmountCr) > 0;

      const fundData: TrustnerCuratedFund = {
        id: fund?.id || generatedId,
        name: name.trim(),
        category: selectedCategory,
        fundManager: fundManager.trim(),
        ageOfFund: parseFloat(ageOfFund),
        aumCr: parseFloat(aumCr),
        ter: parseFloat(ter) / 100,
        standardDeviation: parseFloat(standardDeviation) / 100,
        sharpeRatio: parseFloat(sharpeRatio),
        returns: {
          mtd: mtd ? parseFloat(mtd) / 100 : 0,
          ytd: ytd ? parseFloat(ytd) / 100 : 0,
          oneYear: parseFloat(oneYear) / 100,
          twoYear: twoYear ? parseFloat(twoYear) / 100 : 0,
          threeYear: threeYear ? parseFloat(threeYear) / 100 : 0,
          fiveYear: fiveYear ? parseFloat(fiveYear) / 100 : 0,
        },
        numberOfHoldings: numberOfHoldings ? parseInt(numberOfHoldings) : 0,
        ...(hasSkin
          ? {
              skinInTheGame: {
                amountCr: parseFloat(skinAmountCr),
                percentOfAum: parseFloat(skinPercentOfAum) / 100,
              },
            }
          : {}),
        rank: parseInt(rank),
      };

      onSubmit(fundData);
    },
    [
      validate, fund, generatedId, name, selectedCategory, fundManager, ageOfFund,
      aumCr, ter, standardDeviation, sharpeRatio, mtd, ytd, oneYear, twoYear,
      threeYear, fiveYear, numberOfHoldings, rank, skinAmountCr, skinPercentOfAum, onSubmit,
    ]
  );

  // ── Field helper ──

  const Field = ({
    label,
    value,
    onChange,
    error,
    placeholder,
    type = 'text',
    suffix,
    required,
    className: extraClass,
  }: {
    label: string;
    value: string;
    onChange: (val: string) => void;
    error?: string;
    placeholder?: string;
    type?: string;
    suffix?: string;
    required?: boolean;
    className?: string;
  }) => (
    <div className={cn('space-y-1', extraClass)}>
      <label className="text-xs font-semibold text-slate-600">
        {label}
        {required && <span className="text-negative ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full px-3 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all',
            error ? 'border-negative/50' : 'border-surface-300',
            suffix ? 'pr-8' : ''
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span>
        )}
      </div>
      {error && (
        <p className="flex items-center gap-1 text-[10px] text-negative">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-primary-700">
          {isEdit ? 'Edit Fund' : 'Add New Fund'}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-surface-100 transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="card-base p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Basic Information</h4>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field
            label="Fund Name"
            value={name}
            onChange={setName}
            error={errors.name}
            placeholder="e.g., Nippon India Large Cap Fund (G)"
            required
            className="lg:col-span-2"
          />
          {!isEdit && name && (
            <div className="lg:col-span-2">
              <p className="text-[10px] text-slate-400">
                Generated ID: <span className="font-mono text-brand">{generatedId}</span>
              </p>
            </div>
          )}
          <Field
            label="Fund Manager"
            value={fundManager}
            onChange={setFundManager}
            error={errors.fundManager}
            placeholder="e.g., AKSHAY SHARMA (2022)"
            required
          />
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">
              Category<span className="text-negative ml-0.5">*</span>
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as FundCategory)}
              className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
            >
              {ALL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="card-base p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fund Metrics</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Field
            label="Age of Fund"
            value={ageOfFund}
            onChange={setAgeOfFund}
            error={errors.ageOfFund}
            placeholder="e.g., 18.63"
            type="number"
            suffix="yrs"
            required
          />
          <Field
            label="AUM"
            value={aumCr}
            onChange={setAumCr}
            error={errors.aumCr}
            placeholder="e.g., 50107"
            type="number"
            suffix="Cr"
            required
          />
          <Field
            label="TER"
            value={ter}
            onChange={setTer}
            error={errors.ter}
            placeholder="e.g., 1.48"
            type="number"
            suffix="%"
            required
          />
          <Field
            label="Std Deviation"
            value={standardDeviation}
            onChange={setStandardDeviation}
            error={errors.standardDeviation}
            placeholder="e.g., 19.72"
            type="number"
            suffix="%"
            required
          />
          <Field
            label="Sharpe Ratio"
            value={sharpeRatio}
            onChange={setSharpeRatio}
            error={errors.sharpeRatio}
            placeholder="e.g., 0.36"
            type="number"
            required
          />
          <Field
            label="No. of Holdings"
            value={numberOfHoldings}
            onChange={setNumberOfHoldings}
            error={errors.numberOfHoldings}
            placeholder="e.g., 73"
            type="number"
          />
          <Field
            label="Rank"
            value={rank}
            onChange={setRank}
            error={errors.rank}
            placeholder="1"
            type="number"
            required
          />
        </div>
      </div>

      {/* Returns */}
      <div className="card-base p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Returns <span className="text-slate-400 normal-case font-normal">(enter as percentages, e.g., 14.8 for 14.8%)</span>
        </h4>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Field
            label="MTD"
            value={mtd}
            onChange={setMtd}
            error={errors.mtd}
            placeholder="e.g., -1.15"
            type="number"
            suffix="%"
          />
          <Field
            label="YTD"
            value={ytd}
            onChange={setYtd}
            error={errors.ytd}
            placeholder="e.g., -2.06"
            type="number"
            suffix="%"
          />
          <Field
            label="1 Year"
            value={oneYear}
            onChange={setOneYear}
            error={errors.oneYear}
            placeholder="e.g., 15.84"
            type="number"
            suffix="%"
            required
          />
          <Field
            label="2 Year"
            value={twoYear}
            onChange={setTwoYear}
            error={errors.twoYear}
            placeholder="e.g., 9.57"
            type="number"
            suffix="%"
          />
          <Field
            label="3 Year"
            value={threeYear}
            onChange={setThreeYear}
            error={errors.threeYear}
            placeholder="e.g., 19.61"
            type="number"
            suffix="%"
          />
          <Field
            label="5 Year"
            value={fiveYear}
            onChange={setFiveYear}
            error={errors.fiveYear}
            placeholder="e.g., 17.54"
            type="number"
            suffix="%"
          />
        </div>
      </div>

      {/* Skin in the Game (Optional) */}
      <div className="card-base p-5 space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Skin in the Game <span className="text-slate-400 normal-case font-normal">(optional)</span>
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Amount"
            value={skinAmountCr}
            onChange={setSkinAmountCr}
            error={errors.skinAmountCr}
            placeholder="e.g., 12.25"
            type="number"
            suffix="Cr"
          />
          <Field
            label="% of AUM"
            value={skinPercentOfAum}
            onChange={setSkinPercentOfAum}
            error={errors.skinPercentOfAum}
            placeholder="e.g., 0.0244"
            type="number"
            suffix="%"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-surface-200 hover:bg-surface-300 transition-all"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-700 shadow-sm transition-all"
        >
          <Save className="w-4 h-4" />
          {isEdit ? 'Update Fund' : 'Add Fund'}
        </button>
      </div>
    </form>
  );
}
