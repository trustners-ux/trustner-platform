import React, { useEffect, useState } from 'react';
import { Search, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';

const InspectionPage = () => {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInspection, setSelectedInspection] = useState(null);

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const res = await api.get('/insurance/inspections');
      setInspections(res.data || []);
    } catch (err) {
      setError('Failed to load inspections');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (inspectionId) => {
    try {
      const res = await api.patch(`/insurance/inspections/${inspectionId}`, {
        status: 'Approved',
      });

      setInspections(
        inspections.map((insp) =>
          insp.id === inspectionId ? res.data : insp
        )
      );
      setSelectedInspection(null);
    } catch (err) {
      alert('Failed to approve inspection');
      console.error(err);
    }
  };

  const handleReject = async (inspectionId) => {
    try {
      const res = await api.patch(`/insurance/inspections/${inspectionId}`, {
        status: 'Rejected',
      });

      setInspections(
        inspections.map((insp) =>
          insp.id === inspectionId ? res.data : insp
        )
      );
      setSelectedInspection(null);
    } catch (err) {
      alert('Failed to reject inspection');
      console.error(err);
    }
  };

  const filteredInspections = inspections.filter((insp) =>
    !searchQuery ||
    insp.policyNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insp.vehicleReg.toLowerCase().includes(searchQuery.toLowerCase()) ||
    insp.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    const statusMap = {
      Pending: 'bg-yellow-100 text-yellow-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    };
    return statusMap[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inspections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vehicle Inspections</h1>
        <p className="text-gray-600 mt-2">Review and approve vehicle inspection reports</p>
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
            placeholder="Search by policy, vehicle reg, or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Inspections List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInspections.length > 0 ? (
          filteredInspections.map((inspection) => (
            <div
              key={inspection.id}
              onClick={() => setSelectedInspection(inspection)}
              className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">Policy</p>
                  <p className="text-lg font-bold text-gray-900">{inspection.policyNo}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(inspection.status)}`}>
                  {inspection.status}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="text-gray-600">Customer</p>
                  <p className="font-medium text-gray-900">{inspection.customerName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vehicle Reg</p>
                  <p className="font-medium text-gray-900">{inspection.vehicleReg}</p>
                </div>
                <div>
                  <p className="text-gray-600">Model</p>
                  <p className="font-medium text-gray-900">{inspection.vehicleModel}</p>
                </div>
                <div>
                  <p className="text-gray-600">Inspected Date</p>
                  <p className="font-medium text-gray-900">{inspection.inspectionDate}</p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedInspection(inspection);
                }}
                className="mt-4 w-full px-4 py-2 bg-teal-100 hover:bg-teal-200 text-teal-700 rounded-lg font-medium transition-colors"
              >
                View Details
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <p className="text-gray-500">No inspections found</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Inspection Details</h2>
              <button
                onClick={() => setSelectedInspection(null)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-4">Policy Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Policy Number</p>
                    <p className="font-medium text-gray-900">{selectedInspection.policyNo}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Customer</p>
                    <p className="font-medium text-gray-900">{selectedInspection.customerName}</p>
                  </div>
                </div>
              </div>

              {/* Vehicle Info */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Registration</p>
                    <p className="font-medium text-gray-900">{selectedInspection.vehicleReg}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Model</p>
                    <p className="font-medium text-gray-900">{selectedInspection.vehicleModel}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Manufacture Year</p>
                    <p className="font-medium text-gray-900">{selectedInspection.manufacturingYear}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Odometer Reading</p>
                    <p className="font-medium text-gray-900">{selectedInspection.odometerReading} km</p>
                  </div>
                </div>
              </div>

              {/* Inspection Photos */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Photos</h3>
                {selectedInspection.photos && selectedInspection.photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-3">
                    {selectedInspection.photos.map((photo, idx) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                        <img
                          src={photo.url}
                          alt={photo.type}
                          className="w-full h-full object-cover"
                        />
                        <p className="text-xs text-gray-600 p-1">{photo.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No photos available</p>
                )}
              </div>

              {/* Vaahan Data */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-4">Vaahan Data</h3>
                {selectedInspection.vaahanData ? (
                  <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg">
                    <div>
                      <p className="text-gray-600">Registration Class</p>
                      <p className="font-medium text-gray-900">{selectedInspection.vaahanData.regClass}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Status</p>
                      <p className="font-medium text-gray-900">{selectedInspection.vaahanData.status}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No Vaahan data available</p>
                )}
              </div>

              {/* Remarks */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-2">Inspector Remarks</h3>
                <p className="text-sm text-gray-700">{selectedInspection.remarks || 'No remarks'}</p>
              </div>

              {/* Action Buttons */}
              {selectedInspection.status === 'Pending' && (
                <div className="border-t border-gray-200 pt-6 flex gap-3">
                  <button
                    onClick={() => handleApprove(selectedInspection.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(selectedInspection.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectionPage;
