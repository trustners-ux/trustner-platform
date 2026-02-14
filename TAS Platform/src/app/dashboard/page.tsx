'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard, TrendingUp, PieChart, Wallet, FileText,
  Bell, Settings, LogOut, ChevronRight, ArrowUpRight, ArrowDownRight,
  IndianRupee, BarChart3, Target, Calendar
} from 'lucide-react';
import { formatINR } from '@/lib/utils/formatters';

// Mock portfolio data
const MOCK_PORTFOLIO = {
  totalValue: 2458320,
  invested: 1850000,
  returns: 608320,
  xirr: 18.4,
  holdings: [
    { name: 'HDFC Mid-Cap Opportunities Fund', type: 'Equity - Mid Cap', invested: 500000, current: 685000, returns: 37.0, units: 1842.5 },
    { name: 'Axis Bluechip Fund', type: 'Equity - Large Cap', invested: 400000, current: 512000, returns: 28.0, units: 8421.3 },
    { name: 'Parag Parikh Flexi Cap Fund', type: 'Equity - Flexi Cap', invested: 350000, current: 462000, returns: 32.0, units: 6125.8 },
    { name: 'SBI Small Cap Fund', type: 'Equity - Small Cap', invested: 300000, current: 421320, returns: 40.4, units: 2156.7 },
    { name: 'ICICI Pru Corporate Bond Fund', type: 'Debt - Corporate Bond', invested: 200000, current: 224000, returns: 12.0, units: 7850.2 },
    { name: 'Kotak Liquid Fund', type: 'Debt - Liquid', invested: 100000, current: 154000, returns: 6.8, units: 34.2 },
  ],
  sips: [
    { name: 'HDFC Mid-Cap Opportunities', amount: 10000, date: '5th', status: 'Active' },
    { name: 'Axis Bluechip Fund', amount: 8000, date: '10th', status: 'Active' },
    { name: 'Parag Parikh Flexi Cap', amount: 7000, date: '15th', status: 'Active' },
    { name: 'SBI Small Cap Fund', amount: 5000, date: '5th', status: 'Active' },
  ],
  transactions: [
    { type: 'SIP', fund: 'HDFC Mid-Cap Opportunities', amount: 10000, date: '05 Feb 2025', status: 'Completed' },
    { type: 'SIP', fund: 'Axis Bluechip Fund', amount: 8000, date: '10 Feb 2025', status: 'Completed' },
    { type: 'Redemption', fund: 'Kotak Liquid Fund', amount: 50000, date: '01 Feb 2025', status: 'Completed' },
    { type: 'Lumpsum', fund: 'ICICI Pru Corporate Bond', amount: 100000, date: '25 Jan 2025', status: 'Completed' },
  ],
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'holdings', label: 'Holdings', icon: PieChart },
  { id: 'sips', label: 'SIP Dashboard', icon: Calendar },
  { id: 'transactions', label: 'Transactions', icon: FileText },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const returnsPercent = ((MOCK_PORTFOLIO.returns / MOCK_PORTFOLIO.invested) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="container-custom py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Welcome back</p>
              <h1 className="text-2xl font-bold">My Portfolio</h1>
            </div>
            <div className="flex items-center gap-3">
              <button className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <button className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Portfolio Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-blue-200 text-xs uppercase tracking-wider">Current Value</p>
              <p className="text-2xl font-bold mt-1">{formatINR(MOCK_PORTFOLIO.totalValue)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-blue-200 text-xs uppercase tracking-wider">Invested</p>
              <p className="text-2xl font-bold mt-1">{formatINR(MOCK_PORTFOLIO.invested)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-blue-200 text-xs uppercase tracking-wider">Total Returns</p>
              <p className="text-2xl font-bold mt-1 text-green-400">
                +{formatINR(MOCK_PORTFOLIO.returns)}
              </p>
              <p className="text-xs text-green-300 mt-1">+{returnsPercent}%</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-blue-200 text-xs uppercase tracking-wider">XIRR</p>
              <p className="text-2xl font-bold mt-1 text-yellow-400">{MOCK_PORTFOLIO.xirr}%</p>
              <p className="text-xs text-blue-200 mt-1">Annualized</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-6 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-blue-200 hover:text-white hover:bg-white/10'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="container-custom py-6">
        {activeTab === 'overview' && (
          <div className="grid md:grid-cols-3 gap-6">
            {/* Asset Allocation */}
            <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-blue-600" /> Asset Allocation
              </h3>
              <div className="space-y-3">
                {[
                  { type: 'Equity', value: 2080320, pct: 84.6, color: 'bg-blue-500' },
                  { type: 'Debt', value: 378000, pct: 15.4, color: 'bg-green-500' },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{item.type}</span>
                      <span className="text-gray-900 font-semibold">{formatINR(item.value)} ({item.pct}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Top Holdings */}
              <h4 className="font-semibold text-gray-900 mt-8 mb-3">Top Holdings by Value</h4>
              <div className="space-y-2">
                {MOCK_PORTFOLIO.holdings.slice(0, 4).map((h, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{h.name}</p>
                      <p className="text-xs text-gray-500">{h.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">{formatINR(h.current)}</p>
                      <p className={`text-xs font-medium ${h.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {h.returns >= 0 ? '+' : ''}{h.returns}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Start New SIP', href: '/mutual-funds', icon: TrendingUp, color: 'text-blue-600 bg-blue-50' },
                    { label: 'Invest Lumpsum', href: '/mutual-funds', icon: Wallet, color: 'text-green-600 bg-green-50' },
                    { label: 'SIP Calculator', href: '/calculators/sip', icon: BarChart3, color: 'text-purple-600 bg-purple-50' },
                    { label: 'Set Goals', href: '#', icon: Target, color: 'text-orange-600 bg-orange-50' },
                  ].map((action, idx) => (
                    <Link
                      key={idx}
                      href={action.href}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`p-2 rounded-lg ${action.color}`}>
                        <action.icon className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{action.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-auto" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Active SIPs</h3>
                <div className="space-y-3">
                  {MOCK_PORTFOLIO.sips.map((sip, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-gray-900 font-medium">{sip.name}</p>
                        <p className="text-xs text-gray-500">{sip.date} of every month</p>
                      </div>
                      <p className="font-semibold text-gray-900">{formatINR(sip.amount)}</p>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-gray-100 flex justify-between">
                    <span className="text-sm font-semibold text-gray-700">Total Monthly SIP</span>
                    <span className="font-bold text-blue-600">
                      {formatINR(MOCK_PORTFOLIO.sips.reduce((s, sip) => s + sip.amount, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holdings' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-400">Fund Name</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Invested</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Current</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Returns</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Units</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PORTFOLIO.holdings.map((h, idx) => (
                    <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-4 px-6">
                        <p className="font-medium text-gray-900 text-sm">{h.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{h.type}</p>
                      </td>
                      <td className="text-right py-4 px-4 text-sm font-medium text-gray-900">{formatINR(h.invested)}</td>
                      <td className="text-right py-4 px-4 text-sm font-medium text-gray-900">{formatINR(h.current)}</td>
                      <td className="text-right py-4 px-4">
                        <div className={`inline-flex items-center gap-1 text-sm font-bold ${h.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {h.returns >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                          {h.returns >= 0 ? '+' : ''}{h.returns}%
                        </div>
                      </td>
                      <td className="text-right py-4 px-4 text-sm text-gray-600">{h.units.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 font-semibold">
                    <td className="py-4 px-6 text-gray-900">Total</td>
                    <td className="text-right py-4 px-4 text-gray-900">{formatINR(MOCK_PORTFOLIO.invested)}</td>
                    <td className="text-right py-4 px-4 text-gray-900">{formatINR(MOCK_PORTFOLIO.totalValue)}</td>
                    <td className="text-right py-4 px-4 text-green-600">+{returnsPercent}%</td>
                    <td className="py-4 px-4"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sips' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Monthly SIP Total</h3>
                  <p className="text-3xl font-bold text-blue-700 mt-1">
                    {formatINR(MOCK_PORTFOLIO.sips.reduce((s, sip) => s + sip.amount, 0))}
                  </p>
                </div>
                <Link href="/mutual-funds" className="bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  + New SIP
                </Link>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-400">Fund</th>
                    <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Amount</th>
                    <th className="text-center py-4 px-4 text-xs font-bold uppercase text-gray-400">SIP Date</th>
                    <th className="text-center py-4 px-4 text-xs font-bold uppercase text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PORTFOLIO.sips.map((sip, idx) => (
                    <tr key={idx} className="border-b border-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900 text-sm">{sip.name}</td>
                      <td className="text-right py-4 px-4 text-sm font-semibold text-gray-900">{formatINR(sip.amount)}</td>
                      <td className="text-center py-4 px-4 text-sm text-gray-600">{sip.date}</td>
                      <td className="text-center py-4 px-4">
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                          {sip.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="text-left py-4 px-6 text-xs font-bold uppercase text-gray-400">Date</th>
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase text-gray-400">Type</th>
                  <th className="text-left py-4 px-4 text-xs font-bold uppercase text-gray-400">Fund</th>
                  <th className="text-right py-4 px-4 text-xs font-bold uppercase text-gray-400">Amount</th>
                  <th className="text-center py-4 px-4 text-xs font-bold uppercase text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PORTFOLIO.transactions.map((txn, idx) => (
                  <tr key={idx} className="border-b border-gray-50">
                    <td className="py-4 px-6 text-sm text-gray-600">{txn.date}</td>
                    <td className="py-4 px-4">
                      <span className={`text-xs font-semibold px-2 py-1 rounded ${
                        txn.type === 'SIP' ? 'bg-blue-100 text-blue-700' :
                        txn.type === 'Lumpsum' ? 'bg-green-100 text-green-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-gray-900">{txn.fund}</td>
                    <td className="text-right py-4 px-4 text-sm font-semibold text-gray-900">{formatINR(txn.amount)}</td>
                    <td className="text-center py-4 px-4">
                      <span className="text-xs text-green-600 font-medium">{txn.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Note */}
        <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-700">
            <strong>Note:</strong> This is a demo dashboard with sample data. In the live version, your actual portfolio data
            will be fetched from your mutual fund account via BSE StAR MF / MFU integration. Contact us to set up your account.
          </p>
        </div>
      </div>
    </div>
  );
}
