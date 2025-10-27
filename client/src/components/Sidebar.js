import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Shield, 
  Lock, 
  LogOut, 
  Settings, 
  Activity, 
  Tag,
  Bell,
  Fingerprint,
  Menu,
  X
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-secondary-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary-600" />
          <span className="text-lg font-bold text-gradient">SecureVault</span>
        </div>
        <button
          onClick={toggleMobileMenu}
          className="p-2 rounded-lg hover:bg-secondary-100"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`h-screen w-56 bg-white border-r border-secondary-200 flex flex-col py-6 px-4 shadow-sm fixed lg:relative z-50 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="mb-8 flex items-center gap-2">
          <Shield className="w-7 h-7 text-primary-600" />
          <span className="text-xl font-bold text-gradient">SecureVault</span>
        </div>
        <nav className="flex-1 space-y-2">
          {navItems.map(item => (
            <Link
              key={item.name}
              to={item.to}
              onClick={() => setIsMobileMenuOpen(false)}
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
    </>
  );
};

export default Sidebar;