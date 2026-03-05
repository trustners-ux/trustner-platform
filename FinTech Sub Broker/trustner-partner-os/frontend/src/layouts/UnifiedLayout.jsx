import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu,
  X,
  Bell,
  LogOut,
  ChevronDown,
  BarChart3,
  PieChart,
  TrendingUp,
  ClipboardList,
  FileText,
  Settings,
  User,
  Users,
  Banknote,
  Calendar,
  MessageSquare,
  Shield,
  DollarSign,
  Activity,
  Home,
} from 'lucide-react';

const UnifiedLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Mock user data - replace with actual from context/state
  const user = {
    name: 'Rajesh Kumar',
    role: 'Insurance Broker',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=RajeshKumar',
  };

  const isActive = (path) => location.pathname.startsWith(path);
  const isInsuranceSection = location.pathname.startsWith('/insurance');
  const isMFSection = location.pathname.startsWith('/mf');

  const menuItems = [
    {
      section: 'MUTUAL FUNDS',
      color: 'blue',
      items: [
        { label: 'MF Dashboard', icon: Home, path: '/mf/dashboard' },
        { label: 'Fund Explorer', icon: TrendingUp, path: '/mf/explorer' },
        { label: 'SIP Calculator', icon: BarChart3, path: '/mf/sip-calculator' },
        { label: 'InvestWell', icon: DollarSign, path: 'https://investwell.example.com', external: true },
      ],
    },
    {
      section: 'INSURANCE',
      color: 'teal',
      items: [
        { label: 'IB Dashboard', icon: Home, path: '/insurance/dashboard' },
        { label: 'Leads', icon: Users, path: '/insurance/leads' },
        { label: 'Policies', icon: FileText, path: '/insurance/policies' },
        { label: 'Claims', icon: Shield, path: '/insurance/claims' },
        { label: 'Endorsements', icon: ClipboardList, path: '/insurance/endorsements' },
        { label: 'Renewals', icon: Calendar, path: '/insurance/renewals' },
        { label: 'POSP Management', icon: Users, path: '/insurance/posp', adminOnly: true },
        { label: 'Commission', icon: Banknote, path: '/insurance/commissions' },
        { label: 'Support Tickets', icon: MessageSquare, path: '/insurance/tickets' },
        { label: 'Reports', icon: BarChart3, path: '/insurance/reports' },
      ],
    },
    {
      section: 'AI ADVISORY',
      color: 'purple',
      items: [
        { label: 'Advisory Dashboard', icon: Activity, path: '/advisory' },
        { label: 'Risk Assessment', icon: Shield, path: '/advisory/risk-assessment' },
        { label: 'Goal Planner', icon: TrendingUp, path: '/advisory/goal-planner' },
        { label: 'Insurance Gap', icon: PieChart, path: '/advisory/insurance-gap' },
        { label: 'Smart Recommend', icon: BarChart3, path: '/advisory/smart-recommend' },
        { label: 'AI Chat', icon: MessageSquare, path: '/advisory/chat' },
      ],
    },
  ];

  const commonItems = [
    { label: 'My Profile', icon: User, path: '/profile' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const renderMenuSection = (section) => {
    const isInsurance = section.color === 'teal';
    const colorMap = {
      blue: { accent: 'text-blue-600 hover:bg-blue-50', border: 'border-blue-200', active: 'bg-blue-50 text-blue-700 border-blue-500' },
      teal: { accent: 'text-teal-600 hover:bg-teal-50', border: 'border-teal-200', active: 'bg-teal-50 text-teal-700 border-teal-500' },
      purple: { accent: 'text-purple-600 hover:bg-purple-50', border: 'border-purple-200', active: 'bg-purple-50 text-purple-700 border-purple-500' },
    };
    const colors = colorMap[section.color] || colorMap.blue;
    const accentColor = colors.accent;
    const borderColor = colors.border;

    return (
      <div key={section.section} className="mb-6">
        <h3 className={`px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>
          {section.section}
        </h3>
        <div className={`border-l-2 ${borderColor} ml-4`}>
          {section.items.map((item) => {
            if (item.adminOnly && user.role !== 'Admin') return null;

            const Icon = item.icon;
            const isCurrentActive = isActive(item.path);

            if (item.external) {
              return (
                <a
                  key={item.label}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${accentColor}`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </a>
              );
            }

            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium transition-all ${
                  isCurrentActive
                    ? `${section.color === 'blue' ? 'bg-blue-50 border-l-4 border-blue-600 text-blue-700' : 'bg-teal-50 border-l-4 border-teal-600 text-teal-700'}`
                    : `text-gray-700 ${accentColor}`
                }`}
              >
                <Icon className="w-4 h-4 mr-3" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-0'
        } bg-gradient-to-b from-slate-900 to-slate-800 text-white transition-all duration-300 overflow-hidden flex flex-col`}
      >
        {/* Logo */}
        <div className="px-4 py-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-teal-400 rounded-lg flex items-center justify-center font-bold text-sm">
                TR
              </div>
              <h1 className="text-xl font-bold">Trustner</h1>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-slate-700 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-4">
          {menuItems.map(renderMenuSection)}

          {/* Divider */}
          <div className="border-t border-slate-700 my-4" />

          {/* Common Items */}
          <div>
            {commonItems.map((item) => {
              const Icon = item.icon;
              const isCurrentActive = isActive(item.path);

              return (
                <button
                  key={item.label}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isCurrentActive
                      ? 'bg-slate-700 text-white'
                      : 'text-gray-300 hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-700 p-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 hidden sm:block">
              {isInsuranceSection && 'Insurance Broking'}
              {isMFSection && 'Mutual Funds'}
              {!isInsuranceSection && !isMFSection && 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-6">
            {/* Notifications */}
            <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-600" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <button
                    onClick={() => {
                      navigate('/profile');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                  >
                    <User className="w-4 h-4 mr-2" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate('/settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default UnifiedLayout;
