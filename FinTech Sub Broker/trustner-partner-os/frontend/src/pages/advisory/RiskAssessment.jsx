import React, { useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Download, Save } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { apiService } from '../../services/api'

const RISK_QUESTIONS = [
  {
    id: 1,
    category: 'Age Bracket',
    question: 'What is your age bracket?',
    options: [
      { value: 'below25', label: 'Below 25', weight: 10 },
      { value: '25to35', label: '25-35 years', weight: 12 },
      { value: '35to45', label: '35-45 years', weight: 10 },
      { value: '45to55', label: '45-55 years', weight: 7 },
      { value: 'above55', label: 'Above 55 years', weight: 4 },
    ],
  },
  {
    id: 2,
    category: 'Annual Income',
    question: 'What is your annual income?',
    options: [
      { value: 'below5L', label: 'Below ₹5 Lakhs', weight: 4 },
      { value: '5to15L', label: '₹5-15 Lakhs', weight: 6 },
      { value: '15to30L', label: '₹15-30 Lakhs', weight: 8 },
      { value: '30to50L', label: '₹30-50 Lakhs', weight: 10 },
      { value: 'above50L', label: 'Above ₹50 Lakhs', weight: 12 },
    ],
  },
  {
    id: 3,
    category: 'Investment Horizon',
    question: 'What is your investment time horizon?',
    options: [
      { value: 'below1', label: 'Less than 1 year', weight: 2 },
      { value: '1to3', label: '1-3 years', weight: 4 },
      { value: '3to7', label: '3-7 years', weight: 8 },
      { value: '7to15', label: '7-15 years', weight: 11 },
      { value: 'above15', label: 'Above 15 years', weight: 13 },
    ],
  },
  {
    id: 4,
    category: 'Existing Investments',
    question: 'Do you have existing investments (stocks, mutual funds, real estate)?',
    options: [
      { value: 'none', label: 'No existing investments', weight: 3 },
      { value: 'minimal', label: 'Minimal (below ₹5L)', weight: 5 },
      { value: 'moderate', label: 'Moderate (₹5L-₹25L)', weight: 8 },
      { value: 'substantial', label: 'Substantial (₹25L-₹1Cr)', weight: 10 },
      { value: 'very_high', label: 'Very High (above ₹1Cr)', weight: 12 },
    ],
  },
  {
    id: 5,
    category: 'Reaction to Loss',
    question: 'How would you react to a 20% drop in your portfolio value?',
    options: [
      { value: 'very_uncomfortable', label: 'Very uncomfortable - would want to exit', weight: 2 },
      { value: 'uncomfortable', label: 'Uncomfortable but would hold', weight: 5 },
      { value: 'neutral', label: 'Neutral - neither worried nor excited', weight: 7 },
      { value: 'comfortable', label: 'Comfortable - would see it as opportunity', weight: 10 },
      { value: 'very_comfortable', label: 'Very comfortable - would invest more', weight: 13 },
    ],
  },
  {
    id: 6,
    category: 'Primary Goal',
    question: 'What is your primary investment goal?',
    options: [
      { value: 'capital_preservation', label: 'Capital Preservation', weight: 3 },
      { value: 'steady_income', label: 'Steady Income', weight: 5 },
      { value: 'balanced_growth', label: 'Balanced Growth & Income', weight: 8 },
      { value: 'growth', label: 'Capital Growth', weight: 11 },
      { value: 'aggressive_growth', label: 'Aggressive Growth', weight: 13 },
    ],
  },
  {
    id: 7,
    category: 'Financial Dependents',
    question: 'How many financial dependents do you have?',
    options: [
      { value: 'none', label: 'None', weight: 11 },
      { value: 'one', label: 'One', weight: 9 },
      { value: 'two', label: 'Two', weight: 7 },
      { value: 'three', label: 'Three', weight: 5 },
      { value: 'more', label: 'More than three', weight: 3 },
    ],
  },
  {
    id: 8,
    category: 'Emergency Fund',
    question: 'Do you have adequate emergency fund (6-12 months expenses)?',
    options: [
      { value: 'no', label: 'No emergency fund', weight: 2 },
      { value: 'less_three', label: 'Less than 3 months expenses', weight: 4 },
      { value: 'three_six', label: '3-6 months expenses', weight: 7 },
      { value: 'six_twelve', label: '6-12 months expenses', weight: 10 },
      { value: 'more_twelve', label: 'More than 12 months expenses', weight: 12 },
    ],
  },
  {
    id: 9,
    category: 'Loan/EMI Obligations',
    question: 'What percentage of your monthly income goes to loans/EMIs?',
    options: [
      { value: 'none', label: 'No loans/EMIs', weight: 12 },
      { value: 'below10', label: 'Below 10%', weight: 10 },
      { value: '10to20', label: '10-20%', weight: 7 },
      { value: '20to30', label: '20-30%', weight: 4 },
      { value: 'above30', label: 'Above 30%', weight: 2 },
    ],
  },
  {
    id: 10,
    category: 'Insurance Coverage',
    question: 'Do you have adequate insurance coverage (term life, health)?',
    options: [
      { value: 'no', label: 'No insurance', weight: 3 },
      { value: 'minimal', label: 'Minimal coverage', weight: 5 },
      { value: 'adequate', label: 'Adequate coverage', weight: 10 },
      { value: 'comprehensive', label: 'Comprehensive coverage', weight: 12 },
    ],
  },
]

