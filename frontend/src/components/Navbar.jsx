import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Sun, 
  Moon, 
  LogOut, 
  ShieldCheck, 
  User, 
  Menu,
  FileSpreadsheet
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Navbar = ({ onToggleSidebar }) => {
  const { user, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate(isAdmin ? '/admin/login' : '/login');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Mobile hamburger & Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/dashboard')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                Log<span className="text-blue-600 dark:text-blue-400">Pro</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                Enterprise
              </span>
            </div>
          </div>
        </div>

        {/* Right: Actions, Theme, User profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Role Badge */}
          {isAdmin ? (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </span>
          ) : (
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <User className="w-3.5 h-3.5" />
              Employee Portal
            </span>
          )}

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* User profile avatar and details */}
          {user && (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div 
                onClick={() => navigate('/profile')}
                className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shadow-xs cursor-pointer hover:opacity-90 transition-opacity"
                title={`${user.full_name} (${user.department})`}
              >
                {getInitials(user.full_name)}
              </div>

              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                  {user.full_name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[120px]">
                  {user.department || user.email}
                </p>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
