import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { Toast } from '../components/Toast';
import { 
  Settings, 
  Clock, 
  FileCheck, 
  ShieldCheck, 
  Save, 
  RefreshCw, 
  Building2, 
  HardDrive,
  Loader2
} from 'lucide-react';

export const AdminSettings = () => {
  const [settings, setSettings] = useState({
    daily_deadline: '17:00',
    allow_replacement_before_deadline: true,
    max_file_size_mb: 10,
    allowed_extensions: ['pdf', 'doc', 'docx', 'txt'],
    company_name: 'Log Pro Enterprise',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to load settings:', err);
      setToast({ show: true, message: 'Could not fetch system settings.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await adminApi.updateSettings(settings);
      setToast({ show: true, message: res.message || 'System settings saved!', type: 'success' });
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to update system settings.';
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
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              System Configuration & Policies
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define daily submission deadlines, file validation policies, and upload thresholds.
          </p>
        </div>

        <button
          onClick={fetchSettings}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Deadline & Submission Policy Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Daily Submission Deadline & Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Daily Deadline Time (24-Hour Format HH:MM)
              </label>
              <input
                type="time"
                required
                value={settings.daily_deadline}
                onChange={(e) => setSettings({ ...settings, daily_deadline: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Submissions received after this cutoff will be automatically classified as <strong>LATE</strong>.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Company / Organization Brand Name
              </label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => setSettings({ ...settings, company_name: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
              />
            </div>
          </div>

          {/* Toggle replacement */}
          <div className="pt-2">
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allow_replacement_before_deadline}
                onChange={(e) => setSettings({ ...settings, allow_replacement_before_deadline: e.target.checked })}
                className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Allow File Replacement Before Daily Deadline
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When enabled, employees can upload an updated log sheet if submitted before the cutoff time. The previous version is archived in audit history.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* File Upload & Storage Rules Card */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <HardDrive className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              File Upload & Storage Policies
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Maximum File Size Limit (MB)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={settings.max_file_size_mb}
                onChange={(e) => setSettings({ ...settings, max_file_size_mb: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Files exceeding this threshold will be rejected server-side.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Permitted File Extensions
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {settings.allowed_extensions?.map((ext) => (
                  <span
                    key={ext}
                    className="px-3 py-1 rounded-xl text-xs font-bold uppercase bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                  >
                    .{ext}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                Enforced by extension, MIME type, and magic signature byte inspection.
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Applying Settings...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
