import React, { useState, useRef, useEffect } from 'react'
import { Send, Trash2, Download, MessageCircle } from 'lucide-react'
import LoadingSpinner from '../../components/common/LoadingSpinner'
import { formatCurrency } from '../../utils/formatters'
import { apiService } from '../../services/api'

const QUICK_QUERIES = [
  'Best fund for new investor?',
  'How much SIP for ₹1 Cr in 15 years?',
  'Insurance gap check',
  'Compare large cap vs mid cap',
  'Retirement plan for 35-year-old',
]

const SIPCalculationCard = ({ data }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
    <h4 className="font-bold text-[#0D1B3E] mb-3">SIP Calculation Result</h4>
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-gray-700">Target Amount</span>
        <span className="font-bold text-[#D4A843]">{formatCurrency(data.target)}</span>
      </div>
      <div className="flex justify-between items-center">
        <span className="text-gray-700">Timeline</span>
        <span className="font-bold text-[#0D1B3E]">{data.years} years</span>
      </div>
      <div className="border-t border-blue-200 pt-2 mt-2">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">Required Monthly SIP</span>
          <span className="text-2xl font-bold text-[#D4A843]">{formatCurrency(data.sip)}</span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mt-3">
        At an expected return of 12% per annum, assuming rupee cost averaging effect
      </p>
    </div>
  </div>
)

const FundRecommendationCard = ({ data }) => (
  <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-lg p-4 border border-green-200">
    <h4 className="font-bold text-[#0D1B3E] mb-3">Recommended Fund Categories</h4>
    <div className="space-y-2">
      {data.funds.map((fund, idx) => (
        <div key={idx} className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold"
            style={{ backgroundColor: fund.color }}
          >
            {idx + 1}
          </span>
          <span className="text-gray-700">{fund.name}</span>
          <span className="ml-auto bg-white px-2 py-1 rounded text-xs font-semibold" style={{ color: fund.color }}>
            {fund.allocation}%
          </span>
        </div>
      ))}
    </div>
  </div>
)

