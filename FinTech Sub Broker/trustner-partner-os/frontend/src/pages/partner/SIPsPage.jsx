import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatCard from '../../components/common/StatCard'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function SIPsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [sips, setSips] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState([])
  const [schemes, setSchemes] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    schemeId: '',
    amount: '',
    frequency: 'MONTHLY',
    startDate: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, sipsRes, clientsRes, schemesRes] = await Promise.all([
          apiService.get('/partner/sips/stats'),
          apiService.get('/partner/sips'),
          apiService.get('/partner/clients'),
          apiService.get('/partner/schemes'),
        ])
        setStats(statsRes)
        setSips(sipsRes)
        setClients(clientsRes)
        setSchemes(schemesRes)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddSIP = async (e) => {
    e.preventDefault()
    try {
      await apiService.post('/partner/sips', formData)
      setShowModal(false)
      setFormData({
        clientId: '',
        schemeId: '',
        amount: '',
        frequency: 'MONTHLY',
        startDate: '',
      })
      // Refresh list
      const data = await apiService.get('/partner/sips')
      setSips(data)
    } catch (error) {
      console.error('Failed to add SIP:', error)
    }
  }

  const columns = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'nextDueDate', label: 'Next Due', render: (val) => formatDate(val) },
    { key: 'installments', label: 'Installments' },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="transaction" />,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (val) => (
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          Edit
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="SIPs"
        subtitle="Manage Systematic Investment Plans"
        actions={[
          {
            label: 'Create SIP',
            icon: Plus,
            onClick: () => setShowModal(true),
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total SIP Book"
          value={stats.totalSIPBook || 0}
          format="currency"
        />
        <StatCard
          title="Active SIPs"
          value={stats.activeSIPs || 0}
          format="number"
          color="green"
        />
        <StatCard
          title="Paused"
          value={stats.pausedSIPs || 0}
          format="number"
          color="yellow"
        />
        <StatCard
          title="This Month"
          value={stats.thisMonthSIPs || 0}
          format="currency"
          color="blue"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={sips} />
      )}

      {/* Add SIP Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Create New SIP"
        size="md"
      >
        <form onSubmit={handleAddSIP} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              className="input-base"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheme
            </label>
            <select
              value={formData.schemeId}
              onChange={(e) => setFormData({ ...formData, schemeId: e.target.value })}
              required
              className="input-base"
            >
              <option value="">Select Scheme</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Amount (₹)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Frequency
            </label>
            <select
              value={formData.frequency}
              onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
              className="input-base"
            >
              <option value="MONTHLY">Monthly</option>
              <option value="QUARTERLY">Quarterly</option>
              <option value="SEMI_ANNUAL">Semi-Annual</option>
              <option value="ANNUAL">Annual</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create SIP
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
