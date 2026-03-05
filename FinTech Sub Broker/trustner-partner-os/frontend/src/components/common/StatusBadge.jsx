import React from 'react'
import {
  KYC_STATUS_COLORS,
  PARTNER_STATUS_COLORS,
  TRANSACTION_STATUS_COLORS,
  COMPLIANCE_SEVERITY_COLORS,
  PAYOUT_STATUS_COLORS,
  CLIENT_STATUS_COLORS,
} from '../../utils/constants'

const colorMap = {
  kyc: KYC_STATUS_COLORS,
  partner: PARTNER_STATUS_COLORS,
  transaction: TRANSACTION_STATUS_COLORS,
  severity: COMPLIANCE_SEVERITY_COLORS,
  payout: PAYOUT_STATUS_COLORS,
  client: CLIENT_STATUS_COLORS,
}

const getBgColor = (color) => {
  const bgMap = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
    cyan: 'bg-cyan-100 text-cyan-800',
  }
  return bgMap[color] || 'bg-gray-100 text-gray-800'
}

export default function StatusBadge({ status, variant = 'partner' }) {
  const colors = colorMap[variant] || colorMap.partner
  const color = colors[status] || 'gray'
  const bgClass = getBgColor(color)

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bgClass}`}>
      {status}
    </span>
  )
}
