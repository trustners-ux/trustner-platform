import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';

const POSPManagement = () => {
  const navigate = useNavigate();
  const [posps, setPOSPs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: 'Individual',
    agentCode: '',
    documents: {},
  });

  const categories = ['Individual', 'Corporate', 'Corporate Group'];

  useEffect(() => {
    fetchPOSPs();
  }, []);

  const fetchPOSPs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/insurance/posp');
      setPOSPs(res.data || []);
    } catch (err) {
      setError('Failed to load POSP data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterPOSP = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/insurance/posp', formData);
      setPOSPs([...posps, res.data]);
      setShowModal(false);
      setFormStep(1);
      setFormData({
        name: '',
        email: '',
        phone: '',
        category: 'Individual',
        agentCode: '',
        documents: {},
      });
    } catch (err) {
      alert('Failed to register POSP');
      console.error(err);
    }
  };

  const filteredPOSPs = posps.filter((posp) =>
    !searchQuery ||
    posp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    posp.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    posp.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const statusMap = {
      Active: 'bg-green-100 text-green-800',
      Pending: 'bg-yellow-100 text-yellow-800',
      Suspended: 'bg-red-100 text-red-800',
      Inactive: 'bg-gray-100 text-gray-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading POSP data...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">POSP Management</h1>
          <p className="text-gray-600 mt-2">Register and manage insurance agents</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          Register POSP
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

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, code, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Code</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Name</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Category</th>
                <th className="px-6 py-3 text-left font-medium text-gray-900">Status</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Policies</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Premium</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Commission</th>
                <th className="px-6 py-3 text-right font-medium text-gray-900">Renewal Rate</th>
                <th className="px-6 py-3 text-center font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPOSPs.length > 0 ? (
                filteredPOSPs.map((posp, idx) => (
                  <tr
                    key={posp.id}
                    className={`border-t border-gray-200 ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } hover:bg-blue-50 transition-colors`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{posp.code}</td>
                    <td className="px-6 py-4 text-gray-600">{posp.name}</td>
                    <td className="px-6 py-4 text-gray-600">{posp.category}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(posp.status)}`}>
                        {posp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {formatIndianNumber(posp.policiesSold)}
                    </td>
                    <td className="px-6 py-4 text-right text-teal-600 font-bold">
                      {formatCurrency(posp.premium)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {formatCurrency(posp.commission)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 font-medium">
                      {posp.renewalRate}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => navigate(`/insurance/posp/${posp.id}`)}
                        className="text-teal-600 hover:text-teal-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                    No POSPs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Register New POSP</h2>
              <p className="text-sm text-gray-600 mt-1">Step {formStep} of 3</p>
            </div>

            <form onSubmit={handleRegisterPOSP} className="p-6 space-y-4">
              {/* Step 1: Personal Details */}
              {formStep === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Step 2: Documents */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-700 font-medium">Required Documents:</p>
                  <div className="space-y-2">
                    {['IRDAI License', 'PAN Card', 'Aadhar Card', 'Bank Details'].map((doc) => (
                      <label key={doc} className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-teal-600 rounded"
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              documents: {
                                ...formData.documents,
                                [doc]: e.target.checked,
                              },
                            })
                          }
                        />
                        <span className="text-sm text-gray-700">{doc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-teal-900 font-medium mb-3">Review Information:</p>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {formData.name}</p>
                      <p><strong>Email:</strong> {formData.email}</p>
                      <p><strong>Phone:</strong> {formData.phone}</p>
                      <p><strong>Category:</strong> {formData.category}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600">
                    By clicking Register, you confirm that all information is accurate and you agree to the terms and conditions.
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    if (formStep === 1) {
                      setShowModal(false);
                      setFormStep(1);
                    } else {
                      setFormStep(formStep - 1);
                    }
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  {formStep === 1 ? 'Cancel' : 'Back'}
                </button>
                <button
                  type={formStep === 3 ? 'submit' : 'button'}
                  onClick={() => {
                    if (formStep < 3) setFormStep(formStep + 1);
                  }}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
                >
                  {formStep === 3 ? 'Register' : 'Next'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default POSPManagement;
