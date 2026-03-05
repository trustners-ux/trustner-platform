import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatCard from '../../components/common/StatCard'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ClientsOverview() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [clients, setClients] = useState([])
  const [filteredClients, setFilteredClients] = useState([])
  const [filters, setFilters] = useState({ kycStatus: '', clientStatus: '', subBroker: '' })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, clientsRes] = await Promise.all([
          apiService.get('/admin/clients/stats'),
          apiService.get('/admin/clients'),
        ])
        setStats(statsRes)
        setClients(clientsRes)
        setFilteredClients(clientsRes)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    let filtered = clients

    if (filters.kycStatus) {
      filtered = filtered.filter((c) => c.kycStatus === filters.kycStatus)
    }
    if (filters.clientStatus) {
      filtered = filtered.filter((c) => c.status === filters.clientStatus)
    }
    if (filters.subBroker) {
      filtered = filtered.filter((c) => c.subBrokerId === filters.subBroker)
    }

    setFilteredClients(filtered)
  }, [filters, clients])

  const columns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'pan', label: 'PAN', sortable: true },
    {
      key: 'kycStatus',
      label: 'KYC Status',
      render: (val) => <StatusBadge status={val} variant="kyc" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="client" />,
    },
    { key: 'portfolioValue', label: 'Portfolio Value', render: (val) => formatCurrency(val) },
    { key: 'sipAmount', label: 'SIP Amount', render: (val) => formatCurrency(val) },
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
        title="Clients Overview"
        subtitle="Monitor all clients across the platform"
        actions={[
          {
            label: 'Export',
            icon: Download,
            variant: 'secondary',
            onClick: () => console.log('Export'),
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Clients"
          value={stats.totalClients || 0}
          format="number"
        />
        <StatCard
          title="KYC Pending"
          value={stats.kycPending || 0}
          format="number"
          color="yellow"
        />
        <StatCard
          title="Active"
          value={stats.activeClients || 0}
          format="number"
          color="green"
        />
        <StatCard
          title="Dormant"
          value={stats.dormantClients || 0}
          format="number"
          color="gray"
        />
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              KYC Status
            </label>
            <select
              value={filters.kycStatus}
              onChange={(e) => setFilters({ ...filters, kycStatus: e.target.value })}
              className="input-base"
            >
              <option value="">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Status
            </label>
            <select
              value={filters.clientStatus}
              onChange={(e) => setFilters({ ...filters, clientStatus: e.target.value })}
              className="input-base"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="DORMANT">Dormant</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sub-Broker
            </label>
            <select
              value={filters.subBroker}
              onChange={(e) => setFilters({ ...filters, subBroker: e.target.value })}
              className="input-base"
            >
              <option value="">All Sub-Brokers</option>
              <option value="SB001">SB001 - Partner A</option>
              <option value="SB002">SB002 - Partner B</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input
              type="text"
              placeholder="Name or Code..."
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
        <DataTable columns={columns} data={filteredClients} />
      )}
    </div>
  )
}
