import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  ArrowUpRight,
} from 'lucide-react'
import StatCard from '../../components/common/StatCard'
import PageHeader from '../../components/common/PageHeader'
import LineChart from '../../components/charts/LineChart'
import BarChart from '../../components/charts/BarChart'
import DataTable from '../../components/common/DataTable'
import { apiService } from '../../services/api'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function PartnerDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [aumTrend, setAumTrend] = useState([])
  const [commissionTrend, setCommissionTrend] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topClients, setTopClients] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, aumRes, commissionRes, transRes, clientsRes] = await Promise.all([
          apiService.get('/partner/dashboard/stats'),
          apiService.get('/partner/dashboard/aum-trend'),
          apiService.get('/partner/dashboard/commission-trend'),
          apiService.get('/partner/dashboard/recent-transactions'),
          apiService.get('/partner/dashboard/top-clients'),
        ])

        setStats(statsRes)
        setAumTrend(aumRes)
        setCommissionTrend(commissionRes)
        setRecentTransactions(transRes)
        setTopClients(clientsRes)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  const transactionColumns = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    { key: 'status', label: 'Status' },
  ]

  const clientColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'portfolioValue', label: 'Portfolio Value', render: (val) => formatCurrency(val) },
    { key: 'clients', label: 'SIP Book', render: (val) => formatCurrency(val) },
    { key: 'returns', label: 'Returns', render: (val) => `${val}%` },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Your business metrics at a glance"
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <StatCard
          title="Total AUM"
          value={stats.totalAUM || 0}
          change={8.5}
          icon={TrendingUp}
          color="blue"
          format="currency"
        />
        <StatCard
          title="SIP Book"
          value={stats.sipBook || 0}
          change={5.2}
          icon={Calendar}
          color="green"
          format="currency"
        />
        <StatCard
          title="Monthly Commission"
          value={stats.monthlyCommission || 0}
          icon={DollarSign}
          color="gold"
          format="currency"
        />
        <StatCard
          title="Active Clients"
          value={stats.activeClients || 0}
          change={3.1}
          icon={Users}
          color="purple"
          format="number"
        />
        <StatCard
          title="Upcoming SIPs"
          value={stats.upcomingSIPs || 0}
          icon={ArrowUpRight}
          color="teal"
          format="number"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LineChart
          data={aumTrend}
          xKey="month"
          yKey="aum"
          title="AUM Trend - Last 12 Months"
          colors={['#1565c0']}
        />
        <BarChart
          data={commissionTrend}
          xKey="month"
          yKey="commission"
          title="Monthly Commission"
          colors={['#f9a825']}
        />
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
          <DataTable columns={transactionColumns} data={recentTransactions} />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Clients by AUM</h3>
          <DataTable columns={clientColumns} data={topClients} />
        </div>
      </div>
    </div>
  )
}
