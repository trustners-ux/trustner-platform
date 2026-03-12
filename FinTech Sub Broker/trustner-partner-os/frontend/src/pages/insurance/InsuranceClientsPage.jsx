import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  UserCheck,
  UserX,
  Download,
} from 'lucide-react';
import insuranceClientsAPI from '../../services/insuranceClients';
import { formatDate, formatIndianNumber } from '../../utils/formatters';

const KYC_BADGE = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  VERIFIED: 'bg-green-100 text-green-800',
  INCOMPLETE: 'bg-red-100 text-red-800',
};

const InsuranceClientsPage = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kycFilter, setKycFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [stats, setStats] = useState(null);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', dateOfBirth: '', panNumber: '',
    aadharNumber: '', address: '', city: '', state: '', pincode: '', groupHeadName: '',
  });
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchStats();
  }, [page, kycFilter]);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      if (kycFilter) params.kycStatus = kycFilter;
      const res = await insuranceClientsAPI.getAll(params);
      const d = res.data;
      setClients(d.data || []);
      setTotal(d.total || 0);
      setTotalPages(d.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch clients', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await insuranceClientsAPI.getStats();
      setStats(res.data);
    } catch (err) {
      console.error('Failed to fetch stats', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchClients();
  };

  const handleAddClient = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError('Name is required'); return; }
    try {
      setSubmitting(true);
      setFormError(null);
      await insuranceClientsAPI.create(form);
      setShowAddModal(false);
      setForm({ name: '', phone: '', email: '', dateOfBirth: '', panNumber: '', aadharNumber: '', address: '', city: '', state: '', pincode: '', groupHeadName: '' });
      fetchClients();
      fetchStats();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create client');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Client Master</h1>
          <p className="text-gray-600 mt-1">Insurance client database — CRM</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><Users className="w-4 h-4" /> Total</div>
            <p className="text-2xl font-bold text-gray-900">{formatIndianNumber(stats.total)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-green-600 mb-1"><UserCheck className="w-4 h-4" /> Active</div>
            <p className="text-2xl font-bold text-green-600">{formatIndianNumber(stats.active)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-gray-500 mb-1"><UserX className="w-4 h-4" /> Inactive</div>
            <p className="text-2xl font-bold text-gray-600">{formatIndianNumber(stats.inactive)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-yellow-600 mb-1"><ShieldCheck className="w-4 h-4" /> KYC Pending</div>
            <p className="text-2xl font-bold text-yellow-600">{formatIndianNumber(stats.pendingKyc)}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center gap-2 text-green-600 mb-1"><ShieldCheck className="w-4 h-4" /> KYC Verified</div>
            <p className="text-2xl font-bold text-green-600">{formatIndianNumber(stats.verifiedKyc)}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients by name, code, phone, email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <button type="submit" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700">Search</button>
          </form>
          <select value={kycFilter} onChange={(e) => { setKycFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
            <option value="">All KYC Status</option>
            <option value="PENDING">Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="INCOMPLETE">Incomplete</option>
          </select>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Client Code</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Name</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Phone</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Email</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">City</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Group Head</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">KYC</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Created</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500">Loading...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="8" className="px-4 py-12 text-center text-gray-500">No clients found. Add your first client to get started.</td></tr>
              ) : (
                clients.map((c, idx) => (
                  <tr key={c.id} onClick={() => navigate(`/insurance/clients/${c.id}`)}
                    className={`border-t border-gray-100 cursor-pointer hover:bg-teal-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-4 py-3 font-medium text-teal-600">{c.clientCode}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || <span className="text-orange-500 text-xs">Missing</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{c.email || <span className="text-orange-500 text-xs">Missing</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{c.city || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{c.groupHeadName || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${KYC_BADGE[c.kycStatus] || 'bg-gray-100 text-gray-800'}`}>
                        {c.kycStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(c.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <p className="text-sm text-gray-600">
              Showing {((page - 1) * 20) + 1}-{Math.min(page * 20, total)} of {formatIndianNumber(total)}
            </p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New Client</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddClient} className="p-6 space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input type="date" value={form.dateOfBirth} onChange={(e) => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                  <input type="text" value={form.panNumber} onChange={(e) => setForm(f => ({ ...f, panNumber: e.target.value.toUpperCase() }))}
                    maxLength={10} placeholder="ABCDE1234F"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Aadhar Number</label>
                  <input type="text" value={form.aadharNumber} onChange={(e) => setForm(f => ({ ...f, aadharNumber: e.target.value }))}
                    maxLength={12} placeholder="1234 5678 9012"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Group Head Name</label>
                  <input type="text" value={form.groupHeadName} onChange={(e) => setForm(f => ({ ...f, groupHeadName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={form.city} onChange={(e) => setForm(f => ({ ...f, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input type="text" value={form.state} onChange={(e) => setForm(f => ({ ...f, state: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Pincode</label>
                  <input type="text" value={form.pincode} onChange={(e) => setForm(f => ({ ...f, pincode: e.target.value }))}
                    maxLength={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea value={form.address} onChange={(e) => setForm(f => ({ ...f, address: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={submitting}
                  className="px-6 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  {submitting ? 'Creating...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsuranceClientsPage;
