import React, { useState, useMemo } from 'react'
import { ChevronLeft, Save, BarChart3 } from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { apiService } from '../../services/api'

const GOALS = [
  { id: 'retirement', name: 'Retirement', emoji: '🏖️' },
  { id: 'education', name: 'Child Education', emoji: '🎓' },
  { id: 'house', name: 'House Purchase', emoji: '🏠' },
  { id: 'wealth', name: 'Wealth Creation', emoji: '💰' },
  { id: 'emergency', name: 'Emergency Fund', emoji: '🆘' },
  { id: 'marriage', name: 'Marriage', emoji: '💍' },
  { id: 'car', name: 'Car Purchase', emoji: '🚗' },
  { id: 'vacation', name: 'Vacation', emoji: '✈️' },
  { id: 'custom', name: 'Custom Goal', emoji: '⭐' },
]

const INFLATION_RATE = 0.06
const EXPECTED_RETURN_RATE = 0.12

export default function GoalPlanner() {
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedGoal, setSelectedGoal] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showPlanner, setShowPlanner] = useState(false)

  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    targetAmountUnit: 'lakhs',
    timeline: 10,
    currentSavings: '',
    monthlySIP: '',
    riskProfile: location.state?.riskProfile || 'MODERATE',
  })

  const handleGoalSelect = (goal) => {
    setSelectedGoal(goal)
    setFormData((prev) => ({
      ...prev,
      goalName: goal.name !== 'Custom Goal' ? goal.name : '',
    }))
    setShowPlanner(true)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const getNormalizedAmount = () => {
    let amount = parseFloat(formData.targetAmount) || 0
    if (formData.targetAmountUnit === 'crores') {
      amount = amount * 10000000
    } else {
      amount = amount * 100000
    }
    return amount
  }

  const calculateSIP = useMemo(() => {
    const targetAmount = getNormalizedAmount()
    const currentSavings = parseFloat(formData.currentSavings) || 0
    const years = parseInt(formData.timeline) || 1
    const months = years * 12

    if (targetAmount === 0 || months === 0) {
      return {
        requiredSIP: 0,
        corpus: 0,
        totalInvestment: 0,
        returns: 0,
        isValid: false,
      }
    }

    const monthlyRate = EXPECTED_RETURN_RATE / 12
    const futureValue = targetAmount

    let futureValueCurrentSavings = currentSavings * Math.pow(1 + EXPECTED_RETURN_RATE / 12, months)
    let remainingAmount = futureValue - futureValueCurrentSavings

    if (remainingAmount <= 0) {
      return {
        requiredSIP: 0,
        corpus: futureValue,
        totalInvestment: currentSavings,
        returns: futureValue - currentSavings,
        isValid: true,
      }
    }

    const numerator = remainingAmount * monthlyRate
    const denominator = Math.pow(1 + monthlyRate, months) - 1
    const sip = numerator / denominator

    let totalSIPAmount = sip * months
    let totalInvestment = currentSavings + totalSIPAmount
    let returns = futureValue - totalInvestment

    return {
      requiredSIP: Math.max(0, sip),
      corpus: futureValue,
      totalInvestment: totalInvestment,
      returns: Math.max(0, returns),
      isValid: true,
    }
  }, [formData.targetAmount, formData.timeline, formData.currentSavings, formData.targetAmountUnit])

  const handleSaveGoal = async () => {
    if (!selectedGoal || !formData.targetAmount || !formData.monthlySIP) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = {
        goalId: selectedGoal.id,
        goalName: formData.goalName || selectedGoal.name,
        targetAmount: getNormalizedAmount(),
        timeline: parseInt(formData.timeline),
        currentSavings: parseFloat(formData.currentSavings) || 0,
        monthlySIP: parseFloat(formData.monthlySIP),
        riskProfile: formData.riskProfile,
        calculatedSIP: calculateSIP.requiredSIP,
        expectedCorpus: calculateSIP.corpus,
        timestamp: new Date(),
      }

      await apiService.post('/advisory/goals', payload)

      setTimeout(() => {
        navigate('/advisory/smart-recommend')
      }, 1500)
    } catch (err) {
      setError('Failed to save goal. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (!showPlanner) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Financial Goals Planner</h1>
            <p className="text-gray-300">Select a goal and plan your journey to achieve it</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleGoalSelect(goal)}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105 text-center"
              >
                <div className="text-5xl mb-3">{goal.emoji}</div>
                <h3 className="text-lg font-semibold text-[#0D1B3E]">{goal.name}</h3>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => setShowPlanner(false)}
          className="flex items-center gap-2 text-white hover:text-[#D4A843] mb-6 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Goals
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-4">
              <div className="text-6xl text-center mb-4">{selectedGoal.emoji}</div>
              <h2 className="text-2xl font-bold text-[#0D1B3E] text-center mb-2">{selectedGoal.name}</h2>
              <div className="border-t-2 border-gray-200 pt-4">
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-1">Target Amount</p>
                  <p className="text-2xl font-bold text-[#D4A843]">{formatCurrency(getNormalizedAmount())}</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-1">Timeline</p>
                  <p className="text-2xl font-bold text-[#0D1B3E]">{formData.timeline} years</p>
                </div>
                <div className="mb-4">
                  <p className="text-gray-600 text-sm mb-1">Current Savings</p>
                  <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(parseFloat(formData.currentSavings) || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h3 className="text-2xl font-bold text-[#0D1B3E] mb-6">Plan Your Goal</h3>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="space-y-6 mb-8">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Goal Name {selectedGoal.id === 'custom' && '*'}
                  </label>
                  <input
                    type="text"
                    name="goalName"
                    value={formData.goalName}
                    onChange={handleInputChange}
                    placeholder="Enter custom goal name"
                    disabled={selectedGoal.id !== 'custom'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Target Amount *</label>
                  <div className="flex gap-3">
                    <input
                      type="number"
                      name="targetAmount"
                      value={formData.targetAmount}
                      onChange={handleInputChange}
                      placeholder="Enter amount"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                    />
                    <select
                      name="targetAmountUnit"
                      value={formData.targetAmountUnit}
                      onChange={handleInputChange}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                    >
                      <option value="lakhs">Lakhs</option>
                      <option value="crores">Crores</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Investment Timeline: <span className="text-[#D4A843]">{formData.timeline} years</span>
                  </label>
                  <input
                    type="range"
                    name="timeline"
                    min="1"
                    max="30"
                    value={formData.timeline}
                    onChange={handleInputChange}
                    className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-[#D4A843]"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>1 year</span>
                    <span>30 years</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Current Savings</label>
                  <input
                    type="number"
                    name="currentSavings"
                    value={formData.currentSavings}
                    onChange={handleInputChange}
                    placeholder="₹ 0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly SIP Capacity *</label>
                  <input
                    type="number"
                    name="monthlySIP"
                    value={formData.monthlySIP}
                    onChange={handleInputChange}
                    placeholder="₹ 0"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Risk Profile</label>
                  <select
                    name="riskProfile"
                    value={formData.riskProfile}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                  >
                    <option value="CONSERVATIVE">Conservative</option>
                    <option value="MODERATELY CONSERVATIVE">Moderately Conservative</option>
                    <option value="MODERATE">Moderate</option>
                    <option value="MODERATELY AGGRESSIVE">Moderately Aggressive</option>
                    <option value="AGGRESSIVE">Aggressive</option>
                  </select>
                </div>
              </div>

              {calculateSIP.isValid && (
                <div className="bg-gradient-to-r from-[#0D1B3E] to-[#1a2a4e] rounded-xl p-6 mb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <p className="text-gray-300 text-sm mb-1">Required Monthly SIP</p>
                      <p className="text-3xl font-bold text-[#D4A843]">{formatCurrency(calculateSIP.requiredSIP)}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <p className="text-gray-300 text-sm mb-1">Expected Corpus</p>
                      <p className="text-3xl font-bold text-white">{formatCurrency(calculateSIP.corpus)}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <p className="text-gray-300 text-sm mb-1">Total Investment</p>
                      <p className="text-lg font-bold text-white">{formatCurrency(calculateSIP.totalInvestment)}</p>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-4">
                      <p className="text-gray-300 text-sm mb-1">Expected Returns</p>
                      <p className="text-lg font-bold text-[#10B981]">{formatCurrency(calculateSIP.returns)}</p>
                    </div>
                  </div>

                  <div className="mt-6 bg-white bg-opacity-10 rounded-lg p-4">
                    <p className="text-gray-300 text-sm mb-3">Investment vs Returns</p>
                    <div className="flex h-8 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(calculateSIP.totalInvestment / calculateSIP.corpus) * 100}%` }}
                      >
                        {Math.round((calculateSIP.totalInvestment / calculateSIP.corpus) * 100)}%
                      </div>
                      <div
                        className="bg-green-500 flex items-center justify-center text-white text-xs font-bold"
                        style={{ width: `${(calculateSIP.returns / calculateSIP.corpus) * 100}%` }}
                      >
                        {Math.round((calculateSIP.returns / calculateSIP.corpus) * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={handleSaveGoal}
                  disabled={loading || !formData.targetAmount || !formData.monthlySIP}
                  className="flex-1 bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" text="" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={20} />
                      Save Goal Plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
