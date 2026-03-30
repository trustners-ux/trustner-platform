'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { LiveFundDetail } from '@/types/live-fund';

const BAR_COLORS = ['#0d9488', '#f59e0b', '#6366f1', '#ec4899'];

interface ReturnsBarChartProps {
  funds: LiveFundDetail[];
}

function truncateName(name: string, max = 20): string {
  if (name.length <= max) return name;
  return name.substring(0, max) + '...';
}

export function ReturnsBarChart({ funds }: ReturnsBarChartProps) {
  if (funds.length === 0) return null;

  // Build data for grouped bar chart
  const periods = [
    { key: '1Y', accessor: (f: LiveFundDetail) => f.calculatedReturns.oneYear ?? f.enriched?.returns?.oneYear ?? null },
    { key: '3Y', accessor: (f: LiveFundDetail) => f.calculatedReturns.threeYear ?? f.enriched?.returns?.threeYear ?? null },
    { key: '5Y', accessor: (f: LiveFundDetail) => f.calculatedReturns.fiveYear ?? f.enriched?.returns?.fiveYear ?? null },
  ];

  const data = periods.map(({ key, accessor }) => {
    const row: Record<string, string | number | null> = { period: key };
    funds.forEach((fund) => {
      row[`fund_${fund.schemeCode}`] = accessor(fund);
    });
    return row;
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Returns Comparison (CAGR %)</h3>
      <div className="w-full h-[300px] sm:h-[350px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%" barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="period"
              tick={{ fontSize: 13, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#64748b' }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickFormatter={(val: number) => `${val}%`}
            />
            <Tooltip
              formatter={(value: number, name: string) => {
                const fund = funds.find((f) => `fund_${f.schemeCode}` === name);
                const label = fund ? truncateName(fund.schemeName, 30) : name;
                return [value !== null ? `${value.toFixed(2)}%` : 'N/A', label];
              }}
              labelFormatter={(label: string) => `Period: ${label}`}
              contentStyle={{
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                fontSize: '12px',
              }}
            />
            <Legend
              formatter={(value: string) => {
                const fund = funds.find((f) => `fund_${f.schemeCode}` === value);
                return fund ? truncateName(fund.schemeName, 24) : value;
              }}
              wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
            />
            {funds.map((fund, index) => (
              <Bar
                key={fund.schemeCode}
                dataKey={`fund_${fund.schemeCode}`}
                fill={BAR_COLORS[index % BAR_COLORS.length]}
                radius={[4, 4, 0, 0]}
                name={`fund_${fund.schemeCode}`}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
