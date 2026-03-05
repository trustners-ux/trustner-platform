import React, { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import StatCard from '../../components/common/StatCard'
import LineChart from '../../components/charts/LineChart'
import PieChart from '../../components/charts/PieChart'
import DataTable from '../../components/common/DataTable'
import { apiService } from '../../services/api'
import { formatCurrency, formatPercentage, formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ClientPortfolio() {
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState({})
  const [holdings, setHoldings] = useState([])
  const [performanceData, setPerformanceData] = useState([])
  const [allocationData, setAllocationData] = useState([])

  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const [summaryRes, holdingsRes, perfRes, allocRes] = await Promise.all([
          apiService.get('/client/portfolio/summary'),
          apiService.get('/client/portfolio/holdings'),
          apiService.get('/client/portfolio/performance'),
          apiService.get('/client/portfolio/allocation'),
        ])

        setSummary(summaryRes)
        setHoldings(holdingsRes)
        setPerformanceData(perfRes)
        setAllocationData(allocRes)
      } catch (error) {
        console.error('Failed to fetch portfolio:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolio()
  }, [])

  const holdingsColumns = [
    { key: 'schemeName', label: 'Scheme Name', sortable: true },
    { key: 'units', label: 'Units', render: (val) => formatNumber(val) },
    { key: 'invested', label: 'Invested Amount', render: (val) => formatCurrency(val) },
    { key: 'currentValue', label: 'Current Value', render: (val) => formatCurrency(val) },
    {
      key: 'returns',
      label: 'Returns',
      render: (val) => (
        <span className={val >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {formatCurrency(val)}
        </span>
      ),
    },
    {
      key: 'returnPercentage',
      label: 'Returns %',
      render: (val) => (
        <span className={val >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
          {formatPercentage(val)}
        </span>
      ),
    },
    {
      key: 'allocation',
      label: 'Allocation %',
      render: (val) => <span>{val}%</span>,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Portfolio"
        subtitle="Overview of your investments and performance"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Invested"
          value={summary.totalInvested || 0}
          format="currency"
        />
        <StatCard
          title="Current Value"
          value={summary.currentValue || 0}
          format="currency"
          color="green"
        />
        <StatCard
          title="Total Returns"
          value={summary.totalReturns || 0}
          format="currency"
          color={summary.totalReturns >= 0 ? 'green' : 'red'}
          icon={TrendingUp}
        />
        <StatCard
          title="Returns %"
          value={summary.returnsPercentage || 0}
          format="percentage"
          color={summary.returnsPercentage >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <LineChart
            data={performanceData}
            xKey="date"
            yKey="value"
            title="Portfolio Performance"
            colors={['#1565c0', '#00897b']}
          />
        </div>
        <PieChart
          data={allocationData}
          title="Asset Allocation"
          colors={['#1565c0', '#00897b', '#f9a825', '#d32f2f', '#7b1fa2']}
        />
      </div>

      {/* Holdings Table */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Holdings</h2>
        <DataTable columns={holdingsColumns} data={holdings} />
      </div>
    </div>
  )
}
