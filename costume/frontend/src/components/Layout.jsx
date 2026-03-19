import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Shirt, Users, ClipboardList, LogOut, TrendingUp, Wallet } from 'lucide-react';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Articles', path: '/items', icon: <Shirt size={20} /> },
    { name: 'Clients', path: '/customers', icon: <Users size={20} /> },
    { name: 'Locations', path: '/rentals', icon: <ClipboardList size={20} /> },
    { name: 'Caisse', path: '/cash', icon: <Wallet size={20} /> },
    { name: 'Revenus', path: '/revenue', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-700 text-white flex flex-col">
        <div className="p-8 flex flex-col items-center border-b border-indigo-600/50">
          <span className="text-5xl font-normal text-white font-nathalyn">Chic</span>
          <span className="text-lg font-light tracking-[0.6em] text-amber-400 -mt-2 font-elegant italic">MEN</span>
        </div>
        <nav className="flex-1 mt-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-6 py-3 transition-colors ${
                location.pathname === item.path ? 'bg-indigo-800' : 'hover:bg-indigo-600'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-600">
          <div className="flex items-center mb-4 px-2 text-sm text-indigo-200">
            Connecté en tant que: <span className="ml-1 font-semibold text-white">{user?.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-left hover:bg-indigo-600 transition-colors"
          >
            <LogOut size={20} className="mr-3" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-8">
        {children}
      </div>
    </div>
  );
};

export default Layout;
