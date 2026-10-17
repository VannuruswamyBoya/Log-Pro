import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="p-4 rounded-3xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4">
        <FileQuestion className="w-12 h-12" />
      </div>
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
        404 - Page Not Found
      </h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm">
        The requested resource or management page does not exist or has been relocated.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
};
