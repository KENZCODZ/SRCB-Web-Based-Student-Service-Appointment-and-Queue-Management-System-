import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Phone,
  GraduationCap,
  Calendar,
  Sparkles,
  Check,
  CheckCircle2,
  Hash,
  Monitor
} from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);

  const [formData, setFormData] = useState({
    student_id_number: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    contact_number: '',
    department_or_course: 'BS Information Technology',
    year_level: '1st Year',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const courses = [
    'BS Information Technology',
    'BS Computer Science',
    'BS Business Administration',
    'BS Hospitality Management',
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
    'BS Criminology',
    'Senior High School',
  ];

  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Grade 11', 'Grade 12'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.student_id_number.trim()) {
      setError('Please enter your Student ID Number.');
      return;
    }
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('Please provide both your First and Last Name.');
      return;
    }

    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim()) {
      setError('Please enter a valid email address.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      await register({
        student_id_number: formData.student_id_number.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        contact_number: formData.contact_number.trim(),
        department_or_course: formData.department_or_course,
        year_level: formData.year_level,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  const isPasswordValid = formData.password.length >= 6;
  const doPasswordsMatch = formData.password.length > 0 && formData.password === formData.confirm_password;

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 selection:bg-brand-500 selection:text-white overflow-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -top-20 right-1/4 w-[450px] h-[450px] bg-indigo-400/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Header */}
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
            <span>SRCB Student Portal</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Create Student Account
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Sign up to book appointments and join service queues online
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-xl shadow-slate-200/70 border border-slate-200/70 p-6 sm:p-8">
          {/* 2-Step Visual Stepper */}
          <div className="mb-6 pb-5 border-b border-slate-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-100 -z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-brand-500 transition-all duration-300 -z-0"
                style={{ width: step === 1 ? '50%' : '100%' }}
              />

              <button
                type="button"
                onClick={() => setStep(1)}
                className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === 1
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-emerald-500 text-white'
                }`}
              >
                {step === 2 ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">1</span>
                )}
                <span>1. Academic Info</span>
              </button>

              <button
                type="button"
                disabled={step === 1 && !formData.student_id_number}
                onClick={() => {
                  if (formData.student_id_number && formData.first_name && formData.last_name) {
                    setStep(2);
                  }
                }}
                className={`relative z-10 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  step === 2
                    ? 'bg-brand-600 text-white shadow-sm shadow-brand-500/30'
                    : 'bg-slate-100 text-slate-400 hover:text-slate-600'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px]">2</span>
                <span>2. Account Security</span>
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Step 1: Academic & Personal Information */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student ID Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    name="student_id_number"
                    value={formData.student_id_number}
                    onChange={handleChange}
                    placeholder="e.g. 2026-10482"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Juan"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Dela Cruz"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Program / Course
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <select
                      name="department_or_course"
                      value={formData.department_or_course}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all appearance-none cursor-pointer"
                    >
                      {courses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Year Level
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <select
                      name="year_level"
                      value={formData.year_level}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all appearance-none cursor-pointer"
                    >
                      {yearLevels.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mobile / Contact Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    name="contact_number"
                    value={formData.contact_number}
                    onChange={handleChange}
                    placeholder="e.g. 09123456789"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] flex items-center justify-center gap-2 transition-all"
              >
                <span>Continue to Security Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Step 2: Account Credentials & Security */}
          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Institutional Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="student@srcb.edu.ph"
                    className="w-full pl-10 pr-4 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Appointment reminders and queue notifications will be sent here.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Create Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-11 py-2.5 sm:py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Match Status Pill */}
              {formData.password.length > 0 && (
                <div className="flex items-center gap-2 pt-1 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium text-[11px] ${
                      isPasswordValid ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {isPasswordValid ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : null}
                    {isPasswordValid ? '6+ characters' : 'Minimum 6 characters'}
                  </span>

                  {formData.confirm_password.length > 0 && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-medium text-[11px] ${
                        doPasswordsMatch
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                      }`}
                    >
                      {doPasswordsMatch ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {doPasswordsMatch ? 'Passwords match' : 'Passwords do not match'}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white font-semibold text-sm shadow-md shadow-brand-500/20 active:scale-[0.99] flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <UserPlus className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Footer Link to Login */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already registered?{' '}
              <Link
                to="/login"
                className="font-semibold text-brand-600 hover:text-brand-700 hover:underline transition inline-flex items-center gap-0.5"
              >
                Sign in to your account
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
