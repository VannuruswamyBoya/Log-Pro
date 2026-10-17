import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const styles = {
    success: {
      bg: 'bg-emerald-600 text-white shadow-emerald-500/20',
      icon: CheckCircle2,
    },
    error: {
      bg: 'bg-rose-600 text-white shadow-rose-500/20',
      icon: AlertCircle,
    },
    info: {
      bg: 'bg-blue-600 text-white shadow-blue-500/20',
      icon: Info,
    },
  };

  const current = styles[type] || styles.info;
  const Icon = current.icon;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-down">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl ${current.bg}`}>
        <Icon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-medium pr-2">{message}</span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