const RISK_CATEGORIES = [
  { min: 0, max: 12, label: 'CONSERVATIVE', color: '#10B981', description: 'Low risk tolerance' },
  { min: 13, max: 25, label: 'MODERATELY CONSERVATIVE', color: '#3B82F6', description: 'Below average risk tolerance' },
  { min: 26, max: 35, label: 'MODERATE', color: '#F59E0B', description: 'Balanced risk tolerance' },
  { min: 36, max: 45, label: 'MODERATELY AGGRESSIVE', color: '#8B5CF6', description: 'Above average risk tolerance' },
  { min: 46, max: 50, label: 'AGGRESSIVE', color: '#EF4444', description: 'High risk tolerance' },
]

const ASSET_ALLOCATION = {
  CONSERVATIVE: { equity: 20, debt: 60, gold: 15, international: 5 },
  'MODERATELY CONSERVATIVE': { equity: 35, debt: 45, gold: 12, international: 8 },
  MODERATE: { equity: 50, debt: 30, gold: 10, international: 10 },
  'MODERATELY AGGRESSIVE': { equity: 70, debt: 15, gold: 8, international: 7 },
  AGGRESSIVE: { equity: 85, debt: 5, gold: 5, international: 5 },
}

const FUND_CATEGORIES = {
  CONSERVATIVE: [
    'Overnight Funds',
    'Liquid Funds',
    'Ultra Short Duration Funds',
    'Government Securities Funds',
    'Fixed Deposit Equivalents',
  ],
  'MODERATELY CONSERVATIVE': [
    'Short Duration Funds',
    'Banking & PSU Funds',
    'Conservative Hybrid Funds',
    'Dividend Yield Funds',
    'Balanced Advantage Funds',
  ],
  MODERATE: [
    'Large Cap Funds',
    'Multi Cap Funds',
    'Balanced Funds',
    'Moderate Duration Funds',
    'Dividend Funds',
    'Index Funds',
  ],
  'MODERATELY AGGRESSIVE': [
    'Mid Cap Funds',
    'Small Cap Funds',
    'Multi Asset Allocation',
    'Dynamic Asset Allocation',
    'Equity Linked Savings Schemes',
    'Emerging Markets Funds',
  ],
  AGGRESSIVE: [
    'Small Cap Funds',
    'Sector Specific Funds',
    'Focused Funds',
    'Value Funds',
    'Emerging Markets Funds',
    'International Equity Funds',
  ],
}

