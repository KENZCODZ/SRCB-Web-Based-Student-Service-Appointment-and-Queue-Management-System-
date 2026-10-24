import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { LogIn, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, Eye, EyeOff, X } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const expired = queryParams.get('expired');
  const loggedOutParam = queryParams.get('logged_out');
  const [loggedOutNotice, setLoggedOutNotice] = useState(Boolean(loggedOutParam));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({
        email: identifier.includes('@') ? identifier : undefined,
        student_id_number: !identifier.includes('@') ? identifier : undefined,
        password,
      });

      if (user.role === 'admin' || user.role === 'staff') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role: 'admin' | 'staff' | 'student') => {
    if (role === 'admin') {
      setIdentifier('admin@srcb.edu.ph');
      setPassword('password123');
    } else if (role === 'staff') {
      setIdentifier('staff@srcb.edu.ph');
      setPassword('password123');
    } else {
      setIdentifier('student1@srcb.edu.ph');
      setPassword('password123');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mb-5 flex justify-center">
          <div className="p-3.5 bg-white rounded-3xl shadow-lg shadow-slate-200/70 border border-slate-100 inline-flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="St. Rita's College of Balingasag Logo" 
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to EduQueue
        </h2>
        <p className="mt-1 text-sm text-slate-500 font-medium">
          St. Rita's College of Balingasag Student Services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          {loggedOutNotice && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-bold block text-emerald-950">Successfully Signed Out</strong>
                  <span className="text-[11px] text-emerald-800">Your session has been securely closed. Thank you!</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoggedOutNotice(false)}
                className="p-1 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-100 rounded-lg transition"
                title="Dismiss message"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {expired && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address or Student ID
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 2026-0001 or student@srcb.edu.ph"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md shadow-brand-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Buttons for easy evaluation */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center mb-2.5">
              Quick Demo Fill (Default Accounts)
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl font-semibold transition text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff')}
                className="p-2 bg-sky-50 hover:bg-sky-100 text-sky-700 rounded-xl font-semibold transition text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className="p-2 bg-teal-50 hover:bg-teal-100 text-teal-700 rounded-xl font-semibold transition text-center"
              >
                Student
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              New Student?{' '}
              <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700">
                Register for an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
