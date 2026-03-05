import React, { useState, useEffect } from 'react'
import { Plus, Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import StatusBadge from '../../components/common/StatusBadge'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function SubBrokersManagement() {
  const [loading, setLoading] = useState(true)
  const [partners, setPartners] = useState([])
  const [filteredPartners, setFilteredPartners] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [filters, setFilters] = useState({ status: '', tier: '', branch: '' })
  const [formData, setFormData] = useState({ name: '', arn: '', status: 'PENDING', tier: 'TIER_3' })

  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const data = await apiService.get('/admin/sub-brokers')
        setPartners(data)
        setFilteredPartners(data)
      } catch (error) {
        console.error('Failed to fetch partners:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPartners()
  }, [])

  useEffect(() => {
    let filtered = partners

    if (filters.status) {
      filtered = filtered.filter((p) => p.status === filters.status)
    }
    if (filters.tier) {
      filtered = filtered.filter((p) => p.tier === filters.tier)
    }
    if (filters.branch) {
      filtered = filtered.filter((p) => p.branch === filters.branch)
    }

    setFilteredPartners(filtered)
  }, [filters, partners])

  const handleAddPartner = async (e) => {
    e.preventDefault()
    try {
      await apiService.post('/admin/sub-brokers', formData)
      setShowModal(false)
      setFormData({ name: '', arn: '', status: 'PENDING', tier: 'TIER_3' })
      // Refresh list
      const data = await apiService.get('/admin/sub-brokers')
      setPartners(data)
    } catch (error) {
      console.error('Failed to add partner:', error)
    }
  }

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'arn', label: 'ARN', sortable: true },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="partner" />,
    },
    { key: 'tier', label: 'Tier', sortable: true },
    { key: 'aum', label: 'AUM', render: (val) => formatCurrency(val) },
    { key: 'clients', label: 'Clients', render: (val) => formatNumber(val) },
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
        title="Sub-Brokers Management"
        subtitle="Manage and monitor all partner sub-brokers"
        actions={[
          {
            label: 'Add Sub-Broker',
            icon: Plus,
            onClick: () => setShowModal(true),
          },
          {
            label: 'Export',
            icon: Download,
            variant: 'secondary',
            onClick: () => console.log('Export'),
          },
        ]}
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-base"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tier
            </label>
            <select
              value={filters.tier}
              onChange={(e) => setFilters({ ...filters, tier: e.target.value })}
              className="input-base"
            >
              <option value="">All Tiers</option>
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
              <option value="TIER_3">Tier 3</option>
              <option value="ASSOCIATE">Associate</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Branch
            </label>
            <select
              value={filters.branch}
              onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
              className="input-base"
            >
              <option value="">All Branches</option>
              <option value="NORTH">North</option>
              <option value="SOUTH">South</option>
              <option value="EAST">East</option>
              <option value="WEST">West</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name or ARN..."
              className="input-base"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={filteredPartners} />
      )}

      {/* Add Partner Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Sub-Broker"
        size="md"
      >
        <form onSubmit={handleAddPartner} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Name
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
              ARN
            </label>
            <input
              type="text"
              value={formData.arn}
              onChange={(e) => setFormData({ ...formData, arn: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tier
            </label>
            <select
              value={formData.tier}
              onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
              className="input-base"
            >
              <option value="TIER_1">Tier 1</option>
              <option value="TIER_2">Tier 2</option>
              <option value="TIER_3">Tier 3</option>
              <option value="ASSOCIATE">Associate</option>
            </select>
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
              Add Partner
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
