import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import PageHeader from '../../components/common/PageHeader'
import { apiService } from '../../services/api'
import LoadingSpinner from '../../components/common/LoadingSpinner'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({})
  const [tiers, setTiers] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [settingsRes, tiersRes] = await Promise.all([
          apiService.get('/admin/settings'),
          apiService.get('/admin/settings/commission-tiers'),
        ])
        setSettings(settingsRes)
        setTiers(tiersRes)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSaveSettings = async () => {
    setIsSaving(true)
    try {
      await apiService.patch('/admin/settings', settings)
      alert('Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      alert('Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveTiers = async () => {
    setIsSaving(true)
    try {
      await apiService.patch('/admin/settings/commission-tiers', tiers)
      alert('Commission tiers saved successfully!')
    } catch (error) {
      console.error('Failed to save tiers:', error)
      alert('Failed to save tiers')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Configure system parameters and rates"
      />

      <div className="space-y-8">
        {/* System Configuration */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                TDS Rate (%)
              </label>
              <input
                type="number"
                value={settings.tdsRate || 0}
                onChange={(e) => setSettings({ ...settings, tdsRate: parseFloat(e.target.value) })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Rate (%)
              </label>
              <input
                type="number"
                value={settings.gstRate || 0}
                onChange={(e) => setSettings({ ...settings, gstRate: parseFloat(e.target.value) })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revenue Share (%)
              </label>
              <input
                type="number"
                value={settings.revenueShare || 0}
                onChange={(e) => setSettings({ ...settings, revenueShare: parseFloat(e.target.value) })}
                className="input-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Payout Amount (₹)
              </label>
              <input
                type="number"
                value={settings.minPayoutAmount || 0}
                onChange={(e) => setSettings({ ...settings, minPayoutAmount: parseFloat(e.target.value) })}
                className="input-base"
              />
            </div>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Settings
          </button>
        </div>

        {/* Commission Tiers */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Commission Tiers</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Tier</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Min AUM</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Max AUM</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Upfront %</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-900">Trail %</th>
                </tr>
              </thead>
              <tbody>
                {tiers.map((tier, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{tier.name}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.minAum}
                        onChange={(e) => {
                          const updated = [...tiers]
                          updated[idx].minAum = parseFloat(e.target.value)
                          setTiers(updated)
                        }}
                        className="input-base w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.maxAum}
                        onChange={(e) => {
                          const updated = [...tiers]
                          updated[idx].maxAum = parseFloat(e.target.value)
                          setTiers(updated)
                        }}
                        className="input-base w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.upfrontRate}
                        onChange={(e) => {
                          const updated = [...tiers]
                          updated[idx].upfrontRate = parseFloat(e.target.value)
                          setTiers(updated)
                        }}
                        className="input-base w-full"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={tier.trailRate}
                        onChange={(e) => {
                          const updated = [...tiers]
                          updated[idx].trailRate = parseFloat(e.target.value)
                          setTiers(updated)
                        }}
                        className="input-base w-full"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleSaveTiers}
            disabled={isSaving}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            Save Tiers
          </button>
        </div>
      </div>
    </div>
  )
}
