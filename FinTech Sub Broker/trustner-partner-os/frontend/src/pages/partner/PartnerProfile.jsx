import React, { useState, useEffect } from 'react'
import { Upload, AlertCircle, CheckCircle, Save } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function PartnerProfile() {
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profile, setProfile] = useState({})
  const [documents, setDocuments] = useState([])
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadType, setUploadType] = useState('')

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [profileRes, docsRes] = await Promise.all([
          apiService.get('/partner/profile'),
          apiService.get('/partner/documents'),
        ])
        setProfile(profileRes)
        setDocuments(docsRes)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      await apiService.patch('/partner/profile', profile)
      alert('Profile saved successfully!')
    } catch (error) {
      console.error('Failed to save profile:', error)
      alert('Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Profile"
        subtitle="Manage your account and certifications"
      />

      <div className="space-y-8">
        {/* Profile Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={profile.name || ''}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile.email || ''}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                value={profile.phone || ''}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ARN
              </label>
              <input
                type="text"
                value={profile.arn || ''}
                disabled
                className="input-base bg-gray-50"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Profile
          </button>
        </div>

        {/* Bank Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bank Name
              </label>
              <input
                type="text"
                value={profile.bankName || ''}
                onChange={(e) => setProfile({ ...profile, bankName: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Number
              </label>
              <input
                type="text"
                value={profile.accountNumber || ''}
                onChange={(e) => setProfile({ ...profile, accountNumber: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                IFSC Code
              </label>
              <input
                type="text"
                value={profile.ifscCode || ''}
                onChange={(e) => setProfile({ ...profile, ifscCode: e.target.value })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Account Holder Name
              </label>
              <input
                type="text"
                value={profile.accountHolderName || ''}
                onChange={(e) => setProfile({ ...profile, accountHolderName: e.target.value })}
                className="input-base"
              />
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Bank Details
          </button>
        </div>

        {/* Certifications */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Certifications & Licenses</h2>
          <div className="space-y-4">
            {[
              { type: 'ARN', valid: true, expiryDate: '2025-12-31' },
              { type: 'NISM', valid: true, expiryDate: '2024-06-30' },
              { type: 'POSP', valid: false, expiryDate: '2023-12-31' },
            ].map((cert, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {cert.valid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{cert.type}</p>
                    <p className="text-sm text-gray-600">
                      {cert.valid ? 'Valid' : 'Expired'} till {formatDate(cert.expiryDate)}
                    </p>
                  </div>
                </div>
                <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <Upload className="w-4 h-4 inline mr-2" />
                  Update
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Documents</h2>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          </div>
          <div className="space-y-3">
            {documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{doc.name}</p>
                  <p className="text-sm text-gray-600">Uploaded {formatDate(doc.uploadedDate)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm font-medium px-3 py-1 rounded-full ${
                      doc.status === 'VERIFIED'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {doc.status}
                  </span>
                  <button className="text-blue-600 hover:text-blue-700 text-sm">Download</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => {
          setShowUploadModal(false)
          setUploadType('')
        }}
        title="Upload Document"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value)}
              className="input-base"
            >
              <option value="">Select Type</option>
              <option value="PAN">PAN Card</option>
              <option value="AADHAR">Aadhar Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="DRIVING_LICENSE">Driving License</option>
            </select>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input type="file" className="hidden" id="file-input" />
            <label
              htmlFor="file-input"
              className="cursor-pointer"
            >
              <p className="text-gray-600 mb-2">Drag and drop file here</p>
              <p className="text-sm text-blue-600 hover:text-blue-700">or click to browse</p>
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowUploadModal(false)
                setUploadType('')
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Upload
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
