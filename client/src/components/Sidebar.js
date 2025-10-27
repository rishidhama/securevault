import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  LogOut, 
  Settings, 
  Activity, 
  Tag,
  Bell,
  Fingerprint
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', to: '/', icon: <Shield className="w-5 h-5" /> },
  { name: 'Vault', to: '/vault', icon: <Lock className="w-5 h-5" /> },
  { name: 'Security Monitor', to: '/breach-monitor', icon: <Activity className="w-5 h-5" /> },
  { name: 'Smart Categories', to: '/smart-categories', icon: <Tag className="w-5 h-5" /> },
  { name: 'Settings', to: '/settings', icon: <Settings className="w-5 h-5" /> },
];

const Sidebar = ({ onLogout }) => {
  const location = useLocation();
  return (
    <aside className="h-screen w-48 sm:w-56 bg-white border-r border-secondary-200 flex flex-col py-4 sm:py-6 px-3 sm:px-4 shadow-sm">
      <div className="mb-6 sm:mb-8 flex items-center gap-2">
        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary-600" />
        <span className="text-lg sm:text-xl font-bold text-gradient">SecureVault</span>
      </div>
      <nav className="flex-1 space-y-1 sm:space-y-2">
        {navItems.map(item => (
          <Link
            key={item.name}
            to={item.to}
            className={`flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 sm:py-2 rounded-lg transition-colors font-medium text-secondary-700 hover:bg-primary-50 hover:text-primary-700 text-sm sm:text-base ${location.pathname === item.to ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.name}</span>
            <span className="sm:hidden text-xs">{item.name.split(' ')[0]}</span>
          </Link>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-2 rounded-lg text-danger-600 hover:bg-danger-50 font-medium mt-6 sm:mt-8 text-sm sm:text-base"
      >
        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Logout</span>
        <span className="sm:hidden text-xs">Exit</span>
      </button>
    </aside>
  );
};

export default Sidebar;