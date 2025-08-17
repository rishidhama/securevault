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
    <aside className="h-screen w-56 bg-white border-r border-secondary-200 flex flex-col py-6 px-4 shadow-sm">
      <div className="mb-8 flex items-center gap-2">
        <Shield className="w-7 h-7 text-primary-600" />
        <span className="text-xl font-bold text-gradient">SecureVault</span>
      </div>
      <nav className="flex-1 space-y-2">
        {navItems.map(item => (
          <Link
            key={item.name}
            to={item.to}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors font-medium text-secondary-700 hover:bg-primary-50 hover:text-primary-700 ${location.pathname === item.to ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            {item.icon}
            {item.name}
          </Link>
        ))}
      </nav>
      <button
        onClick={onLogout}
        className="flex items-center gap-3 px-3 py-2 rounded-lg text-danger-600 hover:bg-danger-50 font-medium mt-8"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
};

export default Sidebar;