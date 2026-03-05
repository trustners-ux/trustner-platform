import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency, formatNumber, formatPercentage } from '../../utils/formatters'

export default function StatCard({
  title,
  value,
  change,
  changeType = 'positive',
  icon: Icon,
  color = 'blue',
  format = 'currency',
  subtitle,
}) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    purple: 'bg-purple-50 text-purple-600',
    gold: 'bg-gold-50 text-gold-600',
    teal: 'bg-teal-50 text-teal-600',
  }

  const getBorderColor = () => {
    const borderMap = {
      blue: 'border-blue-200',
      green: 'border-green-200',
      red: 'border-red-200',
      purple: 'border-purple-200',
      gold: 'border-gold-200',
      teal: 'border-teal-200',
    }
    return borderMap[color] || 'border-gray-200'
  }

  const formatValue = () => {
    switch (format) {
      case 'currency':
        return formatCurrency(value)
      case 'number':
        return formatNumber(value)
      case 'percentage':
        return formatPercentage(value)
      default:
        return value
    }
  }

  const TrendIcon = changeType === 'positive' ? TrendingUp : TrendingDown
  const trendColor = changeType === 'positive' ? 'text-green-600' : 'text-red-600'

  return (
    <div className={`card p-6 border-l-4 ${getBorderColor()}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{formatValue()}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
          {change !== undefined && change !== null && (
            <div className="flex items-center mt-2 gap-1">
              <TrendIcon className={`w-4 h-4 ${trendColor}`} />
              <span className={`text-sm font-medium ${trendColor}`}>
                {changeType === 'positive' ? '+' : ''}{change}%
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  )
}
