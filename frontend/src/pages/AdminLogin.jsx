import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle, 
  Sun, 
  Moon, 
  User, 
  CheckCircle2,
  Loader2,
  KeyRound
} from 'lucide-react';

export const AdminLogin = () => {
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
      setErrorMsg('Please enter administrator credentials.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await login(identifier.trim(), password, 'admin');
      navigate('/admin/dashboard');
    } catch (err) {
      setLoading(false);
      const detail = err.response?.data?.detail || 'Administrator authentication failed.';
      setErrorMsg(detail);
    }
  };

  const fillDemoAdmin = () => {
    setIdentifier('admin@logpro.com');
    setPassword('AdminPassword123!');
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white flex flex-col justify-center items-center p-4 relative">
      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5">
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-300 shadow-xs hover:bg-slate-700 transition-colors"
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Brand Banner */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 text-white shadow-xl shadow-indigo-500/25 mb-3">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Log<span className="text-indigo-400">Pro</span> Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise Management & Compliance Console
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-850/90 dark:bg-slate-900/90 bg-slate-800/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound className="w-4 h-4 text-indigo-400" />
              <h2 className="text-xl font-bold text-white">Administrator Access</h2>
            </div>
            <p className="text-xs text-slate-400">
              Restricted area. Only authorized administrators may log in.
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admin Username or Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@logpro.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-slate-900/70 border border-slate-700 text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Authenticate & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-6 pt-5 border-t border-slate-700/80">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="w-full py-2 px-3 rounded-xl text-xs font-medium bg-slate-700/60 text-slate-200 hover:bg-slate-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Autofill Administrator Demo Account</span>
            </button>
          </div>
        </div>

        {/* Link back to Employee Portal */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-400">
            Not an administrator?{' '}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:underline inline-flex items-center gap-1"
            >
              <User className="w-3.5 h-3.5" />
              Employee Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
