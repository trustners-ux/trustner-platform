import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ExternalLink, Info } from 'lucide-react';
import { formatCurrency, formatIndianNumber } from '../../utils/formatters';

const SIPCalculator = () => {
  const [monthlyInvestment, setMonthlyInvestment] = useState(5000);
  const [expectedReturn, setExpectedReturn] = useState(12);
  const [investmentPeriod, setInvestmentPeriod] = useState(10);

  const chartData = useMemo(() => {
    const data = [];
    const monthlyRate = expectedReturn / 100 / 12;

    let totalInvested = 0;
    for (let month = 1; month <= investmentPeriod * 12; month++) {
      totalInvested = monthlyInvestment * month;
      const futureValue =
        monthlyInvestment *
        (((Math.pow(1 + monthlyRate, month) - 1) / monthlyRate) * (1 + monthlyRate));

      if (month % 12 === 0 || month === 1) {
        data.push({
          month: Math.ceil(month / 12),
          invested: totalInvested,
          value: Math.round(futureValue),
        });
      }
    }

    return data;
  }, [monthlyInvestment, expectedReturn, investmentPeriod]);

  const finalValues = useMemo(() => {
    const monthlyRate = expectedReturn / 100 / 12;
    const months = investmentPeriod * 12;
    const totalInvested = monthlyInvestment * months;
    const futureValue =
      monthlyInvestment *
      (((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate) * (1 + monthlyRate));
    const estimatedReturns = futureValue - totalInvested;

    return {
      totalInvested,
      futureValue,
      estimatedReturns,
    };
  }, [monthlyInvestment, expectedReturn, investmentPeriod]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">SIP Calculator</h1>
        <p className="text-gray-600 mt-2">Plan your systematic investment and see how your money grows</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
            {/* Monthly Investment Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Monthly Investment Amount</label>
                <span className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyInvestment)}</span>
              </div>
              <input
                type="range"
                min="500"
                max="100000"
                step="500"
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>₹500</span>
                <span>₹1,00,000</span>
              </div>
            </div>

            {/* Expected Return Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Expected Annual Return</label>
                <span className="text-2xl font-bold text-blue-600">{expectedReturn}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="25"
                step="0.5"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>5%</span>
                <span>25%</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                Conservative: 6-8%, Moderate: 9-13%, Aggressive: 14-18%
              </p>
            </div>

            {/* Investment Period Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Investment Period</label>
                <span className="text-2xl font-bold text-blue-600">{investmentPeriod} years</span>
              </div>
              <input
                type="range"
                min="1"
                max="30"
                step="1"
                value={investmentPeriod}
                onChange={(e) => setInvestmentPeriod(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                <span>1 year</span>
                <span>30 years</span>
              </div>
            </div>
          </div>

          {/* Results Cards */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200 p-6">
              <p className="text-sm text-blue-700 font-medium">Total Amount Invested</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{formatCurrency(finalValues.totalInvested)}</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-6">
              <p className="text-sm text-green-700 font-medium">Estimated Returns</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{formatCurrency(finalValues.estimatedReturns)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200 p-6">
              <p className="text-sm text-purple-700 font-medium">Total Value After {investmentPeriod} Years</p>
              <p className="text-3xl font-bold text-purple-900 mt-2">{formatCurrency(finalValues.futureValue)}</p>
            </div>
          </div>

          {/* CTA Button */}
          <a
            href="https://investwell.example.com/sip"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Start SIP via InvestWell <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Right Column - Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Growth Projection</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1565c0" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#1565c0" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00897b" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00897b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" label={{ value: 'Years', position: 'insideBottomRight', offset: -5 }} />
                <YAxis
                  label={{ value: 'Amount (₹)', angle: -90, position: 'insideLeft' }}
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="#1565c0"
                  fillOpacity={1}
                  fill="url(#colorInvested)"
                  name="Amount Invested"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00897b"
                  fillOpacity={1}
                  fill="url(#colorValue)"
                  name="Total Value"
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              No data to display
            </div>
          )}
        </div>
      </div>

      {/* Information Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-sm font-bold text-blue-900 mb-3">How SIP Works</h3>
        <ul className="text-sm text-blue-800 space-y-2">
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">1.</span>
            <span>You invest a fixed amount every month into a mutual fund scheme.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">2.</span>
            <span>During market upswings, your money buys fewer units; during downturns, it buys more.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">3.</span>
            <span>This averaging effect helps reduce risk and build wealth systematically.</span>
          </li>
          <li className="flex gap-3">
            <span className="font-bold text-blue-600">4.</span>
            <span>Over time, the power of compound interest helps your investment grow significantly.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SIPCalculator;
