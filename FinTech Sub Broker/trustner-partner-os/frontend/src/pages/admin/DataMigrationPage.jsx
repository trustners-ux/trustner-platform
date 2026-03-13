import React, { useState, useEffect, useCallback } from 'react';
import dataMigrationAPI from '../../services/dataMigration';

const DATASETS = [
  {
    key: 'clients',
    title: 'Client Master',
    description: '1,431 clients from VJ Infosoft',
    icon: '👥',
    color: 'teal',
    file: 'vj_infosoft_client_master.csv',
    expectedCols: ['Client ID', 'Name', 'Group Head', 'Email', 'MobileNo'],
  },
  {
    key: 'policyRegister',
    title: 'GI Policy Register',
    description: '1,672 policies from VJ Infosoft',
    icon: '📋',
    color: 'blue',
    file: 'vj_infosoft_gi_policy_register.csv',
    expectedCols: ['Policy No', 'Company', 'Insured Name', 'Insurance Type'],
  },
  {
    key: 'payoutData',
    title: 'POS Payout / Commission',
    description: '1,046 payout records from VJ Infosoft',
    icon: '💰',
    color: 'green',
    file: 'vj_infosoft_pos_payout_report.csv',
    expectedCols: ['Policy No', 'POS Name', 'Customer Name', 'Insurance Type'],
  },
  {
    key: 'renewalDue',
    title: 'Renewal Due Report',
    description: '976 renewal records from VJ Infosoft',
    icon: '🔄',
    color: 'amber',
    file: 'vj_infosoft_renewal_due_report.csv',
    expectedCols: ['Policy No', 'Insured Name', 'End Date', 'POS Name'],
  },
];

function parseCSV(text) {
  const lines = text.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse data rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]);
    if (vals.length === 0 || (vals.length === 1 && !vals[0])) continue;
    const obj = {};
    headers.forEach((h, j) => {
      obj[h.trim()] = (vals[j] || '').trim();
    });
    rows.push(obj);
  }

  return { headers, rows };
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
  }
  result.push(current);
  return result;
}

