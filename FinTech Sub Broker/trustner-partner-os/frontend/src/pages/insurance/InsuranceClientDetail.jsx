import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  ShieldCheck,
  FileText,
  Edit3,
  Save,
  X,
} from 'lucide-react';
import insuranceClientsAPI from '../../services/insuranceClients';
import { formatCurrency, formatDate, formatIndianNumber } from '../../utils/formatters';

const LOB_LABELS = {
  MOTOR_TWO_WHEELER: 'Motor 2W', MOTOR_FOUR_WHEELER: 'Motor 4W', MOTOR_COMMERCIAL: 'Motor Comm.',
  HEALTH_INDIVIDUAL: 'Health Ind.', HEALTH_FAMILY_FLOATER: 'Health FF', HEALTH_GROUP: 'Health Grp',
  HEALTH_CRITICAL_ILLNESS: 'Health CI', HEALTH_TOP_UP: 'Health Top-Up',
  LIFE_TERM: 'Life Term', LIFE_ENDOWMENT: 'Life Endow.', LIFE_ULIP: 'Life ULIP', LIFE_WHOLE_LIFE: 'Life WL',
  TRAVEL: 'Travel', HOME: 'Home', FIRE: 'Fire', MARINE: 'Marine', LIABILITY: 'Liability',
  PA_PERSONAL_ACCIDENT: 'PA', CYBER: 'Cyber',
};

const KYC_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-red-100 text-red-800',
};

const InsuranceClientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPortfolio();
  }, [id]);

  const fetchPortfolio = async () => {
    try {
      setLoading(true);
      const res = await insuranceClientsAPI.getPortfolio(id);
      setPortfolio(res.data);
      setForm(res.data.client || {});
    } catch (err) {
      console.error('Failed to fetch client', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await insuranceClientsAPI.update(id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        dateOfBirth: form.dateOfBirth?.split('T')[0] || null,
        panNumber: form.panNumber,
        aadharNumber: form.aadharNumber,
        address: form.address,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        groupHeadName: form.groupHeadName,
        kycStatus: form.kycStatus,
      });
      setEditing(false);
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to update', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading client data...</p>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="p-6 text-center text-gray-500">Client not found</div>
    );
  }

  const { client, policies, summary } = portfolio;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/insurance/clients')} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{client.name}</h1>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KYC_BADGE[client.kycStatus] || 'bg-gray-100 text-gray-800'}`}>
              KYC: {client.kycStatus}
            </span>
            <span className="text-sm text-teal-600 font-medium">{client.clientCode}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Created {formatDate(client.createdAt)} by {client.creator?.name || client.creator?.email}</p>
        </div>
        <button onClick={() => setEditing(!editing)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            editing ? 'bg-gray-200 text-gray-700' : 'bg-teal-600 text-white hover:bg-teal-700'
          }`}>
          {editing ? <><X className="w-4 h-4" /> Cancel</> : <><Edit3 className="w-4 h-4" /> Edit</>}
        </button>
      </div>

      {/* Client Info + Portfolio Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Client Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {editing ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                  <input type="text" value={form.name || ''} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <input type="tel" value={form.phone || ''} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <input type="email" value={form.email || ''} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth?.split('T')[0] || ''} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">PAN Number</label>
                  <input type="text" value={form.panNumber || ''} onChange={(e) => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Aadhar Number</label>
                  <input type="text" value={form.aadharNumber || ''} onChange={(e) => setForm(f => ({ ...f, aadharNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Group Head</label>
                  <input type="text" value={form.groupHeadName || ''} onChange={(e) => setForm(f => ({ ...f, groupHeadName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">KYC Status</label>
                  <select value={form.kycStatus || 'PENDING'} onChange={(e) => setForm(f => ({ ...f, kycStatus: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
                    <option value="PENDING">Pending</option>
                    <option value="VERIFIED">Verified</option>
                    <option value="INCOMPLETE">Incomplete</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">City</label>
                  <input type="text" value={form.city || ''} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                  <input type="text" value={form.state || ''} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                  <textarea value={form.address || ''} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium">{client.phone || <span className="text-orange-500">Missing</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium">{client.email || <span className="text-orange-500">Missing</span>}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                    <p className="text-sm font-medium">{client.dateOfBirth ? formatDate(client.dateOfBirth) : '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">PAN / Aadhar</p>
                    <p className="text-sm font-medium">{client.panNumber || '-'} / {client.aadharNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Group Head</p>
                    <p className="text-sm font-medium">{client.groupHeadName || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{[client.city, client.state, client.pincode].filter(Boolean).join(', ') || '-'}</p>
                  </div>
                </div>
                {client.address && (
                  <div className="sm:col-span-2 flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium">{client.address}</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Portfolio Summary</h2>
            <div className="space-y-4">
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Total Policies</p>
                <p className="text-2xl font-bold text-teal-700">{summary.totalPolicies}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Gross Premium</p>
                <p className="text-xl font-bold text-blue-700">{formatCurrency(summary.totalGrossPremium)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Net Premium</p>
                <p className="text-xl font-bold text-green-700">{formatCurrency(summary.totalNetPremium)}</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Sum Insured</p>
                <p className="text-xl font-bold text-purple-700">{formatCurrency(summary.totalSumInsured)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-gray-900">Policy History ({policies.length})</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">MIS Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Policy No</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Company</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">LOB</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Type</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Period</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Premium</th>
                <th className="px-4 py-3 text-right font-medium text-gray-900">Sum Insured</th>
                <th className="px-4 py-3 text-center font-medium text-gray-900">Renewal</th>
              </tr>
            </thead>
            <tbody>
              {policies.length > 0 ? (
                policies.map((p, idx) => (
                  <tr key={p.id} className={`border-t border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-teal-600">{p.misCode}</td>
                    <td className="px-4 py-3 text-gray-600">{p.policyNumber || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{p.insurerName || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{LOB_LABELS[p.lob] || p.lob}</td>
                    <td className="px-4 py-3 text-gray-600">{p.policyType || '-'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {p.policyStartDate ? formatDate(p.policyStartDate) : '-'} — {p.policyEndDate ? formatDate(p.policyEndDate) : '-'}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-teal-600">{formatCurrency(p.grossPremium)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{formatCurrency(p.sumInsured)}</td>
                    <td className="px-4 py-3 text-center">
                      {p.isRenewal ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Renewal</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">New</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-4 py-12 text-center text-gray-500">No policies found for this client</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InsuranceClientDetail;
