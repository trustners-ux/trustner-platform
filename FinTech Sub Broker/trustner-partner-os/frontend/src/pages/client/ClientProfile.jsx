import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ClientProfile() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState({})

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await apiService.get('/client/profile')
        setProfile(data)
      } catch (error) {
        console.error('Failed to fetch profile:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [])

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
        subtitle="View and manage your account information"
      />

      <div className="space-y-8">
        {/* Personal Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Full Name</p>
              <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Email Address</p>
              <p className="text-lg font-semibold text-gray-900">{profile.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Phone Number</p>
              <p className="text-lg font-semibold text-gray-900">{profile.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
              <p className="text-lg font-semibold text-gray-900">{formatDate(profile.dob)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">PAN</p>
              <p className="text-lg font-semibold text-gray-900">{profile.pan}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Aadhar</p>
              <p className="text-lg font-semibold text-gray-900">XXXX XXXX {profile.aadharLastFour}</p>
            </div>
          </div>
        </div>

        {/* KYC Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">KYC Status</h2>
          <div className="flex items-start gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">KYC Verified</p>
              <p className="text-sm text-green-700 mt-1">
                Verified on {formatDate(profile.kycVerifiedDate)}
              </p>
            </div>
          </div>
        </div>

        {/* Nominee Information */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Nominee Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Nominee Name</p>
              <p className="text-lg font-semibold text-gray-900">{profile.nomineeName || 'Not specified'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Relationship</p>
              <p className="text-lg font-semibold text-gray-900">{profile.nomineeRelationship || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Nomination Date</p>
              <p className="text-lg font-semibold text-gray-900">
                {profile.nominationDate ? formatDate(profile.nominationDate) : 'Not provided'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Nominee PAN</p>
              <p className="text-lg font-semibold text-gray-900">{profile.nomineePan || '-'}</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Update Nominee
          </button>
        </div>

        {/* Bank Account Details */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Bank Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Bank Name</p>
              <p className="text-lg font-semibold text-gray-900">{profile.bankName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Number</p>
              <p className="text-lg font-semibold text-gray-900">XXXX XXXX {profile.accountNumberLast4}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Account Type</p>
              <p className="text-lg font-semibold text-gray-900">{profile.accountType}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">IFSC Code</p>
              <p className="text-lg font-semibold text-gray-900">{profile.ifscCode}</p>
            </div>
          </div>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Update Bank Details
          </button>
        </div>

        {/* Risk Profile */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Risk Profile</h2>
          <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div>
              <p className="font-semibold text-blue-900">{profile.riskProfile}</p>
              <p className="text-sm text-blue-700 mt-1">
                Last updated {formatDate(profile.riskProfileDate)}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-4">
            Your risk profile determines the types of mutual funds and investment products we recommend for you.
          </p>
          <button className="mt-4 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Update Risk Profile
          </button>
        </div>

        {/* Contact Preferences */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Communication Preferences</h2>
          <div className="space-y-4">
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="ml-3 text-gray-700">Receive email statements</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="ml-3 text-gray-700">Receive SMS notifications</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="rounded" />
              <span className="ml-3 text-gray-700">Marketing communications</span>
            </label>
          </div>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  )
}
