import React, { useState, useEffect } from 'react'
import { Download, Check } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatCard from '../../components/common/StatCard'
import StatusBadge from '../../components/common/StatusBadge'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function PayoutsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [payouts, setPayouts] = useState([])
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState(null)
  const [bankRef, setBankRef] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, payoutsRes] = await Promise.all([
          apiService.get('/admin/payouts/stats'),
          apiService.get('/admin/payouts'),
        ])
        setStats(statsRes)
        setPayouts(payoutsRes)
      } catch (error) {
        console.error('Failed to fetch payouts:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleMarkPaid = async () => {
    if (!bankRef) return

    try {
      await apiService.patch(`/admin/payouts/${selectedPayout.id}/mark-paid`, {
        bankReference: bankRef,
      })
      setShowMarkPaidModal(false)
      setBankRef('')
      // Refresh data
      const payoutsRes = await apiService.get('/admin/payouts')
      setPayouts(payoutsRes)
    } catch (error) {
      console.error('Failed to mark payout as paid:', error)
    }
  }

  const columns = [
    { key: 'subBrokerName', label: 'Sub-Broker', sortable: true },
    { key: 'period', label: 'Period', sortable: true },
    { key: 'gross', label: 'Gross Amount', render: (val) => formatCurrency(val) },
    { key: 'deductions', label: 'Deductions', render: (val) => formatCurrency(val) },
    { key: 'net', label: 'Net Payable', render: (val) => formatCurrency(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="payout" />,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (val, row) => (
        <button
          onClick={() => {
            setSelectedPayout(row)
            setShowMarkPaidModal(true)
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          {row.status === 'PENDING' ? 'Approve' : 'Mark Paid'}
        </button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Payout Management"
        subtitle="Manage and track partner payouts"
        actions={[
          {
            label: 'Export',
            icon: Download,
            variant: 'secondary',
          },
        ]}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Pending"
          value={stats.totalPending || 0}
          format="currency"
          color="yellow"
        />
        <StatCard
          title="Processing"
          value={stats.processing || 0}
          format="currency"
          color="blue"
        />
        <StatCard
          title="Paid This Month"
          value={stats.paidThisMonth || 0}
          format="currency"
          color="green"
        />
      </div>

      {/* Payouts Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={payouts} />
      )}

      {/* Mark Paid Modal */}
      <Modal
        isOpen={showMarkPaidModal}
        onClose={() => {
          setShowMarkPaidModal(false)
          setBankRef('')
        }}
        title="Mark Payout as Paid"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Partner: <span className="font-semibold">{selectedPayout?.subBrokerName}</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Amount: <span className="font-semibold">{formatCurrency(selectedPayout?.net)}</span>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bank Reference Number
            </label>
            <input
              type="text"
              value={bankRef}
              onChange={(e) => setBankRef(e.target.value)}
              placeholder="UTR / Transaction ID"
              className="input-base"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={() => {
                setShowMarkPaidModal(false)
                setBankRef('')
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleMarkPaid}
              disabled={!bankRef}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Mark Paid
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
