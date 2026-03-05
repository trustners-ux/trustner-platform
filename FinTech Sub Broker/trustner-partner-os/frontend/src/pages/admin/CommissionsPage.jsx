import React, { useState, useEffect } from 'react'
import { Upload, Download, Calculator } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatCard from '../../components/common/StatCard'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CommissionsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [commissions, setCommissions] = useState([])
  const [period, setPeriod] = useState('2024-01')
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, commissionsRes] = await Promise.all([
          apiService.get(`/admin/commissions/stats?period=${period}`),
          apiService.get(`/admin/commissions?period=${period}`),
        ])
        setStats(statsRes)
        setCommissions(commissionsRes)
      } catch (error) {
        console.error('Failed to fetch commissions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period])

  const columns = [
    { key: 'subBrokerName', label: 'Sub-Broker', sortable: true },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'gross', label: 'Gross Commission', render: (val) => formatCurrency(val) },
    { key: 'tds', label: 'TDS', render: (val) => formatCurrency(val) },
    { key: 'net', label: 'Net Commission', render: (val) => formatCurrency(val) },
    { key: 'share', label: 'Share %', render: (val) => `${val}%` },
  ]

  return (
    <div>
      <PageHeader
        title="Commission Management"
        subtitle="Track and manage partner commissions"
        actions={[
          {
            label: 'Import RTA',
            icon: Upload,
            onClick: () => setShowUploadModal(true),
          },
          {
            label: 'Export',
            icon: Download,
            variant: 'secondary',
          },
        ]}
      />

      {/* Period Selector */}
      <div className="card p-6 mb-6">
        <div className="flex items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Period
            </label>
            <input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="input-base"
            />
          </div>
          <button className="btn-primary">
            <Calculator className="w-4 h-4 mr-2 inline" />
            Calculate
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total Gross"
          value={stats.totalGross || 0}
          format="currency"
        />
        <StatCard
          title="TDS Deducted"
          value={stats.tdsDeducted || 0}
          format="currency"
          color="red"
        />
        <StatCard
          title="GST"
          value={stats.gst || 0}
          format="currency"
          color="yellow"
        />
        <StatCard
          title="Net Payable"
          value={stats.netPayable || 0}
          format="currency"
          color="green"
        />
        <StatCard
          title="Trustner Revenue"
          value={stats.trustnerRevenue || 0}
          format="currency"
          color="blue"
        />
      </div>

      {/* Commission Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={commissions} />
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Import RTA File"
        size="md"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <p className="text-gray-600 mb-2">Drag and drop your RTA file here</p>
            <p className="text-sm text-gray-500">or</p>
            <input
              type="file"
              accept=".xlsx,.csv"
              className="mt-2 hidden"
              id="file-input"
            />
            <label
              htmlFor="file-input"
              className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
            >
              Select File
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setShowUploadModal(false)}
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
