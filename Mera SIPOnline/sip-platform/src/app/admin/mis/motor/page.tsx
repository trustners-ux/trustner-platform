'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Car, Bike, Truck, Calculator, Layers, BarChart3,
  Upload, Download, FileSpreadsheet, CheckCircle, AlertTriangle,
  X, Loader2, IndianRupee, Shield, TrendingUp, Search,
  ChevronDown, ArrowUpDown, Eye, Percent, Building2,
} from 'lucide-react';
import { formatINR } from '@/lib/mis/incentive-engine';
import {
  calculateMotorCommission,
  getAvailableInsurers,
  getAvailableProductLines,
  getGridGroupedByProductLine,
  lookupCommissionRate,
  deriveProductLine,
  getInsurersForProductLine,
  type MotorPolicyInput,
  type MotorCalculationResult,
} from '@/lib/utils/motor-calc';
import {
  ALL_POSP_CATEGORIES,
  POSP_CATEGORIES,
  DEFAULT_POSP_GRID,
  type POSPCategory,
} from '@/lib/mis/types';

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

type TabId = 'calculator' | 'grid' | 'batch';

interface BatchRow {
  id: number;
  policyNumber: string;
  vehicleType: 'Two Wheeler' | 'Private Car' | 'Commercial Vehicle';
  totalPremium: number;
  odPremium: number;
  tpPremium: number;
  insurer: string;
  category: POSPCategory;
  channelType: 'POSP' | 'BQP' | 'Franchise' | 'Direct';
  result?: MotorCalculationResult;
  error?: string;
}

// ═══════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════

const VEHICLE_TYPES = ['Two Wheeler', 'Private Car', 'Commercial Vehicle'] as const;
const REGIONS = ['Metro', 'Non-Metro', 'All India'] as const;
const CHANNEL_TYPES = ['POSP', 'BQP', 'Franchise', 'Direct'] as const;

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  'Two Wheeler': Bike,
  'Private Car': Car,
  'Commercial Vehicle': Truck,
};

const TAB_CONFIG: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'calculator', label: 'Motor Calculator', icon: Calculator },
  { id: 'grid', label: 'Commission Rate Grid', icon: Layers },
  { id: 'batch', label: 'Batch Processing', icon: FileSpreadsheet },
];

