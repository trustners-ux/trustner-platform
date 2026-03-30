'use client';

import { useState, useCallback } from 'react';
import {
  Upload, ClipboardPaste, Eye, AlertTriangle, CheckCircle2, X,
  ArrowRight, Table2, FileSpreadsheet,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { TrustnerCuratedFund, FundCategory } from '@/types/funds';

// ─── Column mapping definitions ───

interface ColumnMapping {
  field: keyof MappableFields;
  label: string;
  required: boolean;
}

interface MappableFields {
  name: string;
  fundManager: string;
  ageOfFund: string;
  aumCr: string;
  ter: string;
  standardDeviation: string;
  sharpeRatio: string;
  mtd: string;
  ytd: string;
  oneYear: string;
  twoYear: string;
  threeYear: string;
  fiveYear: string;
  numberOfHoldings: string;
  skinAmountCr: string;
  skinPercentOfAum: string;
}

const EXPECTED_COLUMNS: ColumnMapping[] = [
  { field: 'name', label: 'NAME', required: true },
  { field: 'fundManager', label: 'FUND MANAGER', required: true },
  { field: 'ageOfFund', label: 'AGE OF FUND', required: true },
  { field: 'aumCr', label: 'AUM (in Cr.)', required: true },
  { field: 'ter', label: 'TER', required: true },
  { field: 'standardDeviation', label: 'SD (Std Dev)', required: true },
  { field: 'sharpeRatio', label: 'SHARPE RATIO', required: true },
  { field: 'mtd', label: 'MTD', required: true },
  { field: 'ytd', label: 'YTD', required: true },
  { field: 'oneYear', label: '1 YEAR', required: true },
  { field: 'twoYear', label: '2 YEAR', required: false },
  { field: 'threeYear', label: '3 YEAR', required: false },
  { field: 'fiveYear', label: '5 YEAR', required: false },
  { field: 'numberOfHoldings', label: 'NO. OF HOLDINGS', required: false },
  { field: 'skinAmountCr', label: 'SKIN IN THE GAME AMT (in Cr.)', required: false },
  { field: 'skinPercentOfAum', label: 'SKIN % OF AUM', required: false },
];

// ─── Auto-detection patterns ───

const HEADER_PATTERNS: Record<keyof MappableFields, RegExp> = {
  name: /^(name|fund\s*name|scheme\s*name)$/i,
  fundManager: /^(fund\s*manager|manager|fm)$/i,
  ageOfFund: /^(age|age\s*of\s*fund|fund\s*age|vintage)$/i,
  aumCr: /^(aum|aum\s*\(in\s*cr\.?\)|aum\s*cr|corpus)$/i,
  ter: /^(ter|expense\s*ratio|total\s*expense\s*ratio)$/i,
  standardDeviation: /^(sd|std\s*dev|standard\s*deviation|sd\s*\(std\s*dev\))$/i,
  sharpeRatio: /^(sharpe|sharpe\s*ratio)$/i,
  mtd: /^(mtd|month\s*to\s*date)$/i,
  ytd: /^(ytd|year\s*to\s*date)$/i,
  oneYear: /^(1\s*year|1y|1\s*yr|one\s*year)$/i,
  twoYear: /^(2\s*year|2y|2\s*yr|two\s*year)$/i,
  threeYear: /^(3\s*year|3y|3\s*yr|three\s*year)$/i,
  fiveYear: /^(5\s*year|5y|5\s*yr|five\s*year)$/i,
  numberOfHoldings: /^(no\.?\s*of\s*holdings|holdings|num\s*holdings|#\s*holdings)$/i,
  skinAmountCr: /^(skin\s*in\s*the\s*game\s*amt|skin\s*amt|sitg\s*amt|skin\s*in\s*the\s*game\s*amt\s*\(in\s*cr\.?\))$/i,
  skinPercentOfAum: /^(skin\s*%\s*of\s*aum|skin\s*%|sitg\s*%|skin\s*percent)$/i,
};

// ─── Utility functions ───

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function parsePercentage(value: string): number {
  if (!value || value.trim() === '' || value.trim() === '-' || value.trim() === 'NA') return 0;
  const cleaned = value.replace(/%/g, '').replace(/,/g, '').trim();
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  // If the value contained a % sign or looks like a percentage (e.g. "14.8"),
  // convert to decimal form
  return num / 100;
}

function parseNumber(value: string): number {
  if (!value || value.trim() === '' || value.trim() === '-' || value.trim() === 'NA') return 0;
  const cleaned = value.replace(/,/g, '').replace(/%/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// ─── Types ───

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ParsedRow {
  data: Record<keyof MappableFields, string>;
  rowIndex: number;
}

interface FundBulkImportProps {
  onImport: (funds: TrustnerCuratedFund[], category: FundCategory) => void;
  defaultCategory?: FundCategory;
}

// ─── Component ───

export function FundBulkImport({ onImport, defaultCategory }: FundBulkImportProps) {
  const [rawText, setRawText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [columnMap, setColumnMap] = useState<Record<number, keyof MappableFields | ''>>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [step, setStep] = useState<'paste' | 'map' | 'preview'>('paste');
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>(defaultCategory || 'Large Cap');

  const ALL_CATEGORIES: FundCategory[] = [
    'Large Cap', 'Large & Mid Cap', 'Mid Cap', 'Small Cap', 'Flexi Cap',
    'Multi Cap', 'Value', 'Contra', 'Multi Asset', 'Balanced Advantage',
    'Aggressive Hybrid', 'Equity Savings', 'Conservative Hybrid',
    'Gold & Silver', 'Fund of Fund',
  ];

  // ── Parse pasted text ──

  const handleParse = useCallback(() => {
    if (!rawText.trim()) return;

    const lines = rawText.trim().split('\n').map((line) => line.split('\t'));
    if (lines.length < 2) {
      setErrors([{ row: 0, field: '', message: 'Need at least a header row and one data row' }]);
      return;
    }

    const headerRow = lines[0].map((h) => h.trim());
    setHeaders(headerRow);

    // Auto-detect column mapping
    const autoMap: Record<number, keyof MappableFields | ''> = {};
    headerRow.forEach((header, colIdx) => {
      for (const [field, pattern] of Object.entries(HEADER_PATTERNS)) {
        if (pattern.test(header.trim())) {
          autoMap[colIdx] = field as keyof MappableFields;
          break;
        }
      }
      if (!autoMap[colIdx]) {
        autoMap[colIdx] = '';
      }
    });

    setColumnMap(autoMap);

    // Parse data rows
    const rows: ParsedRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i];
      if (cells.length === 1 && cells[0].trim() === '') continue; // skip empty rows

      const data = {} as Record<keyof MappableFields, string>;
      for (const col of EXPECTED_COLUMNS) {
        data[col.field] = '';
      }

      cells.forEach((cell, colIdx) => {
        const mappedField = autoMap[colIdx];
        if (mappedField) {
          data[mappedField] = cell.trim();
        }
      });

      rows.push({ data, rowIndex: i });
    }

    setParsedRows(rows);
    setErrors([]);
    setStep('map');
  }, [rawText]);

  // ── Re-map columns after manual change ──

  const remapRows = useCallback(() => {
    const lines = rawText.trim().split('\n').map((line) => line.split('\t'));
    const rows: ParsedRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i];
      if (cells.length === 1 && cells[0].trim() === '') continue;

      const data = {} as Record<keyof MappableFields, string>;
      for (const col of EXPECTED_COLUMNS) {
        data[col.field] = '';
      }

      cells.forEach((cell, colIdx) => {
        const mappedField = columnMap[colIdx];
        if (mappedField) {
          data[mappedField] = cell.trim();
        }
      });

      rows.push({ data, rowIndex: i });
    }

    setParsedRows(rows);
  }, [rawText, columnMap]);

  // ── Validate and move to preview ──

  const handleValidate = useCallback(() => {
    remapRows();
    const validationErrors: ValidationError[] = [];

    parsedRows.forEach((row, idx) => {
      // Required field checks
      if (!row.data.name || row.data.name.trim() === '') {
        validationErrors.push({ row: idx + 1, field: 'name', message: 'Fund name is required' });
      }
      if (!row.data.fundManager || row.data.fundManager.trim() === '') {
        validationErrors.push({ row: idx + 1, field: 'fundManager', message: 'Fund manager is required' });
      }

      // Numeric validations
      const numericFields: (keyof MappableFields)[] = [
        'ageOfFund', 'aumCr', 'ter', 'standardDeviation', 'sharpeRatio',
        'mtd', 'ytd', 'oneYear',
      ];
      numericFields.forEach((field) => {
        const val = row.data[field];
        if (val && val.trim() !== '' && val.trim() !== '-' && val.trim() !== 'NA') {
          const cleaned = val.replace(/%/g, '').replace(/,/g, '').trim();
          if (isNaN(parseFloat(cleaned))) {
            validationErrors.push({
              row: idx + 1,
              field,
              message: `${field} must be a valid number (got "${val}")`,
            });
          }
        }
      });
    });

    setErrors(validationErrors);
    if (validationErrors.length === 0) {
      setStep('preview');
    }
  }, [parsedRows, remapRows]);

  // ── Convert parsed rows to TrustnerCuratedFund[] ──

  const convertToFunds = useCallback((): TrustnerCuratedFund[] => {
    return parsedRows.map((row, idx) => {
      const hasSkin = row.data.skinAmountCr && parseNumber(row.data.skinAmountCr) > 0;

      return {
        id: slugify(row.data.name),
        name: row.data.name,
        category: selectedCategory,
        fundManager: row.data.fundManager,
        ageOfFund: parseNumber(row.data.ageOfFund),
        aumCr: parseNumber(row.data.aumCr),
        ter: parsePercentage(row.data.ter),
        standardDeviation: parsePercentage(row.data.standardDeviation),
        sharpeRatio: parseNumber(row.data.sharpeRatio),
        returns: {
          mtd: parsePercentage(row.data.mtd),
          ytd: parsePercentage(row.data.ytd),
          oneYear: parsePercentage(row.data.oneYear),
          twoYear: parsePercentage(row.data.twoYear),
          threeYear: parsePercentage(row.data.threeYear),
          fiveYear: parsePercentage(row.data.fiveYear),
        },
        numberOfHoldings: Math.round(parseNumber(row.data.numberOfHoldings)),
        ...(hasSkin
          ? {
              skinInTheGame: {
                amountCr: parseNumber(row.data.skinAmountCr),
                percentOfAum: parsePercentage(row.data.skinPercentOfAum),
              },
            }
          : {}),
        rank: idx + 1,
      };
    });
  }, [parsedRows, selectedCategory]);

  // ── Handle final import ──

  const handleImport = useCallback(() => {
    const funds = convertToFunds();
    onImport(funds, selectedCategory);
    setRawText('');
    setParsedRows([]);
    setHeaders([]);
    setColumnMap({});
    setErrors([]);
    setStep('paste');
  }, [convertToFunds, onImport, selectedCategory]);

  // ── Count mapped required fields ──

  const mappedRequiredCount = EXPECTED_COLUMNS.filter(
    (col) => col.required && Object.values(columnMap).includes(col.field)
  ).length;
  const totalRequiredCount = EXPECTED_COLUMNS.filter((col) => col.required).length;

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium">
        {(['paste', 'map', 'preview'] as const).map((s, idx) => (
          <div key={s} className="flex items-center gap-2">
            {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-300" />}
            <button
              onClick={() => {
                if (s === 'paste') setStep('paste');
                else if (s === 'map' && parsedRows.length > 0) setStep('map');
                else if (s === 'preview' && errors.length === 0 && parsedRows.length > 0) setStep('preview');
              }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all',
                step === s
                  ? 'bg-brand text-white'
                  : parsedRows.length > 0 || s === 'paste'
                  ? 'bg-surface-200 text-primary-700 hover:bg-surface-300 cursor-pointer'
                  : 'bg-surface-100 text-slate-400 cursor-not-allowed'
              )}
            >
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">
                {idx + 1}
              </span>
              {s === 'paste' ? 'Paste Data' : s === 'map' ? 'Map Columns' : 'Preview & Import'}
            </button>
          </div>
        ))}
      </div>

      {/* ── Step 1: Paste ── */}
      {step === 'paste' && (
        <div className="space-y-4">
          <div className="card-base p-5">
            <div className="flex items-center gap-2 mb-3">
              <ClipboardPaste className="w-4 h-4 text-brand" />
              <h3 className="text-sm font-bold text-primary-700">Paste Excel Data</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Copy your fund data from Excel (including the header row) and paste it below.
              The data should be tab-separated. Percentage values like &quot;14.8%&quot; will be auto-converted to decimals (0.148).
            </p>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder={'NAME\tFUND MANAGER\tAGE OF FUND\tAUM (in Cr.)\tTER\tSD (Std Dev)\tSHARPE RATIO\tMTD\tYTD\t1 YEAR\t2 YEAR\t3 YEAR\t5 YEAR\tNO. OF HOLDINGS\nWhiteOak Capital Large Cap Fund\tRAMESH MANTRI\t3.25\t1142\t2.14%\t12.06%\t0.53\t-1.35%\t-3.16%\t13.49%\t9.87%\t17.84%\t0%\t71'}
              className="w-full h-48 px-4 py-3 border border-surface-300 rounded-lg text-xs font-mono bg-surface-50 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-all resize-y"
            />
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-slate-400">
                {rawText.trim()
                  ? `${rawText.trim().split('\n').length - 1} data rows detected`
                  : 'Waiting for data...'}
              </span>
              <button
                onClick={handleParse}
                disabled={!rawText.trim()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  rawText.trim()
                    ? 'bg-brand text-white hover:bg-brand-700 shadow-sm'
                    : 'bg-surface-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <FileSpreadsheet className="w-4 h-4" />
                Parse Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Column Mapping ── */}
      {step === 'map' && (
        <div className="space-y-4">
          {/* Category selection */}
          <div className="card-base p-5">
            <h3 className="text-sm font-bold text-primary-700 mb-3">Target Category</h3>
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

          {/* Column mapping */}
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Table2 className="w-4 h-4 text-brand" />
                <h3 className="text-sm font-bold text-primary-700">Column Mapping</h3>
              </div>
              <span className={cn(
                'text-xs font-semibold px-2 py-0.5 rounded-full',
                mappedRequiredCount === totalRequiredCount
                  ? 'bg-positive-50 text-positive'
                  : 'bg-amber-50 text-amber-700'
              )}>
                {mappedRequiredCount}/{totalRequiredCount} required mapped
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Excel Column</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Maps To</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Sample Value</th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((header, colIdx) => (
                    <tr key={colIdx} className="border-b border-surface-100">
                      <td className="py-2 px-2 font-mono text-primary-700">{header}</td>
                      <td className="py-2 px-2">
                        <select
                          value={columnMap[colIdx] || ''}
                          onChange={(e) => {
                            const newMap = { ...columnMap };
                            newMap[colIdx] = e.target.value as keyof MappableFields | '';
                            setColumnMap(newMap);
                          }}
                          className={cn(
                            'w-full px-2 py-1 border rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand/30',
                            columnMap[colIdx] ? 'border-positive/30 text-primary-700' : 'border-surface-300 text-slate-400'
                          )}
                        >
                          <option value="">-- Skip --</option>
                          {EXPECTED_COLUMNS.map((col) => (
                            <option key={col.field} value={col.field}>
                              {col.label}{col.required ? ' *' : ''}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2 px-2 text-slate-500 font-mono truncate max-w-[200px]">
                        {parsedRows[0]?.data[columnMap[colIdx] as keyof MappableFields] || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end mt-4 gap-3">
              <button
                onClick={() => setStep('paste')}
                className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 bg-surface-200 hover:bg-surface-300 transition-all"
              >
                Back
              </button>
              <button
                onClick={handleValidate}
                disabled={mappedRequiredCount < totalRequiredCount}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                  mappedRequiredCount >= totalRequiredCount
                    ? 'bg-brand text-white hover:bg-brand-700 shadow-sm'
                    : 'bg-surface-200 text-slate-400 cursor-not-allowed'
                )}
              >
                <Eye className="w-4 h-4" />
                Validate & Preview
              </button>
            </div>
          </div>

          {/* Validation errors */}
          {errors.length > 0 && (
            <div className="card-base p-5 border-negative/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-negative" />
                <h3 className="text-sm font-bold text-negative">Validation Errors</h3>
              </div>
              <ul className="space-y-1 max-h-40 overflow-y-auto">
                {errors.map((err, i) => (
                  <li key={i} className="text-xs text-slate-600">
                    <span className="font-semibold text-negative">Row {err.row}</span>
                    {err.field && <span className="text-slate-400"> ({err.field})</span>}: {err.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Preview & Import ── */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="card-base p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-positive" />
                <h3 className="text-sm font-bold text-primary-700">
                  Preview — {parsedRows.length} Funds for {selectedCategory}
                </h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep('map')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-surface-200 hover:bg-surface-300 transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleImport}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-700 shadow-sm transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Import {parsedRows.length} Funds
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">#</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium min-w-[200px]">Fund Name</th>
                    <th className="text-left py-2 px-2 text-slate-500 font-medium">Manager</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">AUM (Cr)</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">TER</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">1Y</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">3Y</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">5Y</th>
                    <th className="text-right py-2 px-2 text-slate-500 font-medium">Sharpe</th>
                  </tr>
                </thead>
                <tbody>
                  {convertToFunds().map((fund, idx) => (
                    <tr key={fund.id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="py-2 px-2 text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-2 font-medium text-primary-700">{fund.name}</td>
                      <td className="py-2 px-2 text-slate-600">{fund.fundManager}</td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {fund.aumCr.toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">
                        {(fund.ter * 100).toFixed(2)}%
                      </td>
                      <td className={cn(
                        'py-2 px-2 text-right font-medium',
                        fund.returns.oneYear >= 0 ? 'text-positive' : 'text-negative'
                      )}>
                        {(fund.returns.oneYear * 100).toFixed(2)}%
                      </td>
                      <td className={cn(
                        'py-2 px-2 text-right font-medium',
                        fund.returns.threeYear >= 0 ? 'text-positive' : 'text-negative'
                      )}>
                        {fund.returns.threeYear ? (fund.returns.threeYear * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className={cn(
                        'py-2 px-2 text-right font-medium',
                        fund.returns.fiveYear >= 0 ? 'text-positive' : 'text-negative'
                      )}>
                        {fund.returns.fiveYear ? (fund.returns.fiveYear * 100).toFixed(2) + '%' : '—'}
                      </td>
                      <td className="py-2 px-2 text-right text-slate-600">{fund.sharpeRatio.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
