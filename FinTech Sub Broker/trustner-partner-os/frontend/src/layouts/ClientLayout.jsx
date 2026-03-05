import React from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { Briefcase, Target, CreditCard, TrendingUp, User, LogOut, Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const navItems = [
  { label: 'Portfolio', path: '/client/portfolio', icon: Briefcase },
  { label: 'Goals', path: '/client/goals', icon: Target },
  { label: 'Transactions', path: '/client/transactions', icon: CreditCard },
  { label: 'SIPs', path: '/client/sips', icon: TrendingUp },
  { label: 'Profile', path: '/client/profile', icon: User },
]

export default function ClientLayout() {
  const { logout, user } = useAuth()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-light">
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-500 rounded-lg flex items-center justify-center text-white font-bold">
                T
              </div>
              <h1 className="text-xl font-bold text-gray-900">Trustner</h1>
            </div>

            <div className="flex items-center gap-8">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-2 text-sm font-medium transition-colors pb-4 border-b-2 ${
                      isActive
                        ? 'text-blue-600 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{user?.name || 'Investor'}</p>
                  <p className="text-xs text-gray-600">Client</p>
                </div>
                <div className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'C'}
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </div>
    </div>
  )
}
