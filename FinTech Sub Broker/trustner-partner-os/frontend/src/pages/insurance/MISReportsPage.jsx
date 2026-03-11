import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  BarChart3,
  Filter,
  RefreshCw,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
} from 'lucide-react';
import misAPI from '../../services/mis';
import { formatCurrency, formatDate, formatDateTime, formatIndianNumber } from '../../utils/formatters';

const REPORT_TYPES = [
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'HALF_YEARLY', label: 'Half-Yearly' },
  { value: 'YEARLY', label: 'Yearly' },
  { value: 'CUSTOM_DATE_RANGE', label: 'Custom Date Range' },
];

const DEPARTMENTS = ['All', 'Health', 'Life', 'General', 'Motor', 'Travel'];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const QUARTERS = ['Q1 (Jan-Mar)', 'Q2 (Apr-Jun)', 'Q3 (Jul-Sep)', 'Q4 (Oct-Dec)'];
const HALF_YEARS = ['H1 (Jan-Jun)', 'H2 (Jul-Dec)'];

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  GENERATING: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  FAILED: 'bg-red-100 text-red-800',
};

const MISReportsPage = () => {
  const [activeTab, setActiveTab] = useState('generate');
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [success, setSuccess] = useState(null);

  // Generate form state
  const [reportType, setReportType] = useState('MONTHLY');
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [period, setPeriod] = useState('');
  const [department, setDepartment] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  // Summary date range
  const [summaryStartDate, setSummaryStartDate] = useState('');
  const [summaryEndDate, setSummaryEndDate] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setPeriod('');
  }, [reportType]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reportsRes, summaryRes] = await Promise.all([
        misAPI.getReports(),
        misAPI.getSummary(),
      ]);
      setReports(reportsRes.data?.data || reportsRes.data || []);
      setSummary(summaryRes.data || null);
    } catch (err) {
      setError('Failed to load reports data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      setError(null);
      setSuccess(null);
      const payload = {
        type: reportType,
        year: parseInt(year, 10),
        period: period || undefined,
        department: department === 'All' ? undefined : department,
      };
      // Custom date range
      if (reportType === 'CUSTOM_DATE_RANGE') {
        payload.startDate = customStartDate;
        payload.endDate = customEndDate;
        delete payload.period;
      }
      await misAPI.generateReport(payload);
      setSuccess('Report generation started. It will appear in the list once completed.');
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate report');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleRefreshSummary = async () => {
    try {
      const params = {};
      if (summaryStartDate && summaryEndDate) {
        params.startDate = summaryStartDate;
        params.endDate = summaryEndDate;
      }
      const summaryRes = await misAPI.getSummary(params);
      setSummary(summaryRes.data || null);
    } catch (err) {
      console.error('Failed to refresh summary:', err);
    }
  };

  const handleDownloadReport = async (report) => {
    try {
      const res = await misAPI.getReport(report.id);
      if (res.data?.downloadUrl) {
        window.open(res.data.downloadUrl, '_blank');
      } else {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `report-${report.reportCode || report.id}.json`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
    } catch (err) {
      setError('Failed to download report');
      console.error(err);
    }
  };

  const getPeriodOptions = () => {
    switch (reportType) {
      case 'MONTHLY': return MONTHS.map((m, i) => ({ value: (i + 1).toString(), label: m }));
      case 'QUARTERLY': return QUARTERS.map((q, i) => ({ value: `Q${i + 1}`, label: q }));
      case 'HALF_YEARLY': return HALF_YEARS.map((h, i) => ({ value: `H${i + 1}`, label: h }));
      case 'YEARLY': return [];
      case 'CUSTOM_DATE_RANGE': return [];
      default: return [];
    }
  };

  const isCustomRange = reportType === 'CUSTOM_DATE_RANGE';

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">MIS Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download MIS reports</p>
      </div>

      {/* Status Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'generate'
              ? 'bg-white text-teal-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'history'
              ? 'bg-white text-teal-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          Previous Reports
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeTab === 'summary'
              ? 'bg-white text-teal-600 shadow'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Real-time Summary
        </button>
      </div>

      {/* Generate Report Tab */}
      {activeTab === 'generate' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Generate New Report</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Type *</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {REPORT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {getPeriodOptions().length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period *</label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select Period</option>
                  {getPeriodOptions().map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            )}

            {isCustomRange && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGenerate}
              disabled={generating || (getPeriodOptions().length > 0 && !period) || (isCustomRange && (!customStartDate || !customEndDate))}
              className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Previous Reports Tab */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900">Previous Reports</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Report Code</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Type</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Period</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Department</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Generated At</th>
                  <th className="px-6 py-3 text-center font-medium text-gray-900">Download</th>
                </tr>
              </thead>
              <tbody>
                {reports.length > 0 ? (
                  reports.map((report, idx) => (
                    <tr
                      key={report.id}
                      className={`border-t border-gray-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      } hover:bg-teal-50 transition-colors`}
                    >
                      <td className="px-6 py-4 font-medium text-teal-600">
                        {report.reportCode || report.id?.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{report.type?.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {report.period || '-'} {report.year || ''}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{report.department || 'All'}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[report.status] || 'bg-gray-100 text-gray-800'}`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{formatDateTime(report.createdAt)}</td>
                      <td className="px-6 py-4 text-center">
                        {report.status === 'COMPLETED' ? (
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-medium text-xs transition-colors mx-auto"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </button>
                        ) : report.status === 'GENERATING' || report.status === 'PENDING' ? (
                          <span className="text-xs text-gray-400 flex items-center justify-center gap-1">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Processing
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                      <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="font-medium">No reports generated yet</p>
                      <p className="text-sm mt-1">Generate your first report from the Generate tab</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Real-time Summary Tab */}
      {activeTab === 'summary' && (
        <div className="space-y-6">
          {/* Date Range Filter for Summary */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                <input
                  type="date"
                  value={summaryStartDate}
                  onChange={(e) => setSummaryStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                <input
                  type="date"
                  value={summaryEndDate}
                  onChange={(e) => setSummaryEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                />
              </div>
              <button
                onClick={handleRefreshSummary}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              {(summaryStartDate || summaryEndDate) && (
                <button
                  onClick={() => { setSummaryStartDate(''); setSummaryEndDate(''); handleRefreshSummary(); }}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium text-sm transition-colors hover:bg-gray-50"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-teal-100">
                  <FileText className="w-5 h-5 text-teal-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Entries (Period)</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatIndianNumber(summary?.totalEntries || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-green-100">
                  <DollarSign className="w-5 h-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Premium</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary?.totalPremium || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-blue-100">
                  <TrendingUp className="w-5 h-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Commission</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(summary?.totalCommission || 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Users className="w-5 h-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active POSPs</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatIndianNumber(summary?.activePosps || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Department-wise Summary</h3>
            {summary?.departmentBreakdown && summary.departmentBreakdown.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-medium text-gray-900">Department</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900">Entries</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900">Commission</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900">Verified</th>
                      <th className="px-6 py-3 text-right font-medium text-gray-900">Pending</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.departmentBreakdown.map((dept, idx) => (
                      <tr key={idx} className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{dept.department}</td>
                        <td className="px-6 py-4 text-right text-gray-900">{formatIndianNumber(dept.entries || 0)}</td>
                        <td className="px-6 py-4 text-right font-bold text-teal-600">{formatCurrency(dept.premium || 0)}</td>
                        <td className="px-6 py-4 text-right text-green-600">{formatCurrency(dept.commission || 0)}</td>
                        <td className="px-6 py-4 text-right text-gray-600">{formatIndianNumber(dept.verified || 0)}</td>
                        <td className="px-6 py-4 text-right text-yellow-600">{formatIndianNumber(dept.pending || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">No summary data available for the current period</p>
              </div>
            )}
          </div>

          {/* LOB Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">LOB-wise Summary</h3>
            {summary?.lobBreakdown && summary.lobBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.lobBreakdown.map((lob, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{lob.lob?.replace(/_/g, ' ')}</p>
                      <p className="text-xs text-gray-500">{formatIndianNumber(lob.count || 0)} entries</p>
                    </div>
                    <p className="text-sm font-bold text-teal-600">{formatCurrency(lob.premium || 0)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p className="text-sm">No LOB data available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MISReportsPage;
