import React from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function BarChart({
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
        <RechartsBarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis dataKey={xKey} stroke="#6b7280" />
          <YAxis stroke="#6b7280" />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }}
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
          />
          {Array.isArray(yKey) ? (
            yKey.map((key, idx) => (
              <Bar key={key} dataKey={key} fill={colors[idx] || colors[0]} radius={[8, 8, 0, 0]} />
            ))
          ) : (
            <Bar dataKey={yKey} fill={colors[0]} radius={[8, 8, 0, 0]} />
          )}
          {Array.isArray(yKey) && <Legend />}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  )
}
