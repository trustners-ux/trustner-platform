import React from 'react'
import {
  AreaChart as RechartsAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function AreaChart({
  data,
  xKey,
  yKey,
  title,
  height = 300,
  colors = ['#1565c0'],
}) {
  return (
    <div className="card p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsAreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <defs>
            {Array.isArray(yKey)
              ? yKey.map((key, idx) => (
                  <linearGradient key={`gradient-${key}`} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[idx] || colors[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors[idx] || colors[0]} stopOpacity={0.1} />
                  </linearGradient>
                ))
              : [
                  <linearGradient key="gradient-default" id="colorDefault" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={colors[0]} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={colors[0]} stopOpacity={0.1} />
                  </linearGradient>,
                ]}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          {Array.isArray(yKey) ? (
            <>
              {yKey.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx] || colors[0]}
                  fillOpacity={1}
                  fill={`url(#color${key})`}
                />
              ))}
              <Legend />
            </>
          ) : (
            <Area
              type="monotone"
              dataKey={yKey}
              stroke={colors[0]}
              fillOpacity={1}
              fill="url(#colorDefault)"
            />
          )}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  )
}
