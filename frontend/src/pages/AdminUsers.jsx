import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { Toast } from '../components/Toast';
import { 
  Users, 
  UserPlus, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RefreshCw,
  Mail,
  Lock,
  Building2,
  BadgeCheck,
  Power,
  X,
  Loader2
} from 'lucide-react';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    full_name: '',
    email: '',
    username: '',
    password: '',
    department: 'Engineering',
    employee_id: '',
    role: 'user',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUsers();
      setUsers(data.results || []);
    } catch (err) {
      console.error('Failed to load users:', err);
      setToast({ show: true, message: 'Could not fetch users list.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await adminApi.toggleUserStatus(userId);
      setToast({ show: true, message: res.message, type: 'success' });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update user status.';
      setToast({ show: true, message: msg, type: 'error' });
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    try {
      setCreatingUser(true);
      const res = await adminApi.createUser(newUser);
      setToast({ show: true, message: res.message, type: 'success' });
      setIsAddUserOpen(false);
      setNewUser({
        full_name: '',
        email: '',
        username: '',
        password: '',
        department: 'Engineering',
        employee_id: '',
        role: 'user',
      });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to create user account.';
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setCreatingUser(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = search.toLowerCase();
    return (
      u.full_name?.toLowerCase().includes(term) ||
      u.email?.toLowerCase().includes(term) ||
      u.department?.toLowerCase().includes(term) ||
      u.employee_id?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              User Accounts & Compliance
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Monitor submission compliance rates, manage employee permissions, and provision new accounts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
            title="Refresh users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setIsAddUserOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, department, ID..."
            className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
          />
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline-block">
          Showing <strong>{filteredUsers.length}</strong> accounts
        </span>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Loading user profiles...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No matching users found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Department & ID</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Total Submitted</th>
                  <th className="py-3.5 px-4">Compliance Rate</th>
                  <th className="py-3.5 px-4">Late Count</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{u.full_name}</p>
                      <p className="text-[11px] text-slate-400">{u.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="text-slate-700 dark:text-slate-300 font-medium">{u.department}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{u.employee_id || '--'}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {u.total_submissions} sheets
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full ${
                              u.compliance_rate >= 80 ? 'bg-emerald-500' : u.compliance_rate >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${u.compliance_rate}%` }}
                          />
                        </div>
                        <span className="font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {u.compliance_rate}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-600 dark:text-amber-400">
                      {u.late_submissions}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-500">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Deactivated</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleStatus(u.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            u.is_active
                              ? 'text-rose-500 border-rose-200 hover:bg-rose-50 dark:border-rose-900/60 dark:hover:bg-rose-950/40'
                              : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/60 dark:hover:bg-emerald-950/40'
                          }`}
                          title={u.is_active ? 'Deactivate user' : 'Reactivate user'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Provision New User Account</h3>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newUser.full_name}
                  onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  placeholder="e.g. Alex Wong"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="alex.wong@company.com"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    placeholder="alex.wong"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Department
                  </label>
                  <select
                    value={newUser.department}
                    onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                  >
                    <option value="Engineering">Engineering</option>
                    <option value="Product & Design">Product & Design</option>
                    <option value="Quality Assurance">Quality Assurance</option>
                    <option value="Operations">Operations</option>
                    <option value="Sales & Marketing">Sales & Marketing</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={newUser.employee_id}
                    onChange={(e) => setNewUser({ ...newUser, employee_id: e.target.value })}
                    placeholder="ENG-5001"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
