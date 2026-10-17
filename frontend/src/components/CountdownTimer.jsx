import React, { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

export const CountdownTimer = ({ countdownData, onTimerExpire = null }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(countdownData?.remaining_seconds ?? 0);
  const [isPastDeadline, setIsPastDeadline] = useState(countdownData?.is_past_deadline ?? false);
  const expireCallbackRef = useRef(onTimerExpire);

  useEffect(() => {
    expireCallbackRef.current = onTimerExpire;
  }, [onTimerExpire]);

  useEffect(() => {
    if (countdownData) {
      setRemainingSeconds(countdownData.remaining_seconds ?? 0);
      setIsPastDeadline(countdownData.is_past_deadline ?? false);
    }
  }, [countdownData]);

  useEffect(() => {
    if (isPastDeadline) return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setIsPastDeadline(true);
          if (expireCallbackRef.current) expireCallbackRef.current();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPastDeadline]);


  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  // Format deadline time nicely (e.g. 17:00 -> 5:00 PM)
  const formatDeadlineDisplay = (timeStr) => {
    if (!timeStr) return '5:00 PM';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className={`p-6 rounded-2xl border transition-all ${
      isPastDeadline
        ? 'bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border-amber-300 dark:border-amber-800/60'
        : 'bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-transparent border-blue-200 dark:border-blue-900/50'
    } shadow-sm`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-xl ${isPastDeadline ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400'}`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Daily Submission Deadline
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deadline: <span className="font-semibold text-slate-700 dark:text-slate-300">Today at {formatDeadlineDisplay(countdownData?.deadline_time_setting)}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center">
          {isPastDeadline ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              <AlertTriangle className="w-3.5 h-3.5 animate-pulse" />
              Late Submission Window
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" />
              On-Time Window Active
            </span>
          )}
        </div>
      </div>

      {/* Counter Blocks */}
      <div className="mt-5 grid grid-cols-3 gap-3 max-w-sm mx-auto sm:mx-0">
        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {hours.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
            Hours
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
            {minutes.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
            Minutes
          </span>
        </div>

        <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className={`text-2xl sm:text-3xl font-extrabold font-mono tracking-tight ${
            isPastDeadline
              ? 'text-amber-600 dark:text-amber-400'
              : remainingSeconds < 300
              ? 'text-rose-600 dark:text-rose-400 animate-pulse'
              : 'text-blue-600 dark:text-blue-400'
          }`}>
            {seconds.toString().padStart(2, '0')}
          </span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 mt-1">
            Seconds
          </span>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Business Date: <strong className="text-slate-700 dark:text-slate-300">{countdownData?.current_business_date || 'Today'}</strong></span>
        {isPastDeadline ? (
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Submissions now marked as Late
          </span>
        ) : (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Submissions now logged as On-Time
          </span>
        )}
      </div>
    </div>
  );
};
