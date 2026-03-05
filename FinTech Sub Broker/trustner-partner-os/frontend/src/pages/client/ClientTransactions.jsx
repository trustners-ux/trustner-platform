import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function ClientTransactions() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await apiService.get('/client/transactions')
        setTransactions(data)
        setFilteredTransactions(data)
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const handleDateFilter = () => {
    if (!startDate || !endDate) {
      setFilteredTransactions(transactions)
      return
    }

    const start = new Date(startDate)
    const end = new Date(endDate)

    const filtered = transactions.filter((t) => {
      const txDate = new Date(t.date)
      return txDate >= start && txDate <= end
    })

    setFilteredTransactions(filtered)
  }

  useEffect(() => {
    handleDateFilter()
  }, [startDate, endDate])

  const columns = [
    { key: 'date', label: 'Date', sortable: true, render: (val) => formatDate(val) },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'nav', label: 'NAV', render: (val) => formatCurrency(val) },
    { key: 'units', label: 'Units', render: (val) => formatNumber(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="transaction" />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="My Transactions"
        subtitle="View all your investment transactions"
        actions={[
          {
            label: 'Download Statement',
            icon: Download,
            variant: 'secondary',
            onClick: () => console.log('Download statement'),
          },
        ]}
      />

      {/* Filters */}
      <div className="card p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base"
            />
          </div>
          <button
            onClick={handleDateFilter}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Filter
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTransactions}
          emptyMessage={startDate && endDate ? 'No transactions found in this date range' : 'No transactions found'}
        />
      )}
    </div>
  )
}
