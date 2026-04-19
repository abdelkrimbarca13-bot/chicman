import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, Shirt, Users, ClipboardList, LogOut, TrendingUp, Wallet, Menu, X, History, Settings, Sun, Moon, Scissors, Wrench } from 'lucide-react';

const Layout = ({ children }) => {
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
  ];

  if (user?.role === 'ADMIN') {
    menuItems.push({ name: 'Revenus', path: '/revenue', icon: <TrendingUp size={20} /> });
    menuItems.push({ name: 'Historique', path: '/audit', icon: <History size={20} /> });
    menuItems.push({ name: 'Paramètres', path: '/users', icon: <Settings size={20} /> });
  }

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-rich-black text-zinc-900 dark:text-white flex items-center justify-between px-4 z-40 border-b border-gold/30">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-normal text-zinc-900 dark:text-white font-nathalyn">Chic</span>
          <span className="text-xs font-light tracking-[0.4em] text-gold -mt-1 font-elegant italic">MEN</span>
        </div>
        <button onClick={toggleSidebar} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md">
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 w-64 bg-white dark:bg-rich-black text-zinc-900 dark:text-white flex flex-col z-50 transform transition-transform duration-300 ease-in-out border-r border-gold/20
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 hidden lg:flex flex-col items-center border-b border-gold/20">
          <span className="text-5xl font-normal text-zinc-900 dark:text-white font-nathalyn">Chic</span>
          <span className="text-lg font-light tracking-[0.6em] text-gold -mt-2 font-elegant italic">MAN</span>
        </div>
        
        <div className="lg:hidden p-6 flex flex-col items-center border-b border-gold/20">
          <span className="text-3xl font-normal text-zinc-900 dark:text-white font-nathalyn">Chic</span>
          <span className="text-sm font-light tracking-[0.5em] text-gold -mt-2 font-elegant italic">MEN</span>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-6 py-4 lg:py-3 transition-colors ${
                location.pathname === item.path ? 'bg-zinc-100 dark:bg-zinc-900 border-l-4 border-gold text-gold' : 'hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-gold'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gold/20">
          <div className="flex items-center mb-4 px-2 text-sm text-zinc-400">
            <span className="truncate">Connecté: <span className="font-bold text-zinc-900 dark:text-gold uppercase tracking-tighter">{user?.username}</span> <span className="text-[10px] opacity-50">({user?.role})</span></span>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-6 py-3 mb-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-gold transition-colors rounded-md"
          >
            {theme === 'dark' ? <Sun size={20} className="mr-3" /> : <Moon size={20} className="mr-3" />}
            {theme === 'dark' ? 'Mode Clair' : 'Mode Sombre'}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-6 py-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-gold transition-colors rounded-md"
          >
            <LogOut size={20} className="mr-3" /> Déconnexion
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
