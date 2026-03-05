import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Target, ShieldAlert, Zap, MessageCircle, ChevronRight } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { apiService } from '../../services/api'

const StatCard = ({ label, value, color = 'text-[#D4A843]' }) => (
  <div className="bg-white rounded-xl p-4 shadow-md">
    <p className="text-gray-600 text-sm mb-2">{label}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
)

export default function AdvisoryDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const data = await apiService.get('/advisory/dashboard')
        setStats(data.stats)
        setRecentActivity(data.recentActivity)
      } catch (err) {
        console.error(err)
        setStats(getMockStats())
        setRecentActivity(getMockActivity())
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const getMockStats = () => ({
    clientsAssessed: 24,
    goalsPlanned: 18,
    insuranceGapsFound: 12,
    recommendationsMade: 156,
  })

  const getMockActivity = () => [
    {
      id: 1,
      type: 'risk_assessment',
      client: 'Rajesh Kumar',
      action: 'Completed risk assessment - MODERATE profile',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: 2,
      type: 'goal_plan',
      client: 'Priya Sharma',
      action: 'Created retirement goal plan for ₹2 Cr',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
    {
      id: 3,
      type: 'insurance',
      client: 'Amit Patel',
      action: 'Insurance gap analysis - ₹50L life insurance gap',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    },
    {
      id: 4,
      type: 'recommendation',
      client: 'Neha Desai',
      action: 'Smart recommendations generated with 4 MF categories',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: 5,
      type: 'chat',
      client: 'Vikram Singh',
      action: 'Consulted on SIP calculation for ₹50L goal',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ]

  const getActivityIcon = (type) => {
    const icons = {
      risk_assessment: BarChart3,
      goal_plan: Target,
      insurance: ShieldAlert,
      recommendation: Zap,
      chat: MessageCircle,
    }
    return icons[type] || BarChart3
  }

  const getActivityColor = (type) => {
    const colors = {
      risk_assessment: '#3B82F6',
      goal_plan: '#10B981',
      insurance: '#EF4444',
      recommendation: '#D4A843',
      chat: '#8B5CF6',
    }
    return colors[type] || '#6B7280'
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading advisory dashboard..." />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">AI Advisory Engine</h1>
          <p className="text-gray-300">Intelligent financial planning and recommendations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard label="Clients Assessed" value={stats?.clientsAssessed || 0} color="text-blue-600" />
          <StatCard label="Goals Planned" value={stats?.goalsPlanned || 0} color="text-green-600" />
          <StatCard label="Insurance Gaps Found" value={stats?.insuranceGapsFound || 0} color="text-red-600" />
          <StatCard label="Recommendations Made" value={stats?.recommendationsMade || 0} color="text-[#D4A843]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => navigate('/advisory/risk-assessment')}
            className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-8 shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <BarChart3 size={28} />
              </div>
              <ChevronRight size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Risk Assessment</h2>
            <p className="text-blue-100">Understand your risk profile with our 10-question wizard. Get personalized asset allocation recommendations.</p>
          </button>

          <button
            onClick={() => navigate('/advisory/goal-planner')}
            className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-8 shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Target size={28} />
              </div>
              <ChevronRight size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Goal Planner</h2>
            <p className="text-green-100">Plan your financial goals with SIP calculations. Set targets and track milestones.</p>
          </button>

          <button
            onClick={() => navigate('/advisory/insurance-gap')}
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl p-8 shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <ShieldAlert size={28} />
              </div>
              <ChevronRight size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Insurance Gap Analysis</h2>
            <p className="text-orange-100">Identify insurance gaps and get comprehensive coverage recommendations.</p>
          </button>

          <button
            onClick={() => navigate('/advisory/smart-recommend')}
            className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-8 shadow-lg transition-all hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <Zap size={28} />
              </div>
              <ChevronRight size={24} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Smart Recommendations</h2>
            <p className="text-purple-100">Get personalized MF & insurance recommendations based on your profile.</p>
          </button>
        </div>

        <button
          onClick={() => navigate('/advisory/chat')}
          className="w-full lg:w-auto bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3 mb-8 text-lg"
        >
          <MessageCircle size={28} />
          Ask AI Advisor a Question
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#0D1B3E] mb-6">Recent Advisory Activity</h2>

          {recentActivity.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No recent activity</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Client</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Action</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActivity.map((activity) => {
                    const IconComponent = getActivityIcon(activity.type)
                    const color = getActivityColor(activity.type)
                    return (
                      <tr key={activity.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                            style={{ backgroundColor: color }}
                          >
                            <IconComponent size={20} />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-semibold text-[#0D1B3E]">{activity.client}</td>
                        <td className="py-3 px-4 text-gray-700">{activity.action}</td>
                        <td className="py-3 px-4 text-gray-600 text-sm">{getTimeAgo(activity.timestamp)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
