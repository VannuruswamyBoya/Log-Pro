import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, AlertCircle, RefreshCw } from 'lucide-react';

export const StatusBadge = ({ status, size = 'md' }) => {
  const normStatus = (status || '').toUpperCase();

  const configs = {
    ON_TIME: {
      label: 'On Time',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
    SUBMITTED_ON_TIME: {
      label: 'Submitted (On-Time)',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
      icon: CheckCircle2,
      dot: 'bg-emerald-500',
    },
    LATE: {
      label: 'Late Submission',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: Clock,
      dot: 'bg-amber-500',
    },
    SUBMITTED_LATE: {
      label: 'Submitted Late',
      bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
      icon: Clock,
      dot: 'bg-amber-500',
    },
    PENDING: {
      label: 'Pending Today',
      bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
      icon: AlertCircle,
      dot: 'bg-blue-500',
    },
    OVERDUE: {
      label: 'Overdue / Missing',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: AlertTriangle,
      dot: 'bg-rose-500',
    },
    MISSING: {
      label: 'Missing',
      bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
      icon: AlertTriangle,
      dot: 'bg-rose-500',
    },
    REPLACED: {
      label: 'Replaced',
      bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
      icon: RefreshCw,
      dot: 'bg-purple-500',
    },
  };

  const current = configs[normStatus] || {
    label: status || 'Unknown',
    bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    icon: AlertCircle,
    dot: 'bg-slate-400',
  };

  const Icon = current.icon;
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} transition-colors`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{current.label}</span>
    </span>
  );
};
