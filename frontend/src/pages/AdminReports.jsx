import React, { useState, useEffect } from 'react';
import { reportsApi } from '../api/reports';
import { StatCard } from '../components/StatCard';
import { Toast } from '../components/Toast';
import { 
  BarChart3, 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  RefreshCw,
  FileCheck,
  Printer
} from 'lucide-react';

export const AdminReports = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [exporting, setExporting] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchReport = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.getWeeklySummary({ start_date: startDate, end_date: endDate });
      setReport(data);
    } catch (err) {
      console.error('Failed to load report summary:', err);
      setToast({ show: true, message: 'Could not load report data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startDate, endDate]);

  const handleExport = async (format) => {
    try {
      setExporting(format);
      const params = { start_date: startDate, end_date: endDate };
      if (format === 'csv') {
        await reportsApi.exportCSV(params);
        setToast({ show: true, message: 'CSV report downloaded successfully.', type: 'success' });
      } else if (format === 'excel') {
        await reportsApi.exportExcel(params);
        setToast({ show: true, message: 'Excel workbook downloaded successfully.', type: 'success' });
      } else if (format === 'pdf') {
        await reportsApi.exportPDF(params);
        setToast({ show: true, message: 'PDF report generated and downloaded.', type: 'success' });
      }
    } catch (err) {
      setToast({ show: true, message: `Failed to export ${format.toUpperCase()} report.`, type: 'error' });
    } finally {
      setExporting(null);
    }
  };

  const kpis = report?.kpis;

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
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Weekly Compliance Reports & Exports
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate and export official submission compliance records in CSV, Excel, and PDF formats.
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition-colors disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Date Range Selection Bar */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-indigo-600" />
          <span>Report Window:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
            />
          </div>

          <button
            onClick={fetchReport}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Compliance"
          value={kpis ? `${kpis.compliance_rate}%` : '--'}
          subtitle={`${kpis?.on_time ?? 0} on-time out of ${kpis?.expected_submissions ?? 0} expected`}
          icon={CheckCircle2}
          color="emerald"
        />

        <StatCard
          title="Total Received"
          value={kpis?.total_submitted ?? '--'}
          subtitle={`Across ${kpis?.total_users ?? 0} active employees`}
          icon={FileCheck}
          color="indigo"
        />

        <StatCard
          title="Late Submissions"
          value={kpis?.late ?? 0}
          subtitle="Submissions after daily deadline"
          icon={Clock}
          color="amber"
        />

        <StatCard
          title="Missing Logs"
          value={kpis?.missing ?? 0}
          subtitle="Expected but unsubmitted"
          icon={AlertTriangle}
          color="rose"
        />
      </div>

      {/* User Compliance Ranking Table */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden p-6">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Employee Compliance Performance Breakdown
          </h3>
          <p className="text-xs text-slate-400">
            Individual performance metrics for the period {startDate} to {endDate}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-3">Employee Name</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3">Submitted</th>
                <th className="py-3 px-3">On-Time</th>
                <th className="py-3 px-3">Late</th>
                <th className="py-3 px-3">Status Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {report?.user_breakdown?.map((u) => {
                const isCompliant = u.submitted > 0 && u.late === 0;
                return (
                  <tr key={u.user_id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {u.email}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300 font-medium">
                      {u.department}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-200">
                      {u.submitted} logs
                    </td>
                    <td className="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                      {u.on_time}
                    </td>
                    <td className="py-3 px-3 text-amber-600 dark:text-amber-400 font-semibold">
                      {u.late}
                    </td>
                    <td className="py-3 px-3">
                      {isCompliant ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          100% On-Time
                        </span>
                      ) : u.late > 0 ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          {u.late} Late Uploads
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          No Submissions
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
