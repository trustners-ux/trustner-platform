import React, { useState } from 'react'
import { Download, Calendar } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'

const reports = [
  {
    name: 'MIS Report',
    description: 'Monthly Management Information System Report',
    frequency: 'Monthly',
    format: 'Excel',
  },
  {
    name: 'Branch Performance',
    description: 'Performance metrics by branch',
    frequency: 'Monthly',
    format: 'Excel',
  },
  {
    name: 'Partner Performance',
    description: 'Individual partner KPIs and metrics',
    frequency: 'Monthly',
    format: 'PDF',
  },
  {
    name: 'AUM Summary',
    description: 'Assets Under Management analysis',
    frequency: 'Daily',
    format: 'Excel',
  },
  {
    name: 'Commission Summary',
    description: 'Commission calculations and breakup',
    frequency: 'Monthly',
    format: 'Excel',
  },
  {
    name: 'Capital Gain Statements',
    description: 'Client portfolio capital gains report',
    frequency: 'Monthly',
    format: 'PDF',
  },
]

export default function ReportsPage() {
  const [selectedReport, setSelectedReport] = useState(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleDownload = (reportName) => {
    console.log(`Downloading ${reportName}...`)
  }

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Generate and download business reports"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, idx) => (
          <div key={idx} className="card p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{report.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{report.description}</p>
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {report.frequency}
              </span>
              <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                {report.format}
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  className="input-base text-sm"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  className="input-base text-sm"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <button
                onClick={() => handleDownload(report.name)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
