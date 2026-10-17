import React from 'react';

export const StatCard = ({ title, value, subtitle, icon: Icon, color = 'blue', trend = null }) => {
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/40',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900/40',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/40',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900/40',
    },
    indigo: {
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400',
      border: 'border-indigo-100 dark:border-indigo-900/40',
    },
  };

  const style = colorStyles[color] || colorStyles.blue;

  return (
    <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border ${style.border} shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</span>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${style.iconBg}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {trend}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
