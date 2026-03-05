import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ROLES } from '../utils/constants'
import LoadingSpinner from '../components/common/LoadingSpinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const user = await login(email, password)

      if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.COMPLIANCE_ADMIN || user.role === ROLES.FINANCE_ADMIN) {
        navigate('/admin/dashboard')
      } else if (user.role === ROLES.SUB_BROKER || user.role === ROLES.REGIONAL_HEAD) {
        navigate('/partner/dashboard')
      } else if (user.role === ROLES.CLIENT) {
        navigate('/client/portfolio')
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-navy-500 text-white flex-col justify-between p-12">
        <div>
          <h1 className="text-4xl font-bold">Trustner</h1>
          <p className="text-navy-200 mt-2">Partner Operating System</p>
        </div>
        <div>
          <p className="text-lg text-navy-100 mb-8">
            Unified platform for managing partnerships, commissions, and client portfolios
          </p>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-gold-500 rounded-full mt-2" />
              <div>
                <p className="font-semibold">Real-time Dashboard</p>
                <p className="text-sm text-navy-200">Monitor key metrics instantly</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-gold-500 rounded-full mt-2" />
              <div>
                <p className="font-semibold">Smart Commission Management</p>
                <p className="text-sm text-navy-200">Accurate calculations and payouts</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-2 h-2 bg-gold-500 rounded-full mt-2" />
              <div>
                <p className="font-semibold">Compliance First</p>
                <p className="text-sm text-navy-200">Built-in regulatory controls</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 bg-light">
        <div className="max-w-md mx-auto w-full">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
            <p className="text-gray-600 mt-2">Sign in to your Trustner account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@trustner.com"
                required
                className="input-base"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="input-base"
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 mt-6"
            >
              {isLoading ? <LoadingSpinner size="sm" text="" /> : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Powered by <span className="font-semibold text-gray-900">Trustner Asset Services</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
