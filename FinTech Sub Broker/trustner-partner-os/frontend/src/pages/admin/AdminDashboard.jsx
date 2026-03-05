import React, { useState, useEffect } from 'react'
import {
  TrendingUp,
  Users,
  UserCheck,
  IndianRupee,
  AlertCircle,
  DollarSign,
} from 'lucide-react'
import StatCard from '../../components/common/StatCard'
import PageHeader from '../../components/common/PageHeader'
import AreaChart from '../../components/charts/AreaChart'
import BarChart from '../../components/charts/BarChart'
import PieChart from '../../components/charts/PieChart'
import DataTable from '../../components/common/DataTable'
import { apiService } from '../../services/api'
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [aumData, setAumData] = useState([])
  const [sipData, setSipData] = useState([])
  const [partners, setPartners] = useState([])
  const [productMix, setProductMix] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, aumRes, sipRes, partnersRes, productRes] = await Promise.all([
          apiService.get('/admin/dashboard/stats'),
          apiService.get('/admin/dashboard/aum-growth'),
          apiService.get('/admin/dashboard/sip-inflow'),
          apiService.get('/admin/dashboard/top-partners'),
          apiService.get('/admin/dashboard/product-mix'),
        ])

        setStats(statsRes)
        setAumData(aumRes)
        setSipData(sipRes)
        setPartners(partnersRes)
        setProductMix(productRes)
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

  const partnersColumns = [
    { key: 'code', label: 'Code', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'aum', label: 'AUM', render: (val) => formatCurrency(val) },
    { key: 'clients', label: 'Clients', render: (val) => formatNumber(val) },
    { key: 'commission', label: 'Commission', render: (val) => formatCurrency(val) },
  ]

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back! Here's your business overview."
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total AUM"
          value={stats.totalAUM || 0}
          change={12.5}
          icon={TrendingUp}
          color="blue"
          format="currency"
        />
        <StatCard
          title="Active Partners"
          value={stats.activePartners || 0}
          change={5.2}
          icon={Users}
          color="green"
          format="number"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients || 0}
          change={8.3}
          icon={UserCheck}
          color="purple"
          format="number"
        />
        <StatCard
          title="Monthly SIP Book"
          value={stats.monthlySIPBook || 0}
          change={-2.1}
          changeType="negative"
          icon={IndianRupee}
          color="teal"
          format="currency"
        />
        <StatCard
          title="Monthly Commission"
          value={stats.monthlyCommission || 0}
          change={15.4}
          icon={DollarSign}
          color="gold"
          format="currency"
        />
        <StatCard
          title="Compliance Alerts"
          value={stats.complianceAlerts || 0}
          icon={AlertCircle}
          color="red"
          format="number"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <AreaChart
          data={aumData}
          xKey="month"
          yKey="aum"
          title="AUM Growth - Last 12 Months"
          colors={['#1565c0']}
        />
        <BarChart
          data={sipData}
          xKey="month"
          yKey="amount"
          title="SIP Inflow - Last 12 Months"
          colors={['#00897b']}
        />
      </div>

      {/* Product Mix and Partners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <DataTable
            columns={partnersColumns}
            data={partners}
            emptyMessage="No partner data available"
          />
        </div>
        <PieChart
          data={productMix}
          title="Product Mix"
          colors={['#1565c0', '#00897b', '#f9a825', '#d32f2f', '#7b1fa2']}
        />
      </div>

      {/* Recent Activity */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="flex items-start gap-4 pb-4 border-b border-gray-200 last:border-b-0">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Partner registered new client</p>
                <p className="text-xs text-gray-600 mt-1">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
