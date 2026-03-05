import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function MyClients() {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    pan: '',
    phone: '',
    email: '',
    dob: '',
    riskProfile: 'MODERATE',
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await apiService.get('/partner/clients')
        setClients(data)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const handleAddClient = async (e) => {
    e.preventDefault()
    if (step < 3) {
      setStep(step + 1)
      return
    }

    try {
      await apiService.post('/partner/clients', formData)
      setShowModal(false)
      setStep(1)
      setFormData({
        name: '',
        pan: '',
        phone: '',
        email: '',
        dob: '',
        riskProfile: 'MODERATE',
      })
      // Refresh list
      const data = await apiService.get('/partner/clients')
      setClients(data)
    } catch (error) {
      console.error('Failed to add client:', error)
    }
  }

  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'pan', label: 'PAN', sortable: true },
    {
      key: 'kycStatus',
      label: 'KYC Status',
      render: (val) => <StatusBadge status={val} variant="kyc" />,
    },
    { key: 'portfolioValue', label: 'Portfolio Value', render: (val) => formatCurrency(val) },
    { key: 'sipAmount', label: 'SIP Amount', render: (val) => formatCurrency(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="client" />,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (val) => (
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          View
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="My Clients"
        subtitle="Manage and monitor your clients"
        actions={[
          {
            label: 'Add Client',
            icon: Plus,
            onClick: () => {
              setShowModal(true)
              setStep(1)
            },
          },
        ]}
      />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={clients} />
      )}

      {/* Add Client Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setStep(1)
        }}
        title={`Add New Client - Step ${step} of 3`}
        size="md"
      >
        <form onSubmit={handleAddClient} className="space-y-4">
          {/* Step 1: Basic Details */}
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  PAN
                </label>
                <input
                  type="text"
                  value={formData.pan}
                  onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="input-base"
                />
              </div>
            </>
          )}

          {/* Step 2: Contact Details */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  required
                  className="input-base"
                />
              </div>
            </>
          )}

          {/* Step 3: Risk Assessment */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Risk Profile
                </label>
                <select
                  value={formData.riskProfile}
                  onChange={(e) => setFormData({ ...formData, riskProfile: e.target.value })}
                  className="input-base"
                >
                  <option value="CONSERVATIVE">Conservative</option>
                  <option value="MODERATE">Moderate</option>
                  <option value="AGGRESSIVE">Aggressive</option>
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  Review and confirm all details before submitting.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {step < 3 && (
              <button
                type="button"
                onClick={() => setStep(step + 1)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Next
              </button>
            )}
            {step === 3 && (
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Client
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setShowModal(false)
                setStep(1)
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
