import React, { useEffect, useState } from 'react';
import { Download, AlertCircle, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';

const IBCommissionPage = () => {
  const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));
  const [commissionData, setCommissionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('commission');

  useEffect(() => {
    fetchCommissionData();
  }, [period]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/insurance/commissions', {
        params: { period },
      });
      setCommissionData(res.data);
    } catch (err) {
      setError('Failed to load commission data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await api.get(`/insurance/commissions/export`, {
        params: { period, format: 'excel' },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `commission-${period}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      alert('Failed to export commission data');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading commission data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!commissionData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <p className="text-gray-600">No commission data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Commission Management</h1>
          <p className="text-gray-600 mt-2">Track and manage insurance broker commissions</p>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
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
        <label className="block text-sm font-medium text-gray-900 mb-3">Select Period</label>
        <input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-lg p-6">
          <p className="text-sm text-teal-800 font-medium">Total Broker Commission</p>
          <p className="text-3xl font-bold text-teal-900 mt-2">
            {formatCurrency(commissionData.summary.totalBrokerCommission)}
          </p>
          <p className="text-xs text-teal-700 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +5.2% from last month
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
          <p className="text-sm text-blue-800 font-medium">POSP Payable</p>
          <p className="text-3xl font-bold text-blue-900 mt-2">
            {formatCurrency(commissionData.summary.pospPayable)}
          </p>
          <p className="text-xs text-blue-700 mt-2">To be paid to agents</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
          <p className="text-sm text-green-800 font-medium">Trustner Retention</p>
          <p className="text-3xl font-bold text-green-900 mt-2">
            {formatCurrency(commissionData.summary.trustnerRetention)}
          </p>
          <p className="text-xs text-green-700 mt-2">
            {((commissionData.summary.trustnerRetention / commissionData.summary.totalBrokerCommission) * 100).toFixed(1)}%
            retention rate
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
          <p className="text-sm text-orange-800 font-medium">Pending from Insurers</p>
          <p className="text-3xl font-bold text-orange-900 mt-2">
            {formatCurrency(commissionData.summary.pendingFromInsurers)}
          </p>
          <p className="text-xs text-orange-700 mt-2">Awaiting settlement</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('commission')}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'commission'
                ? 'text-teal-600 border-teal-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Commission Details
          </button>
          <button
            onClick={() => setActiveTab('receivables')}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'receivables'
                ? 'text-teal-600 border-teal-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Receivables
          </button>
          <button
            onClick={() => setActiveTab('payables')}
            className={`flex-1 px-6 py-4 font-medium transition-colors border-b-2 ${
              activeTab === 'payables'
                ? 'text-teal-600 border-teal-600'
                : 'text-gray-600 border-transparent hover:text-gray-900'
            }`}
          >
            Payables
          </button>
        </div>

        <div className="overflow-x-auto">
          {activeTab === 'commission' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">POSP</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Company</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">LOB</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Policy No</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Commission %</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Amount</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.commissions && commissionData.commissions.length > 0 ? (
                  commissionData.commissions.map((comm, idx) => (
                    <tr
                      key={comm.id}
                      className={`border-t border-gray-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{comm.pospName}</td>
                      <td className="px-6 py-4 text-gray-600">{comm.company}</td>
                      <td className="px-6 py-4 text-gray-600">{comm.lob}</td>
                      <td className="px-6 py-4 text-gray-600">{comm.policyNo}</td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium">
                        {formatCurrency(comm.premium)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-900 font-medium">
                        {comm.commissionPercent}%
                      </td>
                      <td className="px-6 py-4 text-right text-teal-600 font-bold">
                        {formatCurrency(comm.commissionAmount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            comm.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : comm.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {comm.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                      No commission data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'receivables' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Insurance Company</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Amount Due</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.receivables && commissionData.receivables.length > 0 ? (
                  commissionData.receivables.map((rec, idx) => (
                    <tr
                      key={rec.id}
                      className={`border-t border-gray-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{rec.company}</td>
                      <td className="px-6 py-4 text-right text-teal-600 font-bold">
                        {formatCurrency(rec.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            rec.status === 'Received'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{rec.dueDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No receivables data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'payables' && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">POSP</th>
                  <th className="px-6 py-3 text-right font-medium text-gray-900">Amount Due</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-900">Payment Date</th>
                </tr>
              </thead>
              <tbody>
                {commissionData.payables && commissionData.payables.length > 0 ? (
                  commissionData.payables.map((pay, idx) => (
                    <tr
                      key={pay.id}
                      className={`border-t border-gray-200 ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">{pay.pospName}</td>
                      <td className="px-6 py-4 text-right text-teal-600 font-bold">
                        {formatCurrency(pay.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            pay.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : pay.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{pay.paymentDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                      No payables data
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default IBCommissionPage;
