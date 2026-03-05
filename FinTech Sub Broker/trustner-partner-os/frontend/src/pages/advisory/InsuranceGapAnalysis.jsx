import React, { useState } from 'react'
import { Play, Download, Share2, AlertCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { apiService } from '../../services/api'

const CircularProgressIndicator = ({ score, label, status }) => {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score <= 30) return '#EF4444'
    if (score <= 60) return '#F59E0B'
    if (score <= 80) return '#FBBF24'
    return '#10B981'
  }

  const getStatus = () => {
    if (score <= 30) return 'Critical Gaps'
    if (score <= 60) return 'Needs Attention'
    if (score <= 80) return 'Moderate Coverage'
    return 'Well Protected'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32 mb-4">
        <svg width="128" height="128" className="transform -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8" />
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#0D1B3E]">{Math.round(score)}</span>
          <span className="text-xs text-gray-600">out of 100</span>
        </div>
      </div>
      <h3 className="text-lg font-bold text-[#0D1B3E] text-center">{label}</h3>
      <p className="text-sm font-semibold mt-2" style={{ color: getColor() }}>
        {getStatus()}
      </p>
    </div>
  )
}

export default function InsuranceGapAnalysis() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)

  const [formData, setFormData] = useState({
    age: '',
    income: '',
    dependents: '',
    lifeInsurance: '',
    healthInsurance: '',
    motorInsurance: false,
    loans: '',
    expenses: '',
    cityType: 'metro',
  })

  const handleInputChange = (e) => {
    const { name, type, checked, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const calculateGaps = async () => {
    if (!formData.age || !formData.income || !formData.dependents || !formData.expenses) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const age = parseInt(formData.age)
      const income = parseFloat(formData.income)
      const dependents = parseInt(formData.dependents)
      const expenses = parseFloat(formData.expenses)
      const lifeInsurance = parseFloat(formData.lifeInsurance) || 0
      const healthInsurance = parseFloat(formData.healthInsurance) || 0

      const idealLifeCover = dependents > 0 ? income * (12 - (age - 25) / 5) * 1.5 : 0
      const lifeInsuranceGap = Math.max(0, idealLifeCover - lifeInsurance)
      const estimatedTermPremium = (idealLifeCover / 100000) * (10 + Math.max(0, age - 35))

      const idealHealthCover = income > 5000000 ? 1500000 : income > 2000000 ? 1000000 : 500000
      const healthInsuranceGap = Math.max(0, idealHealthCover - healthInsurance)
      const estimatedHealthPremium = healthInsuranceGap / 100000 * 25

      const superTopupNeeded = healthInsuranceGap > 500000
      const criticalIllnessCover = income * 0.4

      const motorStatus = formData.motorInsurance ? 'Covered' : 'Not Covered'

      const lifeScore = lifeInsuranceGap === 0 ? 100 : Math.max(0, 100 - (lifeInsuranceGap / idealLifeCover) * 100)
      const healthScore = healthInsuranceGap === 0 ? 100 : Math.max(0, 100 - (healthInsuranceGap / idealHealthCover) * 100)
      const motorScore = formData.motorInsurance ? 100 : 0
      const criticalScore = 70

      const overallScore = (lifeScore + healthScore + motorScore + criticalScore) / 4

      const actionItems = []
      if (lifeInsuranceGap > 0) {
        actionItems.push({
          priority: 'HIGH',
          action: `Secure ₹${Math.round(lifeInsuranceGap / 100000)} L term life insurance cover`,
          reason: `Current gap: ${Math.round(lifeInsuranceGap / 100000)} L`,
        })
      }
      if (!formData.motorInsurance) {
        actionItems.push({
          priority: 'HIGH',
          action: 'Get comprehensive motor insurance',
          reason: 'Essential for vehicle protection and legal compliance',
        })
      }
      if (healthInsuranceGap > 0) {
        actionItems.push({
          priority: 'MEDIUM',
          action: `Increase health cover by ₹${Math.round(healthInsuranceGap / 100000)} L`,
          reason: 'Address gap in health coverage',
        })
      }
      if (superTopupNeeded) {
        actionItems.push({
          priority: 'MEDIUM',
          action: 'Add super top-up health insurance',
          reason: 'Protect against catastrophic health events',
        })
      }
      if (dependents > 0) {
        actionItems.push({
          priority: 'MEDIUM',
          action: `Secure ₹${Math.round(criticalIllnessCover / 100000)} L critical illness cover`,
          reason: 'Protect dependents from income loss due to illness',
        })
      }

      const analysisResults = {
        lifeInsurance: {
          ideal: idealLifeCover,
          current: lifeInsurance,
          gap: lifeInsuranceGap,
          premium: estimatedTermPremium,
          score: lifeScore,
        },
        healthInsurance: {
          ideal: idealHealthCover,
          current: healthInsurance,
          gap: healthInsuranceGap,
          premium: estimatedHealthPremium,
          superTopup: superTopupNeeded,
          score: healthScore,
        },
        motorInsurance: {
          status: motorStatus,
          priority: !formData.motorInsurance ? 'HIGH' : 'DONE',
          score: motorScore,
        },
        criticalIllness: {
          recommendation: criticalIllnessCover,
          score: criticalScore,
        },
        overallScore: Math.round(overallScore),
        actionItems: actionItems.sort((a, b) => {
          const priorityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 }
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }),
      }

      await apiService.post('/advisory/insurance-gap', {
        formData,
        results: analysisResults,
        timestamp: new Date(),
      })

      setResults(analysisResults)
    } catch (err) {
      setError('Failed to run analysis. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Insurance Gap Analysis Results</h1>
              <p className="text-gray-300">Comprehensive insurance coverage assessment</p>
            </div>
            <button
              onClick={() => setResults(null)}
              className="text-white hover:text-[#D4A843] transition-colors"
            >
              ← New Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <CircularProgressIndicator
                score={results.overallScore}
                label="Overall Insurance Score"
                status={results.overallScore > 80 ? 'Well Protected' : 'Needs Attention'}
              />
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#0D1B3E] mb-4">Life Insurance</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ideal Cover</p>
                    <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(results.lifeInsurance.ideal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Cover</p>
                    <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(results.lifeInsurance.current)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Gap</p>
                    <p className={`text-lg font-bold ${results.lifeInsurance.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(results.lifeInsurance.gap)}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Est. Premium (Annual)</p>
                    <p className="text-lg font-bold text-[#D4A843]">{formatCurrency(results.lifeInsurance.premium)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#0D1B3E] mb-4">Health Insurance</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ideal Cover</p>
                    <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(results.healthInsurance.ideal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Cover</p>
                    <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(results.healthInsurance.current)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Gap</p>
                    <p className={`text-lg font-bold ${results.healthInsurance.gap > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(results.healthInsurance.gap)}
                    </p>
                  </div>
                  {results.healthInsurance.superTopup && (
                    <div className="bg-yellow-50 p-2 rounded border-l-2 border-yellow-500">
                      <p className="text-xs text-yellow-800 font-semibold">Super top-up recommended</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-[#0D1B3E] mb-4">Additional Coverage</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Motor Insurance</p>
                    <p
                      className={`text-lg font-bold ${results.motorInsurance.priority === 'DONE' ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {results.motorInsurance.status}
                    </p>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <p className="text-sm text-gray-600 mb-1">Critical Illness Cover</p>
                    <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(results.criticalIllness.recommendation)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
              <AlertCircle size={28} className="text-[#D4A843]" />
              Prioritized Action Items
            </h2>

            <div className="space-y-4">
              {results.actionItems.map((item, idx) => {
                const priorityColors = {
                  HIGH: { bg: 'bg-red-50', badge: 'bg-red-600', text: 'text-red-600' },
                  MEDIUM: { bg: 'bg-yellow-50', badge: 'bg-yellow-600', text: 'text-yellow-600' },
                  LOW: { bg: 'bg-blue-50', badge: 'bg-blue-600', text: 'text-blue-600' },
                }
                const colors = priorityColors[item.priority]

                return (
                  <div key={idx} className={`${colors.bg} rounded-lg p-4 border-l-4 ${colors.badge}`}>
                    <div className="flex items-start gap-4">
                      <div className={`${colors.badge} text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0`}>
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-[#0D1B3E]">{item.action}</h3>
                          <span className={`${colors.badge} text-white text-xs font-bold px-2 py-1 rounded`}>{item.priority}</span>
                        </div>
                        <p className="text-sm text-gray-700">{item.reason}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-3 px-6 rounded-lg transition-all">
              <Download size={20} />
              Generate Report
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-[#00897B] hover:bg-[#006b63] text-white font-semibold py-3 px-6 rounded-lg transition-all">
              <Share2 size={20} />
              Share with Client
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Insurance Gap Analysis</h1>
          <p className="text-gray-300">Comprehensive assessment of your insurance coverage</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          <div className="space-y-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="Enter your age"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Annual Income (₹) *</label>
                <input
                  type="number"
                  name="income"
                  value={formData.income}
                  onChange={handleInputChange}
                  placeholder="Enter annual income"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Dependents *</label>
                <input
                  type="number"
                  name="dependents"
                  value={formData.dependents}
                  onChange={handleInputChange}
                  placeholder="Enter number of dependents"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">City Type</label>
                <select
                  name="cityType"
                  value={formData.cityType}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                >
                  <option value="metro">Metro</option>
                  <option value="non-metro">Non-Metro</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Life Insurance (₹)</label>
                <input
                  type="number"
                  name="lifeInsurance"
                  value={formData.lifeInsurance}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Existing Health Insurance (₹)</label>
                <input
                  type="number"
                  name="healthInsurance"
                  value={formData.healthInsurance}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Outstanding Loans (₹)</label>
                <input
                  type="number"
                  name="loans"
                  value={formData.loans}
                  onChange={handleInputChange}
                  placeholder="Enter amount"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Monthly Expenses (₹) *</label>
                <input
                  type="number"
                  name="expenses"
                  value={formData.expenses}
                  onChange={handleInputChange}
                  placeholder="Enter monthly expenses"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                name="motorInsurance"
                checked={formData.motorInsurance}
                onChange={handleInputChange}
                className="w-5 h-5 text-[#D4A843] cursor-pointer"
              />
              <label className="text-gray-700 font-medium cursor-pointer">I have comprehensive motor insurance</label>
            </div>
          </div>

          <button
            onClick={calculateGaps}
            disabled={loading}
            className="w-full bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" text="" />
                Analyzing...
              </>
            ) : (
              <>
                <Play size={20} />
                Run Analysis
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
