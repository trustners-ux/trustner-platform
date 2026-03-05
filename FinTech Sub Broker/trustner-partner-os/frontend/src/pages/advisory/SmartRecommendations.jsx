import React, { useState, useEffect } from 'react'
import { TrendingUp, Mail, CheckCircle, AlertCircle, Zap } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { apiService } from '../../services/api'

const PortfolioGauge = ({ score }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  const getColor = () => {
    if (score < 40) return '#EF4444'
    if (score < 70) return '#F59E0B'
    return '#10B981'
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg width="96" height="96" className="transform -rotate-90">
          <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="6" />
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold text-[#0D1B3E]">{Math.round(score)}</span>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-700 mt-3 text-center">Portfolio Health</p>
    </div>
  )
}

export default function SmartRecommendations() {
  const [loading, setLoading] = useState(true)
  const [selectedClient, setSelectedClient] = useState('client1')
  const [clients, setClients] = useState([
    { id: 'client1', name: 'Rajesh Kumar', riskProfile: 'MODERATE' },
    { id: 'client2', name: 'Priya Sharma', riskProfile: 'AGGRESSIVE' },
    { id: 'client3', name: 'Amit Patel', riskProfile: 'CONSERVATIVE' },
  ])

  const [recommendations, setRecommendations] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true)
        const data = await apiService.get(`/advisory/recommendations/${selectedClient}`)
        setRecommendations(data)
      } catch (err) {
        console.error(err)
        setRecommendations(getMockRecommendations())
      } finally {
        setLoading(false)
      }
    }

    loadRecommendations()
  }, [selectedClient])

  const getMockRecommendations = () => {
    const mockMFRecommendations = [
      {
        category: 'Large Cap Funds',
        allocation: 35,
        risk: 'MEDIUM',
        sip: 10500,
        rationale: 'Blue-chip stocks with stable growth for wealth creation',
      },
      {
        category: 'Multi Cap Funds',
        allocation: 25,
        risk: 'MEDIUM-HIGH',
        sip: 7500,
        rationale: 'Diversified across market caps for balanced exposure',
      },
      {
        category: 'Balanced Funds',
        allocation: 20,
        risk: 'LOW-MEDIUM',
        sip: 6000,
        rationale: 'Mix of equity and debt for stability',
      },
      {
        category: 'Index Funds',
        allocation: 15,
        risk: 'MEDIUM',
        sip: 4500,
        rationale: 'Low-cost market tracking for long-term growth',
      },
      {
        category: 'International Equity',
        allocation: 5,
        risk: 'MEDIUM-HIGH',
        sip: 1500,
        rationale: 'Portfolio diversification with global exposure',
      },
    ]

    const mockInsuranceRecommendations = [
      {
        type: 'Term Life Insurance',
        priority: 'HIGH',
        cover: 7500000,
        estimatedPremium: 5625,
        urgency: 'Immediate',
      },
      {
        type: 'Health Insurance',
        priority: 'HIGH',
        cover: 1000000,
        estimatedPremium: 15000,
        urgency: 'Immediate',
      },
      {
        type: 'Critical Illness',
        priority: 'MEDIUM',
        cover: 2000000,
        estimatedPremium: 8500,
        urgency: '1-2 months',
      },
      {
        type: 'Motor Insurance',
        priority: 'MEDIUM',
        cover: 500000,
        estimatedPremium: 6000,
        urgency: '1-2 months',
      },
    ]

    return {
      portfolioScore: 72,
      totalMonthlyAllocation: 30000,
      mfRecommendations: mockMFRecommendations,
      insuranceRecommendations: mockInsuranceRecommendations,
      actionItems: [
        {
          step: 1,
          title: 'Complete Risk Assessment',
          description: 'Understand your risk tolerance and investment goals',
          completed: true,
        },
        {
          step: 2,
          title: 'Set Up MF Portfolio',
          description: 'Start SIPs in recommended mutual fund categories',
          completed: false,
        },
        {
          step: 3,
          title: 'Secure Term Insurance',
          description: 'Get adequate life insurance cover for your dependents',
          completed: false,
        },
        {
          step: 4,
          title: 'Setup Health Insurance',
          description: 'Ensure comprehensive health coverage for your family',
          completed: false,
        },
        {
          step: 5,
          title: 'Create Emergency Fund',
          description: 'Build 6-12 months of expenses in liquid funds',
          completed: false,
        },
        {
          step: 6,
          title: 'Review Quarterly',
          description: 'Monitor portfolio performance and rebalance as needed',
          completed: false,
        },
      ],
    }
  }

  const getRiskColor = (risk) => {
    const colors = {
      'LOW': '#10B981',
      'LOW-MEDIUM': '#3B82F6',
      'MEDIUM': '#F59E0B',
      'MEDIUM-HIGH': '#8B5CF6',
      'HIGH': '#EF4444',
    }
    return colors[risk] || '#6B7280'
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'HIGH': '#EF4444',
      'MEDIUM': '#F59E0B',
      'LOW': '#3B82F6',
    }
    return colors[priority] || '#6B7280'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading recommendations..." />
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
            <p className="text-gray-700">Failed to load recommendations. Please try again.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Smart Recommendations</h1>
              <p className="text-gray-300">Personalized MF & Insurance recommendations</p>
            </div>

            <div className="w-full md:w-auto">
              <label className="block text-sm font-semibold text-white mb-2">Select Client</label>
              <select
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843] bg-white"
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <h2 className="text-2xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
                <TrendingUp size={28} className="text-[#D4A843]" />
                Mutual Fund Recommendations
              </h2>

              <div className="space-y-4">
                {recommendations.mfRecommendations.map((fund, idx) => (
                  <div key={idx} className="border-2 border-gray-200 rounded-lg p-4 hover:border-[#D4A843] transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-bold text-[#0D1B3E]">{fund.category}</h3>
                        <p className="text-gray-600 text-sm mt-1">{fund.rationale}</p>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-2 bg-gray-100 px-3 py-1 rounded-full">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getRiskColor(fund.risk) }}
                          />
                          <span className="text-xs font-semibold text-gray-700">{fund.risk}</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Allocation</p>
                        <p className="text-xl font-bold text-[#D4A843]">{fund.allocation}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Suggested SIP</p>
                        <p className="text-xl font-bold text-[#0D1B3E]">{formatCurrency(fund.sip)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Annual (12 SIPs)</p>
                        <p className="text-xl font-bold text-gray-700">{formatCurrency(fund.sip * 12)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Total Monthly SIP:</strong> {formatCurrency(recommendations.totalMonthlyAllocation)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-white rounded-2xl shadow-lg p-8 flex flex-col items-center">
              <PortfolioGauge score={recommendations.portfolioScore} />
              <p className="text-center text-sm text-gray-600 mt-4">
                Based on your risk profile and goals
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
                <AlertCircle size={28} className="text-[#D4A843]" />
                Insurance Recommendations
              </h2>

              <div className="space-y-4">
                {recommendations.insuranceRecommendations.map((insurance, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4 border-l-4" style={{ borderLeftColor: getPriorityColor(insurance.priority) }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[#0D1B3E]">{insurance.type}</h3>
                          <span
                            className="text-xs font-bold text-white px-2 py-1 rounded"
                            style={{ backgroundColor: getPriorityColor(insurance.priority) }}
                          >
                            {insurance.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">Action needed: {insurance.urgency}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Recommended Cover</p>
                        <p className="text-lg font-bold text-[#0D1B3E]">{formatCurrency(insurance.cover)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">Est. Premium (Annual)</p>
                        <p className="text-lg font-bold text-[#D4A843]">{formatCurrency(insurance.estimatedPremium)}</p>
                      </div>
                    </div>

                    <button className="w-full bg-[#00897B] hover:bg-[#006b63] text-white font-semibold py-2 px-4 rounded-lg transition-all text-sm">
                      Get Quote
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-bold mb-4">Quick Summary</h3>
              <div className="space-y-3">
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-gray-300 text-sm mb-1">Total Investments/Month</p>
                  <p className="text-2xl font-bold text-[#D4A843]">{formatCurrency(recommendations.totalMonthlyAllocation)}</p>
                </div>
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-gray-300 text-sm mb-1">Portfolio Strength</p>
                  <p className="text-2xl font-bold text-[#10B981]">{recommendations.portfolioScore}%</p>
                </div>
                <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                  <p className="text-gray-300 text-sm mb-1">Insurance Gaps</p>
                  <p className="text-2xl font-bold text-[#EF4444]">4 Actions</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-[#0D1B3E] mb-6 flex items-center gap-2">
            <Zap size={28} className="text-[#D4A843]" />
            Action Items
          </h2>

          <div className="space-y-3">
            {recommendations.actionItems.map((item) => (
              <label
                key={item.step}
                className={`flex items-start gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  item.completed
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-300 hover:border-[#D4A843]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.completed}
                  readOnly
                  className="w-5 h-5 mt-0.5 cursor-pointer"
                />
                <div className="flex-1">
                  <h3 className={`font-bold ${item.completed ? 'text-green-700 line-through' : 'text-[#0D1B3E]'}`}>
                    {item.step}. {item.title}
                  </h3>
                  <p className="text-gray-600 text-sm">{item.description}</p>
                </div>
                {item.completed && <CheckCircle size={24} className="text-green-600 mt-0.5" />}
              </label>
            ))}
          </div>
        </div>

        <button className="w-full bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2">
          <Mail size={20} />
          Send Recommendations to Client
        </button>
      </div>
    </div>
  )
}