export default function RiskAssessment() {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const [riskProfile, setRiskProfile] = useState(null)

  const calculateScore = useCallback(() => {
    let totalScore = 0
    RISK_QUESTIONS.forEach((q) => {
      const answerId = answers[q.id]
      if (answerId) {
        const option = q.options.find((o) => o.value === answerId)
        if (option) totalScore += option.weight
      }
    })
    return totalScore
  }, [answers])

  const getRiskCategory = (score) => {
    return RISK_CATEGORIES.find((cat) => score >= cat.min && score <= cat.max)
  }

  const handleAnswer = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }))
  }

  const handleNext = () => {
    if (currentStep < RISK_QUESTIONS.length) {
      setCurrentStep(currentStep + 1)
    } else {
      generateResults()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const generateResults = async () => {
    const score = calculateScore()
    const category = getRiskCategory(score)
    setRiskProfile({
      score,
      category: category.label,
      color: category.color,
      description: category.description,
      allocation: ASSET_ALLOCATION[category.label],
      fundCategories: FUND_CATEGORIES[category.label],
    })
    setShowResults(true)
  }

  const handleSaveProfile = async () => {
    setLoading(true)
    setError(null)
    try {
      const payload = {
        answers,
        score: riskProfile.score,
        riskCategory: riskProfile.category,
        allocation: riskProfile.allocation,
        timestamp: new Date(),
      }
      await apiService.post('/advisory/risk-assessment', payload)
      setTimeout(() => {
        navigate('/advisory/goal-planner', { state: { riskProfile: riskProfile.category } })
      }, 1500)
    } catch (err) {
      setError('Failed to save risk profile. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Your Risk Profile</h1>
            <p className="text-gray-300">Based on your responses to our questionnaire</p>
          </div>

          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 animate-fadeIn">
            <div className="text-center mb-8">
              <div
                className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6"
                style={{ backgroundColor: riskProfile.color + '20', borderColor: riskProfile.color, borderWidth: 3 }}
              >
                <span className="text-4xl font-bold" style={{ color: riskProfile.color }}>
                  {riskProfile.score}
                </span>
              </div>
              <h2 className="text-4xl font-bold text-[#0D1B3E] mb-2">{riskProfile.category}</h2>
              <p className="text-gray-600 text-lg">{riskProfile.description}</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#0D1B3E] mb-4">Recommended Asset Allocation</h3>
              <div className="flex h-12 rounded-full overflow-hidden shadow-md mb-4">
                {Object.entries(riskProfile.allocation).map(([asset, percentage]) => {
                  const colors = {
                    equity: '#3B82F6',
                    debt: '#10B981',
                    gold: '#D4A843',
                    international: '#8B5CF6',
                  }
                  return (
                    <div
                      key={asset}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: colors[asset],
                      }}
                      title={`${asset}: ${percentage}%`}
                      className="transition-all hover:opacity-80"
                    />
                  )
                })}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(riskProfile.allocation).map(([asset, percentage]) => {
                  const labels = {
                    equity: 'Equity',
                    debt: 'Debt',
                    gold: 'Gold',
                    international: 'International',
                  }
                  const colors = {
                    equity: '#3B82F6',
                    debt: '#10B981',
                    gold: '#D4A843',
                    international: '#8B5CF6',
                  }
                  return (
                    <div key={asset} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: colors[asset] }}
                        />
                        <span className="text-sm font-medium text-gray-700">{labels[asset]}</span>
                      </div>
                      <span className="text-2xl font-bold text-[#0D1B3E]">{percentage}%</span>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#0D1B3E] mb-4">Recommended Fund Categories</h3>
              <ul className="space-y-2">
                {riskProfile.fundCategories.map((fund, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D4A843] text-white text-sm font-bold mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-gray-700 pt-0.5">{fund}</span>
                  </li>
                ))}
              </ul>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={handleSaveProfile}
                disabled={loading}
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
                    Save Profile
                  </>
                )}
              </button>
              <button
                onClick={() => navigate('/advisory')}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-[#0D1B3E] font-semibold py-3 px-6 rounded-lg transition-all"
              >
                Back to Advisory
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const question = RISK_QUESTIONS[currentStep - 1]
  const selectedAnswer = answers[question.id]
  const progressPercentage = ((currentStep - 1) / RISK_QUESTIONS.length) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-white">Risk Assessment Wizard</h1>
            <span className="text-[#D4A843] font-semibold">Step {currentStep} of {RISK_QUESTIONS.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-[#D4A843] h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#0D1B3E] mb-2">{question.question}</h2>
            <p className="text-gray-600">{question.category}</p>
          </div>

          <div className="space-y-3 mb-8">
            {question.options.map((option) => (
              <label
                key={option.value}
                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  selectedAnswer === option.value
                    ? 'border-[#D4A843] bg-[#D4A843]bg-opacity-5'
                    : 'border-gray-300 hover:border-[#D4A843]'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option.value}
                  checked={selectedAnswer === option.value}
                  onChange={() => handleAnswer(question.id, option.value)}
                  className="w-4 h-4 text-[#D4A843] cursor-pointer"
                />
                <span className="ml-4 text-gray-700 font-medium">{option.label}</span>
              </label>
            ))}
          </div>

          <div className="flex gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:border-[#0D1B3E] transition-all disabled:opacity-50"
            >
              <ChevronLeft size={20} />
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!selectedAnswer}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold rounded-lg transition-all disabled:opacity-50"
            >
              {currentStep === RISK_QUESTIONS.length ? 'Complete Assessment' : 'Next'}
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
