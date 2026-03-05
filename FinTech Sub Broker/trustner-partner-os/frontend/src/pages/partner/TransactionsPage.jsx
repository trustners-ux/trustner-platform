import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import DataTable from '../../components/common/DataTable'
import Modal from '../../components/common/Modal'
import StatusBadge from '../../components/common/StatusBadge'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function TransactionsPage() {
  const [loading, setLoading] = useState(true)
  const [transactions, setTransactions] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [clients, setClients] = useState([])
  const [schemes, setSchemes] = useState([])
  const [formData, setFormData] = useState({
    clientId: '',
    type: 'LUMPSUM',
    schemeId: '',
    amount: '',
    paymentMode: 'NETBANKING',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, clientsRes, schemesRes] = await Promise.all([
          apiService.get('/partner/transactions'),
          apiService.get('/partner/clients'),
          apiService.get('/partner/schemes'),
        ])
        setTransactions(transRes)
        setClients(clientsRes)
        setSchemes(schemesRes)
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddTransaction = async (e) => {
    e.preventDefault()
    try {
      await apiService.post('/partner/transactions', formData)
      setShowModal(false)
      setFormData({
        clientId: '',
        type: 'LUMPSUM',
        schemeId: '',
        amount: '',
        paymentMode: 'NETBANKING',
      })
      // Refresh list
      const data = await apiService.get('/partner/transactions')
      setTransactions(data)
    } catch (error) {
      console.error('Failed to add transaction:', error)
    }
  }

  const columns = [
    { key: 'clientName', label: 'Client', sortable: true },
    { key: 'schemeName', label: 'Scheme', sortable: true },
    { key: 'type', label: 'Type', sortable: true },
    { key: 'amount', label: 'Amount', render: (val) => formatCurrency(val) },
    { key: 'units', label: 'Units', render: (val) => formatNumber(val) },
    { key: 'nav', label: 'NAV', render: (val) => formatCurrency(val) },
    { key: 'date', label: 'Date', render: (val) => formatDate(val) },
    {
      key: 'status',
      label: 'Status',
      render: (val) => <StatusBadge status={val} variant="transaction" />,
    },
  ]

  return (
    <div>
      <PageHeader
        title="Transactions"
        subtitle="Manage client investment transactions"
        actions={[
          {
            label: 'New Transaction',
            icon: Plus,
            onClick: () => setShowModal(true),
          },
        ]}
      />

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <DataTable columns={columns} data={transactions} />
      )}

      {/* Add Transaction Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="New Transaction"
        size="md"
      >
        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client
            </label>
            <select
              value={formData.clientId}
              onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
              required
              className="input-base"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="input-base"
            >
              <option value="LUMPSUM">Lump Sum</option>
              <option value="SIP">SIP</option>
              <option value="REDEMPTION">Redemption</option>
              <option value="SWITCH">Switch</option>
              <option value="STP">STP</option>
              <option value="SWP">SWP</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scheme
            </label>
            <select
              value={formData.schemeId}
              onChange={(e) => setFormData({ ...formData, schemeId: e.target.value })}
              required
              className="input-base"
            >
              <option value="">Select Scheme</option>
              {schemes.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (₹)
            </label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Mode
            </label>
            <select
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
              className="input-base"
            >
              <option value="NETBANKING">Net Banking</option>
              <option value="CHEQUE">Cheque</option>
              <option value="MANDATE">Mandate</option>
              <option value="RTGS">RTGS/NEFT</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Submit Transaction
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
