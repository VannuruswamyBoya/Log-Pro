import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { Toast } from '../components/Toast';
import { 
  User, 
  Lock, 
  Mail, 
  Building2, 
  BadgeCheck, 
  Save, 
  KeyRound, 
  Loader2 
} from 'lucide-react';

export const UserProfile = () => {
  const { user, refreshProfile } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [employeeId, setEmployeeId] = useState(user?.employee_id || '');

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        full_name: fullName.trim(),
        department: department.trim(),
        employee_id: employeeId.trim(),
      };

      if (newPassword) {
        if (newPassword !== confirmPassword) {
          setToast({ show: true, message: 'New passwords do not match.', type: 'error' });
          setSaving(false);
          return;
        }
        if (!currentPassword) {
          setToast({ show: true, message: 'Current password is required to change password.', type: 'error' });
          setSaving(false);
          return;
        }
        payload.current_password = currentPassword;
        payload.new_password = newPassword;
      }

      await authApi.updateProfile(payload);
      await refreshProfile();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setToast({ show: true, message: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update profile.';
      setToast({ show: true, message: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <User className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              User Profile & Settings
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage your personal profile details and security credentials.
          </p>
        </div>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase">
          {user?.role} Account
        </span>
      </div>

      <form onSubmit={handleUpdateProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <BadgeCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Personal Information</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Email Address (Fixed)
            </label>
            <input
              type="text"
              disabled
              value={user?.email || ''}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Department
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="e.g. Engineering, Operations"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Employee ID
            </label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              placeholder="e.g. ENG-1042"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <KeyRound className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">Security & Password</h3>
          </div>

          <p className="text-xs text-slate-400">
            Leave blank if you do not want to change your password.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="md:col-span-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
