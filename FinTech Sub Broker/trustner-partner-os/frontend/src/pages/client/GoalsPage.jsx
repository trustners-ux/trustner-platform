import React, { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import Modal from '../../components/common/Modal'
import { apiService } from '../../services/api'
import { formatCurrency, formatDate, formatNumber } from '../../utils/formatters'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function GoalsPage() {
  const [loading, setLoading] = useState(true)
  const [goals, setGoals] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    targetDate: '',
    description: '',
  })

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await apiService.get('/client/goals')
        setGoals(data)
      } catch (error) {
        console.error('Failed to fetch goals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchGoals()
  }, [])

  const handleAddGoal = async (e) => {
    e.preventDefault()
    try {
      await apiService.post('/client/goals', formData)
      setShowModal(false)
      setFormData({
        name: '',
        targetAmount: '',
        targetDate: '',
        description: '',
      })
      // Refresh list
      const data = await apiService.get('/client/goals')
      setGoals(data)
    } catch (error) {
      console.error('Failed to add goal:', error)
    }
  }

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
        title="Financial Goals"
        subtitle="Plan and track your financial milestones"
        actions={[
          {
            label: 'Add Goal',
            icon: Plus,
            onClick: () => setShowModal(true),
          },
        ]}
      />

      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No goals yet</h3>
          <p className="text-gray-600 mb-6">Start planning your financial future by adding your first goal</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100
            const monthsRemaining = goal.monthsToTarget || 0
            const monthlySIPNeeded = monthsRemaining > 0 ? (goal.targetAmount - goal.currentAmount) / monthsRemaining : 0

            return (
              <div key={goal.id} className="card p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{goal.name}</h3>
                {goal.description && (
                  <p className="text-sm text-gray-600 mb-4">{goal.description}</p>
                )}

                <div className="space-y-4 mb-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Progress</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {progress.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Current Amount</p>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(goal.currentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Target Amount</p>
                      <p className="text-lg font-bold text-blue-600">
                        {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Remaining</p>
                      <p className="text-sm font-semibold text-red-600">
                        {formatCurrency(goal.targetAmount - goal.currentAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Monthly SIP Needed</p>
                      <p className="text-sm font-semibold text-teal-600">
                        {formatCurrency(monthlySIPNeeded)}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-1">Target Date</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {formatDate(goal.targetDate)}
                    </p>
                  </div>
                </div>

                <button className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                  View Details
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add New Goal"
        size="md"
      >
        <form onSubmit={handleAddGoal} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Home Down Payment, Child Education"
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Amount (₹)
            </label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Date
            </label>
            <input
              type="date"
              value={formData.targetDate}
              onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
              required
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes about this goal..."
              rows="3"
              className="input-base"
            />
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
              Add Goal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
