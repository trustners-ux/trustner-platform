import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle, Play } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatCard from '../../components/common/StatCard'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CompliancePage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [alerts, setAlerts] = useState([])
  const [filters, setFilters] = useState({ severity: '', resolved: '' })
  const [showResolveModal, setShowResolveModal] = useState(false)
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [resolutionNotes, setResolutionNotes] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, alertsRes] = await Promise.all([
          apiService.get('/admin/compliance/stats'),
          apiService.get('/admin/compliance/alerts'),
        ])
        setStats(statsRes)
        setAlerts(alertsRes)
      } catch (error) {
        console.error('Failed to fetch compliance data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleResolve = async () => {
    if (!resolutionNotes) return

    try {
      await apiService.patch(`/admin/compliance/alerts/${selectedAlert.id}/resolve`, {
        notes: resolutionNotes,
      })
      setShowResolveModal(false)
      setResolutionNotes('')
      // Refresh data
      const alertsRes = await apiService.get('/admin/compliance/alerts')
      setAlerts(alertsRes)
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const severityCounts = {
    CRITICAL: stats.criticalAlerts || 0,
    HIGH: stats.highAlerts || 0,
    MEDIUM: stats.mediumAlerts || 0,
    LOW: stats.lowAlerts || 0,
  }

  const columns = [
    { key: 'type', label: 'Alert Type', sortable: true },
    { key: 'subBrokerName', label: 'Sub-Broker', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'dueDate', label: 'Due Date', render: (val) => formatDate(val) },
    {
      key: 'severity',
      label: 'Severity',
      render: (val) => <StatusBadge status={val} variant="severity" />,
    },
    {
      key: 'status',
      label: 'Status',
      render: (val) => (val === 'RESOLVED' ? 'Resolved' : 'Open'),
    },
    {
      key: 'id',
      label: 'Actions',
      render: (val, row) =>
        row.status !== 'RESOLVED' ? (
          <button
            onClick={() => {
              setSelectedAlert(row)
              setShowResolveModal(true)
            }}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Resolve
          </button>
        ) : (
          <span className="text-green-600 text-sm font-medium">Resolved</span>
        ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Compliance Management"
        subtitle="Monitor and manage compliance alerts and requirements"
        actions={[
          {
            label: 'Run Scan',
            icon: Play,
            onClick: () => console.log('Run scan'),
          },
        ]}
      />

      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Critical"
          value={severityCounts.CRITICAL}
          format="number"
          color="red"
          icon={AlertCircle}
        />
        <StatCard
          title="High"
          value={severityCounts.HIGH}
          format="number"
          color="red"
          icon={AlertCircle}
        />
        <StatCard
          title="Medium"
          value={severityCounts.MEDIUM}
          format="number"
          color="yellow"
        />
        <StatCard
          title="Low"
          value={severityCounts.LOW}
          format="number"
          color="blue"
        />
      </div>

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Severity
            </label>
            <select
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
              className="input-base"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.resolved}
              onChange={(e) => setFilters({ ...filters, resolved: e.target.value })}
              className="input-base"
            >
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <input type="text" placeholder="Type or description..." className="input-base" />
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={alerts} />
      )}

      {/* Resolve Modal */}
      <Modal
        isOpen={showResolveModal}
        onClose={() => {
          setShowResolveModal(false)
          setResolutionNotes('')
        }}
        title="Resolve Alert"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Alert Type: <span className="font-semibold">{selectedAlert?.type}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Description: <span className="font-semibold">{selectedAlert?.description}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolution Notes
            </label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe how this alert was resolved..."
              rows="4"
              className="input-base"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowResolveModal(false)
                setResolutionNotes('')
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              disabled={!resolutionNotes}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
