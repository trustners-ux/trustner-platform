import React, { useEffect, useState } from 'react';
import {
  Settings,
  AlertCircle,
  CheckCircle,
  X,
  Save,
  Users,
  DollarSign,
} from 'lucide-react';
import commissionsAPI from '../../services/commissions';

const PAYOUT_MODELS = [
  { value: 'SLAB_BASED', label: 'Slab-Based', description: 'Commission based on premium slabs configured by admin' },
  { value: 'FLAT_RATE', label: 'Flat Rate', description: 'Fixed percentage of premium regardless of slab' },
  { value: 'CUSTOM', label: 'Custom', description: 'Custom payout arrangement (requires manual processing)' },
];

const PayoutConfigPage = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState(null);
  const [modalForm, setModalForm] = useState({
    pospId: '',
    payoutModel: 'SLAB_BASED',
    flatRatePct: '',
    remarks: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchConfigs();
  }, [page]);

  const fetchConfigs = async () => {
    try {
      setLoading(true);
      const res = await commissionsAPI.listPayoutConfigs({ page, limit: 20 });
      const data = res.data || {};
      setConfigs(data.data || data.configs || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError('Failed to load payout configurations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      setSelectedConfig(config);
      setModalForm({
        pospId: config.pospId,
        payoutModel: config.payoutModel || 'SLAB_BASED',
        flatRatePct: config.flatRatePct || '',
        remarks: config.remarks || '',
      });
    } else {
      setSelectedConfig(null);
      setModalForm({
        pospId: '',
        payoutModel: 'SLAB_BASED',
        flatRatePct: '',
        remarks: '',
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      const payload = {
        pospId: modalForm.pospId,
        payoutModel: modalForm.payoutModel,
        flatRatePct: modalForm.flatRatePct ? parseFloat(modalForm.flatRatePct) : undefined,
        remarks: modalForm.remarks || undefined,
      };
      await commissionsAPI.setPayoutConfig(payload);
      setSuccess('Payout configuration saved successfully');
      setShowModal(false);
      fetchConfigs();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save configuration');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading payout configurations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payout Configuration</h1>
          <p className="text-gray-600 mt-2">Configure payout model per POSP agent</p>
        </div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-100"><Users className="w-5 h-5 text-teal-700" /></div>
            <div>
              <p className="text-sm text-gray-500">Total Configs</p>
              <p className="text-2xl font-bold text-gray-900">{total}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100"><DollarSign className="w-5 h-5 text-blue-700" /></div>
            <div>
              <p className="text-sm text-gray-500">Slab-Based</p>
              <p className="text-2xl font-bold text-gray-900">{configs.filter(c => c.payoutModel === 'SLAB_BASED').length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100"><Settings className="w-5 h-5 text-orange-700" /></div>
            <div>
              <p className="text-sm text-gray-500">Flat Rate / Custom</p>
              <p className="text-2xl font-bold text-gray-900">{configs.filter(c => c.payoutModel !== 'SLAB_BASED').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Config Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Agent Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">POSP Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Payout Model</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Flat Rate %</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Remarks</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {configs.length > 0 ? configs.map((config, idx) => (
                <tr
                  key={config.id}
                  className={`border-t border-gray-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-teal-50 transition-colors`}
                >
                  <td className="px-6 py-4 font-medium text-teal-600">
                    {config.posp?.agentCode || config.pospId?.slice(0, 8)}
                  </td>
                  <td className="px-6 py-4 text-gray-900">
                    {config.posp ? `${config.posp.firstName} ${config.posp.lastName}` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      config.payoutModel === 'SLAB_BASED' ? 'bg-blue-100 text-blue-800' :
                      config.payoutModel === 'FLAT_RATE' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {config.payoutModel?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">
                    {config.payoutModel === 'FLAT_RATE' && config.flatRatePct ? `${config.flatRatePct}%` : '-'}
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{config.remarks || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleOpenModal(config)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg font-medium text-xs transition-colors mx-auto"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Configure
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Settings className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No payout configurations yet</p>
                    <p className="text-sm mt-1">Configurations will appear when set for POSP agents</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={configs.length < 20}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Config Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="flex items-center justify-between border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">
                {selectedConfig ? 'Edit Payout Config' : 'Set Payout Config'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!selectedConfig && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">POSP ID *</label>
                  <input
                    type="text"
                    value={modalForm.pospId}
                    onChange={(e) => setModalForm(f => ({ ...f, pospId: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                    placeholder="Enter POSP agent ID"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payout Model *</label>
                <div className="space-y-2">
                  {PAYOUT_MODELS.map(model => (
                    <label key={model.value} className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      modalForm.payoutModel === model.value
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        name="payoutModel"
                        value={model.value}
                        checked={modalForm.payoutModel === model.value}
                        onChange={(e) => setModalForm(f => ({ ...f, payoutModel: e.target.value }))}
                        className="mt-0.5 text-teal-600"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{model.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {modalForm.payoutModel === 'FLAT_RATE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Flat Rate Percentage *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={modalForm.flatRatePct}
                      onChange={(e) => setModalForm(f => ({ ...f, flatRatePct: e.target.value }))}
                      className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                      placeholder="e.g. 15.00"
                      min="0"
                      max="100"
                      step="0.01"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  value={modalForm.remarks}
                  onChange={(e) => setModalForm(f => ({ ...f, remarks: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                  placeholder="Optional remarks..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !modalForm.pospId || (modalForm.payoutModel === 'FLAT_RATE' && !modalForm.flatRatePct)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Config'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutConfigPage;