function StatusCard({ label, value, color }) {
  return (
    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-4`}>
      <div className={`text-2xl font-bold text-${color}-700`}>{value?.toLocaleString() || 0}</div>
      <div className={`text-sm text-${color}-600`}>{label}</div>
    </div>
  );
}

function DatasetCard({ dataset, onImport, importState }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const colorMap = { teal: 'teal', blue: 'blue', green: 'emerald', amber: 'amber' };
  const c = colorMap[dataset.color] || 'gray';

  const handleFileChange = useCallback((e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const { headers, rows } = parseCSV(ev.target.result);
      setPreview({ headers, rows, totalRows: rows.length });
    };
    reader.readAsText(f);
  }, []);

  const handleImport = () => {
    if (!preview?.rows?.length) return;
    onImport(dataset.key, preview.rows);
  };

  return (
    <div className={`bg-white border rounded-xl shadow-sm overflow-hidden`}>
      <div className={`bg-${c}-50 px-6 py-4 border-b border-${c}-100`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl">{dataset.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{dataset.title}</h3>
            <p className="text-sm text-gray-500">{dataset.description}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Upload CSV File
          </label>
          <div className="flex items-center gap-3">
            <label className={`cursor-pointer inline-flex items-center px-4 py-2 bg-${c}-600 text-white rounded-lg hover:bg-${c}-700 transition text-sm font-medium`}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose File
              <input type="file" accept=".csv,.txt" onChange={handleFileChange} className="hidden" />
            </label>
            {file && <span className="text-sm text-gray-600">{file.name}</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">Expected: {dataset.file}</p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Preview: {preview.totalRows} rows, {preview.headers.length} columns
              </span>
              <span className="text-xs text-gray-400">
                Columns: {preview.headers.slice(0, 5).join(', ')}
                {preview.headers.length > 5 ? ` +${preview.headers.length - 5} more` : ''}
              </span>
            </div>

            <div className="overflow-x-auto max-h-40">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    {preview.headers.slice(0, 6).map((h) => (
                      <th key={h} className="px-2 py-1 text-left font-medium text-gray-500 bg-gray-100">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.slice(0, 3).map((row, i) => (
                    <tr key={i}>
                      {preview.headers.slice(0, 6).map((h) => (
                        <td key={h} className="px-2 py-1 text-gray-700 border-t truncate max-w-[150px]">
                          {row[h] || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleImport}
            disabled={!preview?.rows?.length || importState?.loading}
            className={`px-6 py-2 bg-${c}-600 text-white rounded-lg hover:bg-${c}-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm flex items-center gap-2`}
          >
            {importState?.loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Importing...
              </>
            ) : (
              <>Import {preview?.totalRows || 0} Records</>
            )}
          </button>

          {importState?.result && (
            <div className="text-sm">
              <span className="text-green-600 font-medium">
                {importState.result.created} created
              </span>
              {importState.result.updated > 0 && (
                <span className="text-blue-600 font-medium ml-2">
                  {importState.result.updated} updated
                </span>
              )}
              {importState.result.skipped > 0 && (
                <span className="text-gray-500 ml-2">
                  {importState.result.skipped} skipped
                </span>
              )}
              {importState.result.errors?.length > 0 && (
                <span className="text-red-500 ml-2">
                  {importState.result.errors.length} errors
                </span>
              )}
            </div>
          )}

          {importState?.error && (
            <span className="text-sm text-red-600">{importState.error}</span>
          )}
        </div>

        {/* Error Details */}
        {importState?.result?.errors?.length > 0 && (
          <details className="text-xs">
            <summary className="text-red-600 cursor-pointer">Show {importState.result.errors.length} errors</summary>
            <ul className="mt-1 text-red-500 list-disc pl-4 max-h-32 overflow-y-auto">
              {importState.result.errors.slice(0, 20).map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}

function QuickImportZone({ onComplete }) {
  const [dragging, setDragging] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState('');

  const TYPE_LABELS = {
    clients: '👥 Client Master',
    policyRegister: '📋 GI Policy Register',
    payoutData: '💰 POS Payout / Commission',
    renewalDue: '🔄 Renewal Due Report',
  };

  const handleFiles = async (files) => {
    setResult(null);
    setError(null);

    for (const file of files) {
      if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
        setError(`${file.name}: Only CSV files are supported`);
        continue;
      }

      setImporting(true);
      setProgress(`Reading ${file.name}...`);

      try {
        const text = await file.text();
        const { headers, rows } = parseCSV(text);

        if (rows.length === 0) {
          setError(`${file.name}: No data rows found`);
          setImporting(false);
          continue;
        }

        setProgress(`Importing ${rows.length} rows from ${file.name}...`);

        // Send in batches of 200 to handle large files
        const batchSize = 200;
        const allResults = [];

        for (let i = 0; i < rows.length; i += batchSize) {
          const batch = rows.slice(i, i + batchSize);
          setProgress(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${Math.min(i + batchSize, rows.length)}/${rows.length} rows)...`);
          const batchResult = await dataMigrationAPI.smartImport(batch, headers);
          allResults.push(batchResult);
        }

        // Combine batch results
        const combined = {
          detectedType: allResults[0]?.detectedType || 'unknown',
          importResult: { created: 0, skipped: 0, updated: 0, errors: [] },
          syncResult: allResults[allResults.length - 1]?.syncResult || null,
        };

        for (const r of allResults) {
          if (r.importResult) {
            combined.importResult.created += r.importResult.created || 0;
            combined.importResult.skipped += r.importResult.skipped || 0;
            combined.importResult.updated += r.importResult.updated || 0;
            if (r.importResult.errors) combined.importResult.errors.push(...r.importResult.errors);
          }
        }

        setResult({
          fileName: file.name,
          ...combined,
          typeLabel: TYPE_LABELS[combined.detectedType] || combined.detectedType,
        });
      } catch (err) {
        setError(`${file.name}: ${err?.response?.data?.message || err.message}`);
      } finally {
        setImporting(false);
        setProgress('');
      }
    }

    if (onComplete) onComplete();
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const onFileSelect = (e) => {
    handleFiles(Array.from(e.target.files));
  };

  return (
    <div className="mb-8">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragging
            ? 'border-teal-500 bg-teal-50 scale-[1.01]'
            : importing
            ? 'border-amber-400 bg-amber-50'
            : 'border-gray-300 bg-white hover:border-teal-400 hover:bg-teal-50/30'
        }`}
      >
        {importing ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
            <p className="text-teal-700 font-medium">{progress}</p>
            <p className="text-xs text-gray-500">Auto-detecting CSV type → Importing → Syncing to Policies</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-4xl">📥</div>
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Quick Import — Drop any VJ Infosoft CSV here
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Auto-detects file type (Client, Policy, Payout, or Renewal) • Imports to MIS • Syncs to Insurance Policies
              </p>
            </div>
            <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition cursor-pointer font-medium text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Choose CSV File(s)
              <input type="file" accept=".csv,.txt" multiple onChange={onFileSelect} className="hidden" />
            </label>
            <p className="text-xs text-gray-400">Supports multiple files at once</p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div className="flex-1">
              <p className="font-medium text-green-900">
                {result.fileName} → Detected as {result.typeLabel}
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                {result.importResult?.created > 0 && (
                  <span className="text-green-700">{result.importResult.created} imported</span>
                )}
                {result.importResult?.updated > 0 && (
                  <span className="text-blue-700">{result.importResult.updated} updated</span>
                )}
                {result.importResult?.skipped > 0 && (
                  <span className="text-gray-600">{result.importResult.skipped} skipped (duplicates)</span>
                )}
                {result.syncResult && (
                  <span className="text-purple-700">
                    {result.syncResult.synced} synced to policies
                  </span>
                )}
              </div>
              {result.importResult?.errors?.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="text-red-600 cursor-pointer">{result.importResult.errors.length} errors</summary>
                  <ul className="mt-1 text-red-500 list-disc pl-4 max-h-24 overflow-y-auto">
                    {result.importResult.errors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          ❌ {error}
        </div>
      )}
    </div>
  );
}

export default function DataMigrationPage() {
  const [status, setStatus] = useState(null);
  const [importStates, setImportStates] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await dataMigrationAPI.getStatus();
      setStatus(data);
    } catch (err) {
      console.error('Failed to load migration status:', err);
    }
  };

  const handleImport = async (key, rows) => {
    setImportStates((prev) => ({
      ...prev,
      [key]: { loading: true, result: null, error: null },
    }));

    try {
      let result;
      // Send in batches of 200 to avoid request size limits
      const batchSize = 200;
      const combinedResult = { created: 0, skipped: 0, updated: 0, errors: [] };

      for (let i = 0; i < rows.length; i += batchSize) {
        const batch = rows.slice(i, i + batchSize);

        switch (key) {
          case 'clients':
            result = await dataMigrationAPI.importClients(batch);
            break;
          case 'policyRegister':
            result = await dataMigrationAPI.importPolicyRegister(batch);
            break;
          case 'payoutData':
            result = await dataMigrationAPI.importPayoutData(batch);
            break;
          case 'renewalDue':
            result = await dataMigrationAPI.importRenewalDue(batch);
            break;
          default:
            throw new Error('Unknown dataset: ' + key);
        }

        combinedResult.created += result.created || 0;
        combinedResult.skipped += result.skipped || 0;
        combinedResult.updated += result.updated || 0;
        if (result.errors) combinedResult.errors.push(...result.errors);
      }

      setImportStates((prev) => ({
        ...prev,
        [key]: { loading: false, result: combinedResult, error: null },
      }));

      // Refresh status
      loadStatus();
    } catch (err) {
      setImportStates((prev) => ({
        ...prev,
        [key]: { loading: false, result: null, error: err?.response?.data?.message || err.message },
      }));
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <span className="text-3xl">🔄</span>
          Data Migration - VJ Infosoft Import
        </h1>
        <p className="text-gray-500 mt-1">
          Upload CSV files exported from VJ Infosoft to import data into Trustner Partner OS
        </p>
      </div>

      {/* Quick Import - drag and drop */}
      <QuickImportZone onComplete={loadStatus} />

      {/* Status Cards */}
      {status && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatusCard label="Total Clients" value={status.totalClients} color="teal" />
          <StatusCard label="MIS Entries (VJ)" value={status.importedFromVJ} color="blue" />
          <StatusCard label="Insurance Policies" value={status.totalInsurancePolicies} color="green" />
          <StatusCard label="Needs Sync" value={status.needsSync > 0 ? status.needsSync : 0} color="amber" />
        </div>
      )}

      {/* Sync to Insurance Policies */}
      {status && status.importedFromVJ > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-5 mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 text-lg">
                Step 5: Sync to Insurance Policies
              </h3>
              <p className="text-sm text-purple-700 mt-1">
                After importing data into MIS entries, sync them to the <strong>InsurancePolicy</strong> table
                so they appear in the <strong>Insurance Broking Dashboard</strong> and <strong>Policies</strong> page.
              </p>
              <p className="text-xs text-purple-500 mt-2">
                {status.syncedToInsurancePolicy || 0} of {status.importedFromVJ} already synced
                {status.needsSync > 0 && ` · ${status.needsSync} remaining`}
              </p>
            </div>
            <button
              onClick={async () => {
                setSyncing(true);
                setSyncResult(null);
                try {
                  const result = await dataMigrationAPI.syncToInsurancePolicies();
                  setSyncResult(result);
                  loadStatus();
                } catch (err) {
                  setSyncResult({ error: err?.response?.data?.message || err.message });
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition font-medium text-sm flex items-center gap-2 whitespace-nowrap"
            >
              {syncing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Syncing...
                </>
              ) : (
                '🔄 Sync to Policies'
              )}
            </button>
          </div>
          {syncResult && !syncResult.error && (
            <div className="mt-3 text-sm">
              <span className="text-green-600 font-medium">{syncResult.synced} synced</span>
              {syncResult.skipped > 0 && <span className="text-gray-500 ml-3">{syncResult.skipped} already existed</span>}
              {syncResult.errors?.length > 0 && (
                <details className="mt-2 text-xs">
                  <summary className="text-red-600 cursor-pointer">{syncResult.errors.length} errors</summary>
                  <ul className="mt-1 text-red-500 list-disc pl-4 max-h-32 overflow-y-auto">
                    {syncResult.errors.slice(0, 20).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
          {syncResult?.error && (
            <div className="mt-3 text-sm text-red-600">{syncResult.error}</div>
          )}
        </div>
      )}

      {/* Import Order Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
        <h3 className="font-medium text-blue-800 mb-2">Recommended Import Order</h3>
        <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
          <li><strong>Client Master</strong> - Import client records first (base data)</li>
          <li><strong>GI Policy Register</strong> - Import policy records (creates MIS entries)</li>
          <li><strong>POS Payout / Commission</strong> - Enriches MIS entries with commission data</li>
          <li><strong>Renewal Due Report</strong> - Marks policies due for renewal</li>
          <li><strong>Sync to Policies</strong> - Creates InsurancePolicy records for IB Dashboard &amp; Policies page</li>
        </ol>
      </div>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DATASETS.map((ds) => (
          <DatasetCard
            key={ds.key}
            dataset={ds}
            onImport={handleImport}
            importState={importStates[ds.key]}
          />
        ))}
      </div>
    </div>
  );
}
