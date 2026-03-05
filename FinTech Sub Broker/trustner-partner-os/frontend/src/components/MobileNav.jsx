import React from 'react';
import { useLocation, Link } from 'react-router-dom';

/**
 * Mobile Bottom Navigation Component
 * 5-tab navigation for mobile screens (hidden on md and up)
 * Sticky bottom positioning with active tab indicator
 */
function MobileNav() {
  const location = useLocation();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 ${
            isActive ? 'text-[#D4A843]' : 'text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M3 13h2v8H3zm4-8h2v16H7zm4-2h2v18h-2zm4-2h2v20h-2zm4 4h2v16h-2z" />
        </svg>
      )
    },
    {
      id: 'clients',
      label: 'Clients',
      path: '/clients',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 ${
            isActive ? 'text-[#D4A843]' : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM16 16a5 5 0 010 10H4a5 5 0 010-10h12z"
          />
        </svg>
      )
    },
    {
      id: 'insurance',
      label: 'Insurance',
      path: '/insurance',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 ${
            isActive ? 'text-[#D4A843]' : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    },
    {
      id: 'mutual-funds',
      label: 'MF',
      path: '/mutual-funds',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 ${
            isActive ? 'text-[#D4A843]' : 'text-gray-400'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )
    },
    {
      id: 'more',
      label: 'More',
      path: '/menu',
      icon: (isActive) => (
        <svg
          className={`w-6 h-6 ${
            isActive ? 'text-[#D4A843]' : 'text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 8c1.1 0 2-0.9 2-2s-0.9-2-2-2-2 0.9-2 2 0.9 2 2 2zm0 2c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2zm0 6c-1.1 0-2 0.9-2 2s0.9 2 2 2 2-0.9 2-2-0.9-2-2-2z" />
        </svg>
      )
    }
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 md:hidden z-40 bg-[#0D1B3E] border-t border-gray-700 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex flex-col items-center justify-center w-1/5 py-3 transition-all duration-200 ${
                active
                  ? 'text-[#D4A843] border-t-2 border-[#D4A843] border-opacity-100'
                  : 'text-gray-400 border-t-2 border-transparent hover:text-gray-300'
              }`}
              aria-label={item.label}
              title={item.label}
            >
              <div className="flex items-center justify-center">{item.icon(active)}</div>
              <span className="text-xs font-medium mt-1 truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default MobileNav;