const InsuranceGapCard = ({ data }) => (
  <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-200">
    <h4 className="font-bold text-[#0D1B3E] mb-3">Insurance Gap Summary</h4>
    <div className="space-y-3">
      <div>
        <p className="text-sm text-gray-600 mb-1">Life Insurance Gap</p>
        <p className="text-lg font-bold text-red-600">{formatCurrency(data.lifeGap)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-600 mb-1">Health Insurance Gap</p>
        <p className="text-lg font-bold text-orange-600">{formatCurrency(data.healthGap)}</p>
      </div>
      <div className="bg-white rounded p-2 text-xs text-gray-700">
        <strong>Action:</strong> Consider securing additional coverage to address identified gaps.
      </div>
    </div>
  </div>
)

export default function AdvisoryChat() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      text: 'Hello! I\'m your AI Advisory Assistant. I can help you with mutual fund recommendations, SIP calculations, insurance gap analysis, and retirement planning. What would you like to know today?',
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getAIResponse = async (query) => {
    const lowerQuery = query.toLowerCase()

    if (
      lowerQuery.includes('sip') &&
      (lowerQuery.includes('₹1') || lowerQuery.includes('1 cr') || lowerQuery.includes('crore'))
    ) {
      return {
        type: 'sip_calculation',
        data: {
          target: 10000000,
          years: 15,
          sip: 28500,
        },
        text: 'Here\'s the calculation for your ₹1 Crore goal in 15 years:',
      }
    }

    if (lowerQuery.includes('best fund') || lowerQuery.includes('new investor')) {
      return {
        type: 'fund_recommendation',
        data: {
          funds: [
            { name: 'Large Cap Fund', allocation: 40, color: '#3B82F6' },
            { name: 'Multi Cap Fund', allocation: 30, color: '#8B5CF6' },
            { name: 'Balanced Fund', allocation: 20, color: '#10B981' },
            { name: 'Index Fund', allocation: 10, color: '#F59E0B' },
          ],
        },
        text: 'For a new investor with moderate risk tolerance, I recommend a balanced portfolio:',
      }
    }

    if (lowerQuery.includes('insurance') || lowerQuery.includes('gap')) {
      return {
        type: 'insurance_gap',
        data: {
          lifeGap: 2500000,
          healthGap: 500000,
        },
        text: 'Based on typical income levels, here\'s the insurance gap analysis:',
      }
    }

    if (lowerQuery.includes('large cap') || lowerQuery.includes('mid cap') || lowerQuery.includes('compare')) {
      return {
        type: 'text',
        text: `Large Cap vs Mid Cap Funds:\n\nLarge Cap Funds: Lower risk, stable dividends, suitable for conservative investors. Examples: TCS, Reliance, HDFC Bank\n\nMid Cap Funds: Higher growth potential, moderate risk, suitable for moderate-to-aggressive investors. Better for 7-10 year horizons.\n\nRecommendation: Allocate 60% to large cap and 40% to mid cap for balanced growth.`,
      }
    }

    if (lowerQuery.includes('retirement') || lowerQuery.includes('35')) {
      return {
        type: 'text',
        text: `Retirement Plan for a 35-Year-Old:\n\nTime Horizon: 25-30 years (until 60-65)\n\nRecommended Allocation:\n• Equity Funds: 65% (Large Cap + Mid Cap)\n• Balanced Funds: 20%\n• Debt Funds: 10%\n• Gold/International: 5%\n\nMonthly SIP Needed: ₹15,000-₹25,000 depending on target corpus\n\nKey Steps:\n1. Assess your retirement needs\n2. Start a diversified SIP immediately\n3. Increase SIP by 10% annually\n4. Review and rebalance yearly`,
      }
    }

    return {
      type: 'text',
      text: `I can help you with:\n• SIP calculations and investment planning\n• Mutual fund recommendations\n• Insurance gap analysis\n• Retirement planning\n• Asset allocation strategies\n\nWhat specific topic would you like to explore?`,
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await getAIResponse(inputValue)

      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        contentType: response.type,
        text: response.text,
        data: response.data,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
      const errorMessage = {
        id: messages.length + 2,
        type: 'ai',
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickQuery = async (query) => {
    setInputValue(query)
    const userMessage = {
      id: messages.length + 1,
      type: 'user',
      text: query,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)

    try {
      const response = await getAIResponse(query)

      const aiMessage = {
        id: messages.length + 2,
        type: 'ai',
        contentType: response.type,
        text: response.text,
        data: response.data,
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleClearChat = () => {
    if (confirm('Clear all messages?')) {
      setMessages([
        {
          id: 1,
          type: 'ai',
          text: 'Hello! I\'m your AI Advisory Assistant. What can I help you with today?',
          timestamp: new Date(),
        },
      ])
    }
  }

  const handleExportChat = () => {
    const chatText = messages
      .map((msg) => `${msg.type === 'user' ? 'You' : 'AI'}: ${msg.text}`)
      .join('\n\n')

    const element = document.createElement('a')
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(chatText))
    element.setAttribute('download', 'advisory_chat.txt')
    element.style.display = 'none'
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] flex flex-col">
      <div className="bg-[#0D1B3E] text-white px-4 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircle size={28} />
            <h1 className="text-2xl font-bold">AI Advisor Chat</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportChat}
              className="p-2 hover:bg-[#1a2a4e] rounded-lg transition-colors"
              title="Export chat"
            >
              <Download size={20} />
            </button>
            <button
              onClick={handleClearChat}
              className="p-2 hover:bg-[#1a2a4e] rounded-lg transition-colors"
              title="Clear chat"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-sm md:max-w-2xl ${
                  message.type === 'user'
                    ? 'bg-[#0D1B3E] text-white rounded-2xl rounded-tr-none'
                    : 'bg-white text-gray-800 rounded-2xl rounded-tl-none border border-gray-200'
                } px-4 py-3`}
              >
                <p className="text-sm mb-3">{message.text}</p>

                {message.contentType === 'sip_calculation' && <SIPCalculationCard data={message.data} />}

                {message.contentType === 'fund_recommendation' && <FundRecommendationCard data={message.data} />}

                {message.contentType === 'insurance_gap' && <InsuranceGapCard data={message.data} />}

                {message.type === 'ai' && message.contentType === 'text' && (
                  <div className="text-sm text-gray-700 whitespace-pre-line">{message.text}</div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-800 rounded-2xl rounded-tl-none px-4 py-3 border border-gray-200">
                <LoadingSpinner size="sm" text="" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {messages.length === 1 && !loading && (
        <div className="bg-gradient-to-br from-[#0D1B3E] to-[#1a2a4e] px-4 py-6 border-t border-gray-700">
          <div className="max-w-4xl mx-auto">
            <p className="text-white text-sm mb-4 text-center">Try asking about:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {QUICK_QUERIES.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuery(query)}
                  className="bg-white bg-opacity-10 hover:bg-opacity-20 text-white rounded-lg px-4 py-2 text-sm font-medium transition-all border border-white border-opacity-20"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#0D1B3E] border-t border-gray-700 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask about funds, SIPs, insurance, retirement plans..."
              className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D4A843]"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || loading}
              className="bg-[#D4A843] hover:bg-[#c29a3a] text-white font-semibold py-3 px-6 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
