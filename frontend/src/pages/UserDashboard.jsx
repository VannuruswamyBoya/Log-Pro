import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { submissionsApi } from '../api/submissions';
import { CountdownTimer } from '../components/CountdownTimer';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { UploadModal } from '../components/UploadModal';
import { Toast } from '../components/Toast';
import { 
  UploadCloud, 
  FileCheck, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  FileText,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Loader2,
  FileSpreadsheet
} from 'lucide-react';

import { Link } from 'react-router-dom';

export const UserDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchDashboardData = async (isSilent = false) => {
    try {
      if (!isSilent && !data) setLoading(true);
      const todayRes = await submissionsApi.getTodayStatus();
      setData(todayRes);
      if (todayRes.recent_submissions) {
        setRecentHistory(todayRes.recent_submissions);
      } else {
        const historyRes = await submissionsApi.getMyHistory({ limit: 5 });
        setRecentHistory(historyRes.results || []);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setToast({ show: true, message: 'Could not fetch today\'s submission status.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleUploadSuccess = (res) => {
    setToast({
      show: true,
      message: res.message || 'Log sheet submitted successfully!',
      type: 'success'
    });
    fetchDashboardData(true);
  };


  const handleDownload = async (submissionId, filename) => {
    try {
      await submissionsApi.downloadSubmission(submissionId, filename);
      setToast({ show: true, message: `Downloading ${filename}...`, type: 'info' });
    } catch (err) {
      setToast({ show: true, message: 'Failed to download file.', type: 'error' });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatTimestamp = (isoStr) => {
    if (!isoStr) return '--';
    const date = new Date(isoStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const todayDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 h-64 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
          <div className="lg:col-span-7 h-64 rounded-3xl bg-slate-200/70 dark:bg-slate-800/60" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: 'success' })}
        />
      )}

      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Employee Workspace
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Team Member'} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Department: <strong className="text-slate-700 dark:text-slate-300">{user?.department}</strong> &bull; ID: <span className="font-mono">{user?.employee_id || 'N/A'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 self-start md:self-auto">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span>{todayDateFormatted}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Today's Submission
          </span>
          <div className="my-3">
            <StatusBadge status={data?.today_submission_status || 'PENDING'} />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {data?.has_submitted_today ? 'Log sheet received for today' : 'Log sheet pending upload'}
          </p>
        </div>

        <StatCard
          title="Total Submissions"
          value={data?.summary?.total_submissions ?? '--'}
          subtitle="Cumulative logged sheets"
          icon={FileText}
          color="blue"
        />

        <StatCard
          title="On-Time Submissions"
          value={data?.summary?.on_time_submissions ?? '--'}
          subtitle={`Compliance rate: ${data?.summary?.compliance_rate ?? 100}%`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Late Submissions"
          value={data?.summary?.late_submissions ?? 0}
          subtitle="Submitted after deadline"
          icon={Clock}
          color="amber"
        />
      </div>

      {/* Countdown Timer and Daily Submission Card Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 24-Hour Countdown Timer */}
        <div className="lg:col-span-5">
          <CountdownTimer 
            countdownData={data?.countdown} 
            onTimerExpire={fetchDashboardData}
          />
        </div>

        {/* Right: Daily Submission Card */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Daily Submission Activity
                  </h3>
                  <p className="text-xs text-slate-400">
                    Business Date: <span className="font-semibold text-slate-700 dark:text-slate-300">{data?.countdown?.current_business_date || 'Today'}</span>
                  </p>
                </div>
              </div>
              <StatusBadge status={data?.today_submission_status || 'PENDING'} />
            </div>

            {/* Submission Status Details */}
            <div className="py-5">
              {data?.has_submitted_today ? (
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {data.today_submission.original_filename}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Format: <strong className="text-slate-700 dark:text-slate-300">{data.today_submission.file_format}</strong> &bull; Size: {formatFileSize(data.today_submission.file_size)} &bull; Version: {data.today_submission.version}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDownload(data.today_submission.id, data.today_submission.original_filename)}
                      className="p-2 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs transition-colors"
                      title="Download uploaded file"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/40 dark:border-emerald-900/30 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
                    <span>Uploaded at {formatTimestamp(data.today_submission.upload_timestamp)}</span>
                    <span className="font-semibold">
                      {data.today_submission.status === 'ON_TIME' ? 'Verified On-Time' : 'Recorded as Late'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-center">
                  <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    No log sheet uploaded for today yet
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Please upload your daily activities before the deadline to maintain an on-time record.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {data?.today_submission?.can_replace 
                ? 'File replacement is allowed prior to the deadline.' 
                : 'One active log sheet per business day.'}
            </span>

            {data?.has_submitted_today ? (
              data?.today_submission?.can_replace ? (
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Replace Log Sheet</span>
                </button>
              ) : (
                <span className="text-xs font-medium text-slate-400 italic">
                  Submission locked
                </span>
              )
            ) : (
              <button
                onClick={() => setIsUploadOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Today's Log Sheet</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Recent Submissions Section */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Recent Submissions
            </h3>
            <p className="text-xs text-slate-400">
              Your most recent daily activity records
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No previous submissions recorded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-3">Business Date</th>
                  <th className="py-3 px-3">File Name</th>
                  <th className="py-3 px-3">Format</th>
                  <th className="py-3 px-3">Upload Time</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {recentHistory.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {item.business_date}
                    </td>
                    <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium">
                      {item.original_filename}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                        {item.file_format}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {formatTimestamp(item.upload_timestamp)}
                    </td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDownload(item.id, item.original_filename)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
        isReplacement={data?.has_submitted_today}
        currentVersion={data?.today_submission?.version || 1}
      />
    </div>
  );
};