// ═══════════════════════════════════════════════════════
// HELPER COMPONENTS
// ═══════════════════════════════════════════════════════

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
      type === 'success' ? 'bg-emerald-600 text-white' : type === 'error' ? 'bg-red-600 text-white' : 'bg-blue-600 text-white'
    }`}>
      {type === 'success' ? <CheckCircle className="w-4 h-4" /> : type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70"><X className="w-3.5 h-3.5" /></button>
    </div>
  );
}

function fmtINR(n: number): string {
  if (n >= 10000000) return `\u20B9${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `\u20B9${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `\u20B9${(n / 1000).toFixed(1)}K`;
  return `\u20B9${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function fmtPct(n: number): string {
  return `${n.toFixed(2)}%`;
}

function StatCard({ label, value, icon: Icon, color, subtext }: {
  label: string; value: string; icon: React.ElementType; color: string; subtext?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
          {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`p-2.5 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors';
const selectClass = `${inputClass} bg-white`;
const readOnlyClass = 'w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed';

// ═══════════════════════════════════════════════════════
// PIE CHART (SVG)
// ═══════════════════════════════════════════════════════

function CommissionPieChart({ result }: { result: MotorCalculationResult }) {
  const gross = result.grossCommission;
  if (gross <= 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No commission to display
      </div>
    );
  }

  const slices: { label: string; value: number; color: string }[] = [];

  if (result.channelPayout > 0) {
    slices.push({ label: 'Channel Payout', value: result.channelPayout, color: '#3b82f6' });
  }
  if (result.franchisePayout > 0) {
    slices.push({ label: 'Franchise', value: result.franchisePayout, color: '#f59e0b' });
  }
  if (result.companyRetention > 0) {
    slices.push({ label: 'Company', value: result.companyRetention, color: '#10b981' });
  }

  if (slices.length === 0) return null;

  const total = slices.reduce((s, sl) => s + sl.value, 0);
  let cumAngle = 0;
  const cx = 80, cy = 80, r = 70;

  const paths = slices.map((slice, i) => {
    const pct = slice.value / total;
    const angle = pct * 360;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const startRad = ((startAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const largeArc = angle > 180 ? 1 : 0;

    // Single slice = full circle
    if (pct >= 0.999) {
      return (
        <circle key={i} cx={cx} cy={cy} r={r} fill={slice.color} />
      );
    }

    return (
      <path
        key={i}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
        fill={slice.color}
        stroke="white"
        strokeWidth="2"
      />
    );
  });

  return (
    <div className="flex items-center gap-6">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {paths}
        <circle cx={cx} cy={cy} r="35" fill="white" />
        <text x={cx} y={cy - 4} textAnchor="middle" className="text-xs fill-slate-500">Total</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="text-sm font-bold fill-slate-800">{fmtINR(gross)}</text>
      </svg>
      <div className="space-y-2">
        {slices.map((sl, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: sl.color }} />
            <span className="text-slate-600">{sl.label}</span>
            <span className="font-semibold text-slate-800 ml-auto">{fmtINR(sl.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 1: MOTOR CALCULATOR
// ═══════════════════════════════════════════════════════

function MotorCalculatorTab() {
  const [vehicleType, setVehicleType] = useState<'Two Wheeler' | 'Private Car' | 'Commercial Vehicle'>('Private Car');
  const [totalPremium, setTotalPremium] = useState<number>(25000);
  const [odPremium, setOdPremium] = useState<number>(15000);
  const [region, setRegion] = useState<'Metro' | 'Non-Metro' | 'All India'>('All India');
  const [insurer, setInsurer] = useState<string>('');
  const [channelType, setChannelType] = useState<'POSP' | 'BQP' | 'Franchise' | 'Direct'>('POSP');
  const [pospCategory, setPospCategory] = useState<POSPCategory>('C');
  const [franchisePct, setFranchisePct] = useState<number>(85);

  // Derived TP
  const tpPremium = Math.max(0, totalPremium - odPremium);

  // Available insurers based on vehicle type + region
  const productLine = useMemo(() => deriveProductLine(vehicleType, region), [vehicleType, region]);
  const availableInsurers = useMemo(() => getInsurersForProductLine(productLine), [productLine]);

  // Auto-select first insurer when product line changes
  useEffect(() => {
    if (availableInsurers.length > 0 && !availableInsurers.includes(insurer)) {
      setInsurer(availableInsurers[0]);
    }
  }, [availableInsurers, insurer]);

  // Live calculation
  const result = useMemo<MotorCalculationResult | null>(() => {
    if (totalPremium <= 0 || odPremium < 0 || !insurer) return null;
    return calculateMotorCommission({
      totalPremium,
      odPremium,
      tpPremium,
      vehicleType,
      region,
      insurer,
      pospCategory: channelType === 'POSP' ? pospCategory : channelType === 'Franchise' ? pospCategory : undefined,
      channelType,
      franchiseAgreementPct: channelType === 'Franchise' ? franchisePct : undefined,
    });
  }, [totalPremium, odPremium, tpPremium, vehicleType, region, insurer, channelType, pospCategory, franchisePct]);

  const VehicleIcon = VEHICLE_ICONS[vehicleType] || Car;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Input Form */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50">
              <VehicleIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Policy Details</h3>
              <p className="text-xs text-slate-500">Enter motor policy information for commission calculation</p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Vehicle Type */}
          <Field label="Vehicle Type">
            <div className="grid grid-cols-3 gap-2">
              {VEHICLE_TYPES.map(vt => {
                const Icon = VEHICLE_ICONS[vt] || Car;
                const isActive = vehicleType === vt;
                return (
                  <button
                    key={vt}
                    onClick={() => setVehicleType(vt)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate text-xs">{vt}</span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* Premium Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Total Premium" hint="Including OD + TP">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400">&#8377;</span>
                <input
                  type="number"
                  value={totalPremium || ''}
                  onChange={e => {
                    const val = Number(e.target.value);
                    setTotalPremium(val);
                    if (odPremium > val) setOdPremium(val);
                  }}
                  className={`${inputClass} pl-7`}
                  min={0}
                  placeholder="25,000"
                />
              </div>
            </Field>
            <Field label="OD Premium" hint="Commission base">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400">&#8377;</span>
                <input
                  type="number"
                  value={odPremium || ''}
                  onChange={e => setOdPremium(Math.min(Number(e.target.value), totalPremium))}
                  className={`${inputClass} pl-7`}
                  min={0}
                  max={totalPremium}
                  placeholder="15,000"
                />
              </div>
            </Field>
            <Field label="TP Premium" hint="0% commission (IRDAI)">
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-slate-400">&#8377;</span>
                <input
                  type="number"
                  value={tpPremium}
                  readOnly
                  className={`${readOnlyClass} pl-7`}
                />
              </div>
            </Field>
          </div>

          {/* Region */}
          <Field label="Region">
            <select
              value={region}
              onChange={e => setRegion(e.target.value as 'Metro' | 'Non-Metro' | 'All India')}
              className={selectClass}
            >
              {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>

          {/* Insurer */}
          <Field label="Insurer" hint={`Product Line: ${productLine}`}>
            <select
              value={insurer}
              onChange={e => setInsurer(e.target.value)}
              className={selectClass}
            >
              {availableInsurers.length === 0 && (
                <option value="">No insurers for this combination</option>
              )}
              {availableInsurers.map(ins => <option key={ins} value={ins}>{ins}</option>)}
            </select>
          </Field>

          {/* Channel Type */}
          <Field label="Channel Type">
            <div className="grid grid-cols-4 gap-2">
              {CHANNEL_TYPES.map(ct => (
                <button
                  key={ct}
                  onClick={() => setChannelType(ct)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    channelType === ct
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {ct}
                </button>
              ))}
            </div>
          </Field>

          {/* POSP Category (for POSP or Franchise) */}
          {(channelType === 'POSP' || channelType === 'Franchise') && (
            <Field label="POSP Category" hint="Determines channel payout percentage">
              <select
                value={pospCategory}
                onChange={e => setPospCategory(e.target.value as POSPCategory)}
                className={selectClass}
              >
                {ALL_POSP_CATEGORIES.map(cat => {
                  const config = POSP_CATEGORIES.find(c => c.category === cat);
                  return (
                    <option key={cat} value={cat}>
                      {cat} — {config?.description ?? cat}
                    </option>
                  );
                })}
              </select>
            </Field>
          )}

          {/* Franchise Agreement % */}
          {channelType === 'Franchise' && (
            <Field label="Franchise Agreement %" hint="Typically 80-90%">
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={80}
                  max={95}
                  step={1}
                  value={franchisePct}
                  onChange={e => setFranchisePct(Number(e.target.value))}
                  className="flex-1 accent-blue-600"
                />
                <span className="text-sm font-semibold text-slate-700 w-12 text-right">{franchisePct}%</span>
              </div>
            </Field>
          )}
        </div>
      </div>

      {/* Right: Live Results */}
      <div className="space-y-4">
        {result ? (
          <>
            {/* Commission Breakdown Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-50">
                    <IndianRupee className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">Commission Breakdown</h3>
                    <p className="text-xs text-slate-500">
                      {fmtPct(result.commissionRate)} on OD of {fmtINR(result.odPremium)} | TP: {fmtINR(result.tpPremium)} (0% commission)
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-3">
                {/* Gross Commission */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Gross Commission</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-600">{fmtINR(result.grossCommission)}</span>
                    <span className="text-xs text-slate-400 ml-2">({fmtPct(result.commissionRate)} on OD)</span>
                  </div>
                </div>

                {/* Channel Payout */}
                {result.channelPayout > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">
                      {channelType === 'POSP' ? `POSP Payout (Cat ${pospCategory})` : `${channelType} Payout`}
                    </span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-blue-600">{fmtINR(result.channelPayout)}</span>
                      <span className="text-xs text-slate-400 ml-2">({fmtPct(result.channelPayoutPct)})</span>
                    </div>
                  </div>
                )}

                {/* Franchise Differential */}
                {result.franchisePayout > 0 && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-100">
                    <span className="text-sm text-slate-600">Franchise Differential</span>
                    <div className="text-right">
                      <span className="text-lg font-bold text-amber-600">{fmtINR(result.franchisePayout)}</span>
                      <span className="text-xs text-slate-400 ml-2">({fmtPct(result.franchiseDifferentialPct)})</span>
                    </div>
                  </div>
                )}

                {/* Company Retention */}
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-slate-700">Company Retains</span>
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-700">{fmtINR(result.companyRetention)}</span>
                    <span className="text-xs text-slate-400 ml-2">({fmtPct(result.companyRetentionPct)})</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie Chart Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
              <h4 className="text-sm font-semibold text-slate-700 mb-4">Commission Split</h4>
              <CommissionPieChart result={result} />
            </div>

            {/* Incentive Weightage Card */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border border-slate-200 p-5">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <h4 className="text-sm font-semibold text-slate-700">Incentive Weightage</h4>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Product Tier</p>
                  <p className="text-xl font-bold text-slate-800">Tier {result.productTier}</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Weightage</p>
                  <p className="text-xl font-bold text-amber-600">{result.weightage}%</p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-500 mb-1">Weighted Business</p>
                  <p className="text-xl font-bold text-blue-600">{fmtINR(result.weightedBusiness)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">
                Motor = Tier 3 (50% weightage). Weighted = Total Premium x 50%
              </p>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
            <Calculator className="w-12 h-12 text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-600 mb-1">Enter Policy Details</h3>
            <p className="text-sm text-slate-400">Fill in the form on the left to see the live commission breakdown</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 2: COMMISSION RATE GRID
// ═══════════════════════════════════════════════════════

function CommissionGridTab() {
  const [selectedProductLine, setSelectedProductLine] = useState<string>('');
  const [searchInsurer, setSearchInsurer] = useState('');

  const productLines = useMemo(() => getAvailableProductLines(), []);
  const grouped = useMemo(() => getGridGroupedByProductLine(), []);

  // Auto-select first product line
  useEffect(() => {
    if (productLines.length > 0 && !selectedProductLine) {
      setSelectedProductLine(productLines[0]);
    }
  }, [productLines, selectedProductLine]);

  // Get entries for selected product line
  const entries = useMemo(() => {
    if (!selectedProductLine) return [];
    return (grouped[selectedProductLine] || []).filter(g => {
      if (searchInsurer) {
        return g.insurer.toLowerCase().includes(searchInsurer.toLowerCase());
      }
      return true;
    });
  }, [grouped, selectedProductLine, searchInsurer]);

  // Get unique insurers for this product line
  const insurers = useMemo(() => {
    const set = new Set<string>();
    (grouped[selectedProductLine] || []).forEach(e => set.add(e.insurer));
    return Array.from(set).sort();
  }, [grouped, selectedProductLine]);

  // Color scale for commission rates
  function getRateColor(pct: number): string {
    if (pct >= 20) return 'bg-emerald-100 text-emerald-800 font-bold';
    if (pct >= 18) return 'bg-emerald-50 text-emerald-700 font-semibold';
    if (pct >= 15) return 'bg-green-50 text-green-700';
    if (pct >= 12) return 'bg-lime-50 text-lime-700';
    if (pct >= 10) return 'bg-yellow-50 text-yellow-700';
    if (pct >= 8) return 'bg-amber-50 text-amber-700';
    return 'bg-slate-50 text-slate-600';
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row gap-4">
          <Field label="Product Line">
            <select
              value={selectedProductLine}
              onChange={e => setSelectedProductLine(e.target.value)}
              className={selectClass}
            >
              {productLines.map(pl => (
                <option key={pl} value={pl}>{pl}</option>
              ))}
            </select>
          </Field>
          <Field label="Search Insurer">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchInsurer}
                onChange={e => setSearchInsurer(e.target.value)}
                placeholder="Filter by insurer..."
                className={`${inputClass} pl-9`}
              />
            </div>
          </Field>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider sticky left-0 bg-slate-50 z-10">
                  Category
                </th>
                {insurers.map(ins => (
                  <th key={ins} className="text-center px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider min-w-[130px]">
                    {ins}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_POSP_CATEGORIES.map((cat, ri) => {
                const catConfig = POSP_CATEGORIES.find(c => c.category === cat);
                return (
                  <tr
                    key={cat}
                    className={`border-b border-slate-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                  >
                    <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          cat === 'F2' ? 'bg-purple-100 text-purple-700' :
                          cat === 'F1' ? 'bg-rose-100 text-rose-700' :
                          cat.startsWith('E') ? 'bg-amber-100 text-amber-700' :
                          cat.startsWith('D') ? 'bg-emerald-100 text-emerald-700' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {cat}
                        </span>
                        <span className="text-xs text-slate-500 hidden sm:inline">{catConfig?.description}</span>
                      </div>
                    </td>
                    {insurers.map(ins => {
                      const rate = lookupCommissionRate(cat, selectedProductLine, ins);
                      return (
                        <td key={ins} className="px-4 py-3 text-center">
                          {rate > 0 ? (
                            <span className={`inline-block px-2.5 py-1 rounded-md text-xs ${getRateColor(rate)}`}>
                              {rate.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300">--</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="font-medium">Rate scale:</span>
            <span className="px-2 py-0.5 rounded bg-slate-50 text-slate-600">&lt;8%</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700">8-10%</span>
            <span className="px-2 py-0.5 rounded bg-yellow-50 text-yellow-700">10-12%</span>
            <span className="px-2 py-0.5 rounded bg-lime-50 text-lime-700">12-15%</span>
            <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">15-18%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">18-20%</span>
            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">20%+</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Product Lines"
          value={String(productLines.length)}
          icon={Layers}
          color="bg-blue-500"
        />
        <StatCard
          label="Insurers"
          value={String(getAvailableInsurers().length)}
          icon={Building2}
          color="bg-purple-500"
        />
        <StatCard
          label="Categories"
          value={String(ALL_POSP_CATEGORIES.length)}
          icon={Shield}
          color="bg-emerald-500"
        />
        <StatCard
          label="Grid Entries"
          value={String(DEFAULT_POSP_GRID.filter(g => g.isActive).length)}
          icon={BarChart3}
          color="bg-amber-500"
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// TAB 3: BATCH MOTOR PROCESSING
// ═══════════════════════════════════════════════════════

function BatchProcessingTab() {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter(l => l.trim());
        if (lines.length < 2) {
          setToast({ message: 'CSV must have a header row and at least one data row', type: 'error' });
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());

        // Expected headers: policy_number, vehicle_type, total_premium, od_premium, tp_premium, insurer, category, channel_type
        const policyIdx = headers.findIndex(h => h.includes('policy'));
        const vehicleIdx = headers.findIndex(h => h.includes('vehicle'));
        const totalIdx = headers.findIndex(h => h.includes('total'));
        const odIdx = headers.findIndex(h => h.includes('od'));
        const tpIdx = headers.findIndex(h => h.includes('tp'));
        const insurerIdx = headers.findIndex(h => h.includes('insurer'));
        const catIdx = headers.findIndex(h => h.includes('categ'));
        const channelIdx = headers.findIndex(h => h.includes('channel'));

        const parsed: BatchRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.trim());
          if (cols.length < 4) continue;

          const vehicleRaw = vehicleIdx >= 0 ? cols[vehicleIdx] : 'Private Car';
          let vehicleType: 'Two Wheeler' | 'Private Car' | 'Commercial Vehicle' = 'Private Car';
          if (vehicleRaw.toLowerCase().includes('two') || vehicleRaw.toLowerCase().includes('tw') || vehicleRaw.toLowerCase().includes('bike')) {
            vehicleType = 'Two Wheeler';
          } else if (vehicleRaw.toLowerCase().includes('commercial') || vehicleRaw.toLowerCase().includes('cv') || vehicleRaw.toLowerCase().includes('truck')) {
            vehicleType = 'Commercial Vehicle';
          }

          const totalPremium = totalIdx >= 0 ? parseFloat(cols[totalIdx]) || 0 : 0;
          const odPremium = odIdx >= 0 ? parseFloat(cols[odIdx]) || 0 : 0;
          const tpPremium = tpIdx >= 0 ? parseFloat(cols[tpIdx]) || 0 : Math.max(0, totalPremium - odPremium);
          const insurerVal = insurerIdx >= 0 ? cols[insurerIdx] : '';

          const catRaw = catIdx >= 0 ? cols[catIdx]?.toUpperCase() : 'C';
          const category = (ALL_POSP_CATEGORIES.includes(catRaw as POSPCategory) ? catRaw : 'C') as POSPCategory;

          const channelRaw = channelIdx >= 0 ? cols[channelIdx] : 'POSP';
          let channelType: 'POSP' | 'BQP' | 'Franchise' | 'Direct' = 'POSP';
          if (channelRaw.toLowerCase().includes('bqp')) channelType = 'BQP';
          else if (channelRaw.toLowerCase().includes('franch')) channelType = 'Franchise';
          else if (channelRaw.toLowerCase().includes('direct')) channelType = 'Direct';

          parsed.push({
            id: i,
            policyNumber: policyIdx >= 0 ? cols[policyIdx] : `POL-${String(i).padStart(4, '0')}`,
            vehicleType,
            totalPremium,
            odPremium,
            tpPremium,
            insurer: insurerVal,
            category,
            channelType,
          });
        }

        setRows(parsed);
        setProcessed(false);
        setToast({ message: `Loaded ${parsed.length} rows from CSV`, type: 'success' });
      } catch {
        setToast({ message: 'Failed to parse CSV file', type: 'error' });
      }
    };
    reader.readAsText(file);

    // Reset input so same file can be re-uploaded
    if (e.target) e.target.value = '';
  }, []);

  const handleProcessAll = useCallback(() => {
    setProcessing(true);
    setTimeout(() => {
      const updated = rows.map(row => {
        try {
          const result = calculateMotorCommission({
            totalPremium: row.totalPremium,
            odPremium: row.odPremium,
            tpPremium: row.tpPremium,
            vehicleType: row.vehicleType,
            region: 'All India',
            insurer: row.insurer,
            pospCategory: row.channelType === 'POSP' || row.channelType === 'Franchise' ? row.category : undefined,
            channelType: row.channelType,
          });
          return { ...row, result, error: undefined };
        } catch (err) {
          return { ...row, error: 'Calculation failed — check insurer and vehicle type match' };
        }
      });
      setRows(updated);
      setProcessed(true);
      setProcessing(false);
      const successCount = updated.filter(r => r.result).length;
      const errorCount = updated.filter(r => r.error).length;
      setToast({
        message: `Processed ${successCount} policies${errorCount > 0 ? `, ${errorCount} errors` : ''}`,
        type: errorCount > 0 ? 'info' : 'success',
      });
    }, 500);
  }, [rows]);

  const handleDownloadResults = useCallback(() => {
    if (rows.length === 0) return;
    const header = 'Policy#,Vehicle,Total Premium,OD Premium,TP Premium,Insurer,Category,Channel,Commission Rate,Gross Commission,Channel Payout,Franchise Payout,Company Retention\n';
    const csvRows = rows.map(r => {
      const res = r.result;
      return [
        r.policyNumber,
        r.vehicleType,
        r.totalPremium,
        r.odPremium,
        r.tpPremium,
        r.insurer,
        r.category,
        r.channelType,
        res?.commissionRate ?? '',
        res?.grossCommission ?? '',
        res?.channelPayout ?? '',
        res?.franchisePayout ?? '',
        res?.companyRetention ?? '',
      ].join(',');
    }).join('\n');

    const blob = new Blob([header + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `motor-commission-batch-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const handleDownloadTemplate = useCallback(() => {
    const template = 'policy_number,vehicle_type,total_premium,od_premium,tp_premium,insurer,category,channel_type\n';
    const sample = 'POL-0001,Private Car,25000,15000,10000,ICICI Lombard,C,POSP\nPOL-0002,Two Wheeler,8000,5000,3000,Bajaj Allianz,B,POSP\n';
    const blob = new Blob([template + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'motor-batch-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Totals
  const totals = useMemo(() => {
    if (!processed) return null;
    const processedRows = rows.filter(r => r.result);
    return {
      totalPremium: processedRows.reduce((s, r) => s + (r.result?.totalPremium ?? 0), 0),
      grossCommission: processedRows.reduce((s, r) => s + (r.result?.grossCommission ?? 0), 0),
      channelPayout: processedRows.reduce((s, r) => s + (r.result?.channelPayout ?? 0), 0),
      franchisePayout: processedRows.reduce((s, r) => s + (r.result?.franchisePayout ?? 0), 0),
      companyRetention: processedRows.reduce((s, r) => s + (r.result?.companyRetention ?? 0), 0),
      count: processedRows.length,
    };
  }, [rows, processed]);

  return (
    <div className="space-y-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Upload Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-800">Upload Motor Policies</h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload a CSV with columns: policy_number, vehicle_type, total_premium, od_premium, tp_premium, insurer, category, channel_type
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        </div>
      </div>

      {/* Totals Summary (after processing) */}
      {totals && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Policies" value={String(totals.count)} icon={FileSpreadsheet} color="bg-blue-500" />
          <StatCard label="Total Premium" value={fmtINR(totals.totalPremium)} icon={IndianRupee} color="bg-slate-600" />
          <StatCard label="Gross Commission" value={fmtINR(totals.grossCommission)} icon={TrendingUp} color="bg-emerald-500" />
          <StatCard label="Channel Payout" value={fmtINR(totals.channelPayout)} icon={Percent} color="bg-blue-500" />
          <StatCard label="Company Retains" value={fmtINR(totals.companyRetention)} icon={Building2} color="bg-purple-500" />
        </div>
      )}

      {/* Preview Table */}
      {rows.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
            <span className="text-sm font-semibold text-slate-700">{rows.length} Motor Policies</span>
            <div className="flex items-center gap-2">
              {processed && (
                <button
                  onClick={handleDownloadResults}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download Results
                </button>
              )}
              <button
                onClick={handleProcessAll}
                disabled={processing}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors shadow-sm ${
                  processing ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {processed ? 'Re-Process All' : 'Process All'}
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Policy #</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Vehicle</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Premium</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">OD</th>
                  <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">TP</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Insurer</th>
                  <th className="text-center px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Cat</th>
                  {processed && (
                    <>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Commission</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Channel</th>
                      <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">Company</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const VIcon = VEHICLE_ICONS[row.vehicleType] || Car;
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-slate-100 ${
                        row.error ? 'bg-red-50' : i % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      }`}
                    >
                      <td className="px-4 py-2.5 text-xs font-mono text-slate-700">{row.policyNumber}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1.5">
                          <VIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs text-slate-600">{row.vehicleType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right text-xs font-medium text-slate-700">{fmtINR(row.totalPremium)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-600">{fmtINR(row.odPremium)}</td>
                      <td className="px-4 py-2.5 text-right text-xs text-slate-400">{fmtINR(row.tpPremium)}</td>
                      <td className="px-4 py-2.5 text-xs text-slate-600">{row.insurer}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700">
                          {row.category}
                        </span>
                      </td>
                      {processed && (
                        <>
                          <td className="px-4 py-2.5 text-right">
                            {row.result ? (
                              <span className="text-xs font-semibold text-emerald-600">
                                {fmtINR(row.result.grossCommission)}
                                <span className="text-slate-400 font-normal ml-1">({fmtPct(row.result.commissionRate)})</span>
                              </span>
                            ) : (
                              <span className="text-xs text-red-500">{row.error || 'Error'}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-blue-600">
                            {row.result ? fmtINR(row.result.channelPayout + row.result.franchisePayout) : '--'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs font-medium text-emerald-700">
                            {row.result ? fmtINR(row.result.companyRetention) : '--'}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              {/* Totals footer */}
              {processed && totals && (
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-300 font-semibold">
                    <td className="px-4 py-3 text-xs text-slate-700" colSpan={2}>TOTALS</td>
                    <td className="px-4 py-3 text-right text-xs text-slate-800">{fmtINR(totals.totalPremium)}</td>
                    <td className="px-4 py-3" colSpan={4}></td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-700">{fmtINR(totals.grossCommission)}</td>
                    <td className="px-4 py-3 text-right text-xs text-blue-700">{fmtINR(totals.channelPayout + totals.franchisePayout)}</td>
                    <td className="px-4 py-3 text-right text-xs text-emerald-800">{fmtINR(totals.companyRetention)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {rows.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <FileSpreadsheet className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-600 mb-1">No Policies Loaded</h3>
          <p className="text-sm text-slate-400 mb-4">
            Upload a CSV file with motor policy data to batch-calculate commissions
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download Template
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════

export default function MotorInsurancePage() {
  const [activeTab, setActiveTab] = useState<TabId>('calculator');

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
              <Car className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Motor Insurance Module</h1>
              <p className="text-sm text-slate-500">Commission calculator, rate grid, and batch processing</p>
            </div>
            <div className="ml-auto hidden sm:flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                Tier 3 — 50% Weightage
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-600">
                TP = 0% Commission
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <nav className="flex gap-1 overflow-x-auto -mb-px">
            {TAB_CONFIG.map(tab => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'calculator' && <MotorCalculatorTab />}
        {activeTab === 'grid' && <CommissionGridTab />}
        {activeTab === 'batch' && <BatchProcessingTab />}
      </div>
    </div>
  );
}
