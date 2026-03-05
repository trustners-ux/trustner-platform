import React, { useState } from 'react'
import { Calculator, Share2, Copy } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { formatCurrency, formatNumber } from '../../utils/formatters'

export default function MarketingToolkit() {
  const [sipAmount, setSipAmount] = useState(5000)
  const [roi, setRoi] = useState(12)
  const [months, setMonths] = useState(60)
  const [futureValue, setFutureValue] = useState(0)

  const calculateSIP = (amount, rateOfReturn, months) => {
    const monthlyRate = rateOfReturn / 12 / 100
    const months_ = months
    const futureVal =
      amount *
      (((1 + monthlyRate) ** months_ - 1) / monthlyRate) *
      (1 + monthlyRate)
    setFutureValue(futureVal)
  }

  const templates = [
    {
      name: 'Investment Benefits',
      content:
        'Start your financial journey with systematic investing. Invest ₹5000 monthly and build wealth of ₹5,00,000+ in 5 years.',
    },
    {
      name: 'Market Volatility',
      content:
        'Market is down? Great opportunity! SIPs work best during volatility. Invest regularly and benefit from rupee cost averaging.',
    },
    {
      name: 'Goal Planning',
      content:
        'Plan for your future goals - Retirement, Education, Marriage. Let us help you create a structured investment plan.',
    },
  ]

  const postsTemplates = [
    'Just helped a client accumulate ₹20L through systematic investing. Start your journey today! #WealthCreation #FinancialFreedom',
    'Consistent investing beats timing the market. Your SIP could be your best financial decision. #InvestSmart',
    'Mutual funds are the easiest way to invest in the stock market. No need to pick individual stocks. #MutualFunds',
  ]

  return (
    <div>
      <PageHeader
        title="Marketing Toolkit"
        subtitle="Tools and resources to help you grow your business"
      />

      <div className="space-y-8">
        {/* SIP Calculator */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            SIP Calculator
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Investment (₹)
              </label>
              <input
                type="number"
                value={sipAmount}
                onChange={(e) => {
                  setSipAmount(parseFloat(e.target.value))
                  calculateSIP(
                    parseFloat(e.target.value),
                    roi,
                    months
                  )
                }}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Return (%)
              </label>
              <input
                type="number"
                value={roi}
                onChange={(e) => {
                  setRoi(parseFloat(e.target.value))
                  calculateSIP(sipAmount, parseFloat(e.target.value), months)
                }}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Period (Months)
              </label>
              <input
                type="number"
                value={months}
                onChange={(e) => {
                  setMonths(parseFloat(e.target.value))
                  calculateSIP(sipAmount, roi, parseFloat(e.target.value))
                }}
                className="input-base"
              />
            </div>
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">Future Value</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(futureValue)}
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Investment: {formatCurrency(sipAmount * months)} | Gain:{' '}
              {formatCurrency(futureValue - sipAmount * months)}
            </p>
          </div>
        </div>

        {/* Report Templates */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Report Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 mb-3">{template.name}</p>
                <p className="text-sm text-gray-600 mb-4">{template.content}</p>
                <button className="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Social Media Posts */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Social Media Posts
          </h2>
          <div className="space-y-4">
            {postsTemplates.map((post, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-3">{post}</p>
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  <Copy className="w-4 h-4" />
                  Copy for Social Media
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resources */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left">
              <p className="font-semibold text-gray-900">Client Presentation Deck</p>
              <p className="text-sm text-gray-600 mt-1">PDF download</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left">
              <p className="font-semibold text-gray-900">Product Brochures</p>
              <p className="text-sm text-gray-600 mt-1">Downloadable files</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left">
              <p className="font-semibold text-gray-900">Compliance Checklists</p>
              <p className="text-sm text-gray-600 mt-1">PDF download</p>
            </button>
            <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition-colors text-left">
              <p className="font-semibold text-gray-900">Video Tutorials</p>
              <p className="text-sm text-gray-600 mt-1">View online</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
