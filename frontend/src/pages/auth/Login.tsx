import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import {
  LogIn,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  X,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Monitor,
  Sparkles
} from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

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
    setActiveDemo(role);
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
    <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* Aesthetic Ambient Light Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-20 right-1/4 w-[450px] h-[450px] bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white shadow-md shadow-slate-200/60 border border-slate-100 ring-4 ring-slate-50 transition-transform duration-300 hover:scale-105">
            <img
              src="/logo.png"
              alt="St. Rita's College of Balingasag Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 mb-2 rounded-full bg-blue-50 border border-blue-100/80 text-brand-700 text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>EduQueue Student Services</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign in to access your appointments and queue status
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/70 p-6 sm:p-8">
          {/* Notifications */}
          {loggedOutNotice && (
            <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-emerald-900 text-xs flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-semibold block text-emerald-950">Signed Out Successfully</strong>
                  <span className="text-[11px] text-emerald-700">Your session was safely closed.</span>
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
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-600" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address or Student ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => {
                    setIdentifier(e.target.value);
                    setActiveDemo(null);
                  }}
                  placeholder="e.g. 2026-0001 or name@srcb.edu.ph"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setActiveDemo(null);
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
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
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill - Aesthetic Segmented Chips */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Demo Accounts
              </span>
              <span className="text-[11px] text-slate-400 font-medium">Click to prefill</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  activeDemo === 'admin'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
                    : 'bg-purple-50/70 hover:bg-purple-100 text-purple-700 border-purple-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('staff')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  activeDemo === 'staff'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm shadow-sky-200'
                    : 'bg-sky-50/70 hover:bg-sky-100 text-sky-700 border-sky-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemoLogin('student')}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  activeDemo === 'student'
                    ? 'bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-200'
                    : 'bg-teal-50/70 hover:bg-teal-100 text-teal-700 border-teal-100'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student</span>
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              New student at SRCB?{' '}
              <Link
                to="/register"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition inline-flex items-center gap-0.5"
              >
                Create an account
                <ArrowRight className="w-3 h-3 inline" />
              </Link>
            </p>
          </div>
        </div>

        {/* Public Queue Display Helper Link */}
        <div className="mt-6 text-center">
          <Link
            to="/display"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 transition bg-white/70 hover:bg-white px-3.5 py-1.5 rounded-full border border-slate-200/60 shadow-xs"
          >
            <Monitor className="w-3.5 h-3.5 text-brand-600" />
            <span>Looking for the live queue board? <strong className="font-semibold text-brand-600">View Public Display</strong></span>
          </Link>
        </div>
      </div>
    </div>
  );
};
