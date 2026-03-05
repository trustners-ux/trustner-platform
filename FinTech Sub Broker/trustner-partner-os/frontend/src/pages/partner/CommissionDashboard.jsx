import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import LineChart from '../../components/charts/LineChart'
import DataTable from '../../components/common/DataTable'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function CommissionDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [forecast, setForecast] = useState([])
  const [history, setHistory] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, forecastRes, historyRes] = await Promise.all([
          apiService.get('/partner/commission/stats'),
          apiService.get('/partner/commission/forecast'),
          apiService.get('/partner/commission/history'),
        ])
        setStats(statsRes)
        setForecast(forecastRes)
        setHistory(historyRes)
      } catch (error) {
        console.error('Failed to fetch commission data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const historyColumns = [
    { key: 'period', label: 'Period', sortable: true },
    { key: 'gross', label: 'Gross Commission', render: (val) => formatCurrency(val) },
    { key: 'tds', label: 'TDS', render: (val) => formatCurrency(val) },
    { key: 'gst', label: 'GST', render: (val) => formatCurrency(val) },
    { key: 'net', label: 'Net Commission', render: (val) => formatCurrency(val) },
    { key: 'status', label: 'Status' },
    {
      key: 'id',
      label: 'Actions',
      render: (val) => (
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
          <Download className="w-4 h-4" />
          Download
        </button>
      ),
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
        title="Commission Dashboard"
        subtitle="Track your earnings and commissions"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="This Month"
          value={stats.thisMonth || 0}
          format="currency"
        />
        <StatCard
          title="This Year"
          value={stats.thisYear || 0}
          format="currency"
          color="green"
        />
        <StatCard
          title="Pending Payout"
          value={stats.pendingPayout || 0}
          format="currency"
          color="yellow"
        />
        <StatCard
          title="Average Monthly"
          value={stats.averageMonthly || 0}
          format="currency"
          color="blue"
        />
      </div>

      {/* Forecast Chart */}
      <div className="mb-8">
        <LineChart
          data={forecast}
          xKey="month"
          yKey="forecast"
          title="Commission Forecast - Next 6 Months"
          colors={['#f9a825']}
        />
      </div>

      {/* Commission History */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission History</h2>
      <DataTable columns={historyColumns} data={history} />
    </div>
  )
}
