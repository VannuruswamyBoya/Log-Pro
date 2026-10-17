import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileSpreadsheet, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Sun, 
  Moon, 
  ShieldCheck, 
  CheckCircle2,
  Loader2
} from 'lucide-react';

export const UserLogin = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setErrorMsg('Please enter both your email/username and password.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(identifier.trim(), password, 'user');
      navigate('/dashboard');
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setErrorMsg(detail);
    }
  };

  const fillDemoCredentials = () => {
    setIdentifier('john.doe@company.com');
    setPassword('UserPassword123!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 relative transition-colors">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white shadow-xl shadow-blue-600/25 mb-3">
            <FileSpreadsheet className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Log<span className="text-blue-600 dark:text-blue-400">Pro</span> Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Log Sheet Upload and Management System
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80 dark:border-slate-800 transition-colors">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Employee Sign In</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Access your daily dashboard and track log sheet submission deadlines.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Work Email or Username
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 dark:text-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Autofill Employee Demo Account (John Doe)</span>
            </button>
          </div>
        </div>

        {/* Link to Admin Portal */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Are you a system administrator?{' '}
            <Link
              to="/admin/login"
              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
