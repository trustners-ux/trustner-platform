import React, { useState, useEffect } from 'react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function SIPTracker() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [sips, setSips] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, sipsRes, historyRes] = await Promise.all([
          apiService.get('/client/sips/stats'),
          apiService.get('/client/sips'),
          apiService.get('/client/sips/history'),
        ])
        setStats(statsRes)
        setSips(sipsRes)
        setHistory(historyRes)
      } catch (error) {
        console.error('Failed to fetch SIP data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const sipColumns = [
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'amount', label: 'Monthly Amount', render: (val) => formatCurrency(val) },
    { key: 'frequency', label: 'Frequency', sortable: true },
    { key: 'nextPaymentDate', label: 'Next Payment', render: (val) => formatDate(val) },
    { key: 'totalInvested', label: 'Total Invested', render: (val) => formatCurrency(val) },
    { key: 'currentValue', label: 'Current Value', render: (val) => formatCurrency(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="transaction" />,
    },
  ]

  const historyColumns = [
    { key: 'date', label: 'Date', sortable: true, render: (val) => formatDate(val) },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'units', label: 'Units', render: (val) => val.toFixed(4) },
    { key: 'nav', label: 'NAV', render: (val) => formatCurrency(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="transaction" />,
    },
  ]

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
        title="SIP Tracker"
        subtitle="Monitor your Systematic Investment Plans"
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
          title="Total Invested"
          value={stats.totalInvested || 0}
          format="currency"
          color="blue"
        />
        <StatCard
          title="Current Value"
          value={stats.currentValue || 0}
          format="currency"
          color="teal"
        />
      </div>

      {/* Active SIPs */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Active SIPs</h2>
        <DataTable columns={sipColumns} data={sips} />
      </div>

      {/* SIP History */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">SIP Installation History</h2>
        <DataTable columns={historyColumns} data={history} />
      </div>
    </div>
  )
}
