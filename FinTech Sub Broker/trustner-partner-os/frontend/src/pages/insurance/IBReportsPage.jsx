import React, { useState } from 'react';
import { Download, Calendar, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const IBReportsPage = () => {
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [generatingReport, setGeneratingReport] = useState(null);
  const [error, setError] = useState(null);

  const reports = [
    {
      id: 'monthly-business',
      title: 'Monthly Business Report',
      description: 'Summary of GWP, policies, claims, and key metrics',
      icon: '📊',
    },
    {
      id: 'posp-performance',
      title: 'POSP Performance Report',
      description: 'Ranking of POSPs by policies sold, premium, and commission',
      icon: '⭐',
    },
    {
      id: 'claims-register',
      title: 'Claims Register',
      description: 'Detailed record of all claims intimated and settled',
      icon: '📋',
    },
    {
      id: 'commission-statement',
      title: 'Commission Statement',
      description: 'Broker and POSP commission details and reconciliation',
      icon: '💰',
    },
    {
      id: 'renewal-analysis',
      title: 'Renewal Analysis',
      description: 'Renewal rate, lapsed policies, and trend analysis',
      icon: '📈',
    },
    {
      id: 'lob-summary',
      title: 'LOB-wise Summary',
      description: 'Premium, policies, and claims breakdown by LOB',
      icon: '🏷️',
    },
    {
      id: 'irdai-quarterly',
      title: 'IRDAI Quarterly Report',
      description: 'Regulatory compliance report as per IRDAI guidelines',
      icon: '📄',
    },
  ];

  const handleGenerateReport = async (reportId) => {
    try {
      setGeneratingReport(reportId);
      setError(null);

      const res = await api.get(`/insurance/reports/${reportId}/generate`, {
        params: { period: selectedPeriod },
      });

      // Download the report
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportId}-${selectedPeriod}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      setError('Failed to generate report');
      console.error(err);
    } finally {
      setGeneratingReport(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Insurance Reports</h1>
        <p className="text-gray-600 mt-2">Generate and download business, performance, and compliance reports</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Period Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-4">
          <Calendar className="w-5 h-5 text-teal-600" />
          <div>
            <label className="block text-sm font-medium text-gray-900">Select Period</label>
            <input
              type="month"
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow">
            <div className="text-4xl mb-4">{report.icon}</div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">{report.title}</h3>
            <p className="text-sm text-gray-600 mb-6">{report.description}</p>

            <button
              onClick={() => handleGenerateReport(report.id)}
              disabled={generatingReport === report.id}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                generatingReport === report.id
                  ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                  : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
            >
              <Download className="w-4 h-4" />
              {generatingReport === report.id ? 'Generating...' : 'Generate & Download'}
            </button>
          </div>
        ))}
      </div>

      {/* Information Section */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6">
        <h3 className="text-lg font-bold text-teal-900 mb-4">Report Information</h3>
        <div className="space-y-3 text-sm text-teal-800">
          <p>
            <strong>Monthly Business Report:</strong> Provides a comprehensive overview of insurance business performance
            including GWP, policy count, claims, and key performance metrics.
          </p>
          <p>
            <strong>POSP Performance Report:</strong> Lists all POSPs ranked by their performance metrics including policies
            sold, premium generated, and commissions earned.
          </p>
          <p>
            <strong>Claims Register:</strong> Detailed list of all insurance claims with status, amount, and settlement
            information for compliance and audit purposes.
          </p>
          <p>
            <strong>Commission Statement:</strong> Comprehensive breakdown of broker and POSP commissions, including
            receivables from insurers and payables to POSPs.
          </p>
          <p>
            <strong>Renewal Analysis:</strong> Analysis of policy renewals including renewal rate, lapsed policies, and
            trends over selected period.
          </p>
          <p>
            <strong>LOB-wise Summary:</strong> Premium, policies, and claims distribution across different lines of
            business (Motor, Health, Life, etc.).
          </p>
          <p>
            <strong>IRDAI Quarterly Report:</strong> Regulatory compliance report as per Insurance Regulatory and
            Development Authority guidelines.
          </p>
        </div>
      </div>
    </div>
  );
};

export default IBReportsPage;
