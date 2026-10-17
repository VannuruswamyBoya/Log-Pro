import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { submissionsApi } from '../api/submissions';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { 
  Users, 
  FileCheck, 
  Clock, 
  AlertTriangle, 
  TrendingUp, 
  Download, 
  BarChart3, 
  Calendar,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getDashboard();
      setStats(data);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setToast({ show: true, message: 'Failed to fetch admin metrics.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleDownload = async (submissionId, filename) => {
    try {
      await submissionsApi.downloadSubmission(submissionId, filename);
      setToast({ show: true, message: `Downloading ${filename}...`, type: 'info' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to download file.', type: 'error' });
    }
  };

  const todaySummary = stats?.today_summary;

  return (
    <div className="space-y-6 animate-fade-in">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Admin Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              Executive Console
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Log Sheet Monitoring & Analytics
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time compliance tracking across all enterprise business units.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Refresh analytics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            to="/admin/reports"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Generate Reports</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Employees"
          value={todaySummary?.total_users ?? '--'}
          subtitle="Active submitters"
          icon={Users}
          color="indigo"
        />

        <StatCard
          title="Submitted Today"
          value={todaySummary?.submitted_today ?? '--'}
          subtitle={`Compliance: ${todaySummary?.compliance_rate ?? 0}%`}
          icon={FileCheck}
          color="emerald"
          trend={`${todaySummary?.compliance_rate ?? 0}% Rate`}
        />

        <StatCard
          title="On-Time vs Late Today"
          value={`${todaySummary?.on_time_today ?? 0} / ${todaySummary?.late_today ?? 0}`}
          subtitle={`${todaySummary?.on_time_today ?? 0} on-time, ${todaySummary?.late_today ?? 0} late`}
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Pending / Missing Today"
          value={todaySummary?.missing_today ?? '--'}
          subtitle="Users who have not submitted"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* Recharts Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                7-Day Submission Trends
              </h3>
              <p className="text-xs text-slate-400">
                Daily volume of on-time, late, and missing submissions
              </p>
            </div>
            <div className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Past 7 Days</span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            {stats?.trends_7d?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.trends_7d} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#0f172a', 
                      borderColor: '#334155', 
                      borderRadius: '0.75rem', 
                      color: '#fff',
                      fontSize: '12px' 
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="on_time" name="On Time" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" name="Late" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="missing" name="Missing" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                No trend data available.
              </div>
            )}
          </div>
        </div>

        {/* Department Compliance Breakdown */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Department Compliance
                </h3>
                <p className="text-xs text-slate-400">
                  Submission completion status for today
                </p>
              </div>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>

            <div className="space-y-4 pt-2">
              {stats?.department_breakdown?.map((dept) => (
                <div key={dept.department} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {dept.department}
                    </span>
                    <span className="font-bold text-slate-600 dark:text-slate-400">
                      {dept.submitted_today}/{dept.total_users} ({dept.completion_pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        dept.completion_pct === 100
                          ? 'bg-emerald-500'
                          : dept.completion_pct >= 50
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${dept.completion_pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6 flex justify-between items-center text-xs">
            <span className="text-slate-400">Total Departments: {stats?.department_breakdown?.length || 0}</span>
            <Link to="/admin/submissions" className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
              Inspect all logs &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Enterprise Submissions
            </h3>
            <p className="text-xs text-slate-400">
              Live incoming log sheet submissions from employees
            </p>
          </div>
          <Link
            to="/admin/submissions"
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
          >
            <span>Explore All Records</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Date</th>
                <th className="py-3 px-3">File Name</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {stats?.recent_submissions?.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{item.user_name}</p>
                    <p className="text-[11px] text-slate-400">{item.user_email}</p>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {item.department}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    {item.business_date}
                  </td>
                  <td className="py-3 px-3 text-slate-700 dark:text-slate-300">
                    <span className="font-medium truncate block max-w-xs">{item.original_filename}</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge status={item.status} size="sm" />
                  </td>
                  <td className="py-3 px-3 text-right">
                    <button
                      onClick={() => handleDownload(item.id, item.original_filename)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                      title="Download uploaded log sheet"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
