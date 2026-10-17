import React, { useState, useEffect } from 'react';
import { submissionsApi } from '../api/submissions';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  FileText, 
  RefreshCw,
  XCircle,
  FileCheck
} from 'lucide-react';

export const UserHistory = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await submissionsApi.getMyHistory(params);
      setSubmissions(data.results || []);
    } catch (err) {
      console.error('Failed to fetch submission history:', err);
      setToast({ show: true, message: 'Could not load submission history.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setStartDate('');
    setEndDate('');
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
    return date.toLocaleString([], { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

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
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <History className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              My Submission History
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, search, and download your previous daily log sheet uploads.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchHistory}
            className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors"
            title="Refresh history"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name or notes..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
            >
              <option value="">All Statuses</option>
              <option value="ON_TIME">On-Time Submissions</option>
              <option value="LATE">Late Submissions</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
              title="End Date"
            />
          </div>
        </form>

        {(search || statusFilter || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500">Filters active</span>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
            <span>Loading submission records...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No submissions found</p>
            <p>Try modifying your filters or date range.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Business Date</th>
                  <th className="py-3.5 px-4">File Name</th>
                  <th className="py-3.5 px-4">Format</th>
                  <th className="py-3.5 px-4">Size</th>
                  <th className="py-3.5 px-4">Uploaded At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {sub.business_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="max-w-xs truncate font-medium text-slate-800 dark:text-slate-200">
                        {sub.original_filename}
                      </div>
                      {sub.notes && (
                        <div className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                          Notes: {sub.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {sub.file_format}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                      {formatFileSize(sub.file_size)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatTimestamp(sub.upload_timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
                        v{sub.version}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownload(sub.id, sub.original_filename)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-700 transition-colors font-medium text-[11px]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
