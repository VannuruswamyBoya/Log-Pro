import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  Users, 
  BarChart3, 
  Settings, 
  UserCheck, 
  X,
  FileSpreadsheet
} from 'lucide-react';

export const Sidebar = ({ isOpen, onClose }) => {
  const { isAdmin, user } = useAuth();

  const userNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Submission History', path: '/history', icon: History },
    { name: 'Profile Settings', path: '/profile', icon: UserCheck },
  ];

  const adminNavItems = [
    { name: 'Overview Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'All Submissions', path: '/admin/submissions', icon: FileSpreadsheet },
    { name: 'Users & Compliance', path: '/admin/users', icon: Users },
    { name: 'Weekly Reports', path: '/admin/reports', icon: BarChart3 },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  const items = isAdmin ? adminNavItems : userNavItems;

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800'
    }`;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between p-4 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="space-y-6">
          {/* Mobile close button */}
          <div className="flex items-center justify-between lg:hidden pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Section Label */}
          <div className="px-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {isAdmin ? 'Administration Portal' : 'Employee Portal'}
            </p>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 1024) onClose();
                  }}
                  className={navLinkClass}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom card: User info summary */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              {isAdmin ? 'AD' : 'EP'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.full_name || 'Active User'}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
