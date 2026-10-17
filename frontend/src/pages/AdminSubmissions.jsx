import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import { submissionsApi } from '../api/submissions';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';
import { 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Download, 
  RefreshCw, 
  XCircle,
  FileText,
  History,
  Eye,
  X
} from 'lucide-react';

export const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, item: null });

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter) params.status = statusFilter;
      if (deptFilter) params.department = deptFilter;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const data = await adminApi.getAllSubmissions(params);
      setSubmissions(data.results || []);
    } catch (err) {
      console.error('Failed to fetch admin submissions:', err);
      setToast({ show: true, message: 'Could not load submissions.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter, deptFilter, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchSubmissions();
  };

  const handleClearFilters = () => {
    setSearch('');
    setStatusFilter('');
    setDeptFilter('');
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
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Enterprise Log Sheet Repository
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Review, verify timestamps, inspect versions, and download authorized submitted files.
          </p>
        </div>

        <button
          onClick={fetchSubmissions}
          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 transition-colors self-start sm:self-auto"
          title="Refresh table"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, email, filename..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/30 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-hidden"
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

        {(search || statusFilter || deptFilter || startDate || endDate) && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">Filtering {submissions.length} submission records</span>
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400 hover:underline font-semibold"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
            <span>Retrieving records...</span>
          </div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-600 dark:text-slate-300">No submissions matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">File Name</th>
                  <th className="py-3.5 px-4">Size & Format</th>
                  <th className="py-3.5 px-4">Uploaded At</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Version</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900 dark:text-slate-100">{sub.user_name}</p>
                      <p className="text-[11px] text-slate-400">{sub.user_email}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-medium">
                      {sub.department}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {sub.business_date}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate block max-w-[200px]" title={sub.original_filename}>
                        {sub.original_filename}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300 mr-1.5">
                        {sub.file_format}
                      </span>
                      {formatFileSize(sub.file_size)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatTimestamp(sub.upload_timestamp)}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={sub.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      {sub.history && sub.history.length > 0 ? (
                        <button
                          onClick={() => setHistoryModal({ isOpen: true, item: sub })}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-100 transition-colors"
                          title="Click to view previous versions"
                        >
                          <History className="w-3 h-3" />
                          <span>v{sub.version} ({sub.history.length})</span>
                        </button>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                          v{sub.version || 1}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDownload(sub.id, sub.original_filename)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-slate-700 transition-colors font-medium text-[11px]"
                        title="Download file"
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

      {/* History Version Modal */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Audit History: Version Replacements
                </h3>
              </div>
              <button
                onClick={() => setHistoryModal({ isOpen: false, item: null })}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-500">
              Submission for <strong>{historyModal.item?.user_name}</strong> on <strong>{historyModal.item?.business_date}</strong>.
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              <div className="p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs">
                <span className="font-bold text-purple-900 dark:text-purple-300">Active Version v{historyModal.item?.version}</span>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">{historyModal.item?.original_filename}</p>
                <p className="text-[11px] text-slate-400 mt-1">Uploaded: {formatTimestamp(historyModal.item?.upload_timestamp)}</p>
              </div>

              {historyModal.item?.history?.map((h, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Replaced Version v{h.version}</span>
                  <p className="text-slate-500 mt-0.5">{h.original_filename}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Replaced at: {formatTimestamp(h.replaced_at)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
