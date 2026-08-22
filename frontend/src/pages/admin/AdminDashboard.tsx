import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Radio,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    try {
      const res = await api.getDashboardStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Operations Command Center</span>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-md uppercase">
              Staff Portal
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live overview of student service appointments, queue flow, and operational throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/queue"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Radio className="w-4 h-4" />
            <span>Open Queue Counter</span>
          </Link>
          <Link
            to="/admin/appointments"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Review Appointments</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Appointments */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Appointments
            </span>
            <div className="p-2.5 rounded-2xl bg-amber-50 text-amber-600">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            {stats?.appointments?.total_pending_appointments ?? 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Awaiting decision</span>
            <Link to="/admin/appointments?status=pending" className="font-bold text-brand-600 hover:underline">
              Process →
            </Link>
          </div>
        </div>

        {/* Live Queue Waiting */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Waiting in Queue
            </span>
            <div className="p-2.5 rounded-2xl bg-cyan-50 text-cyan-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            {stats?.queues?.currently_waiting ?? 0}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">Calling: {stats?.queues?.currently_calling ?? 0}</span>
            <Link to="/admin/queue" className="font-bold text-cyan-600 hover:underline">
              Call Next →
            </Link>
          </div>
        </div>

        {/* Today's Completed Transactions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Today's Completed
            </span>
            <div className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            {(stats?.appointments?.today_completed_appointments ?? 0) + (stats?.queues?.today_completed ?? 0)}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats?.appointments?.today_completed_appointments ?? 0} Appts + {stats?.queues?.today_completed ?? 0} Queue
          </div>
        </div>

        {/* Total Registered Students */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Students
            </span>
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 mt-3">
            {stats?.users?.total_students ?? 0}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {stats?.services?.total_services ?? 0} Total institutional services
          </div>
        </div>
      </div>

      {/* 7-Day Operational Volume Breakdown Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <span>7-Day Service Volume Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily comparison of scheduled appointments vs. walk-in queue tickets
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-brand-600"></span>
              <span className="text-slate-600">Appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-cyan-500"></span>
              <span className="text-slate-600">Queue Tickets</span>
            </div>
          </div>
        </div>

        {/* SVG/HTML Bar Chart */}
        <div className="pt-4">
          <div className="grid grid-cols-7 gap-3 sm:gap-6 items-end h-48 sm:h-56 pb-2 border-b border-slate-100">
            {stats?.trends_7days?.map((item) => {
              const maxVal = Math.max(1, ...stats.trends_7days!.map(t => Math.max(t.appointments, t.queues)));
              const aptHeight = Math.round((item.appointments / maxVal) * 100);
              const qHeight = Math.round((item.queues / maxVal) * 100);

              return (
                <div key={item.date} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="flex items-end gap-1.5 sm:gap-2 h-full w-full justify-center">
                    {/* Appointment Bar */}
                    <div
                      style={{ height: `${Math.max(8, aptHeight)}%` }}
                      className="w-full max-w-[20px] bg-brand-600 rounded-t-lg transition-all duration-300 group-hover:bg-brand-700 relative"
                      title={`Appointments: ${item.appointments}`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-bold transition pointer-events-none">
                        {item.appointments}
                      </span>
                    </div>
                    {/* Queue Bar */}
                    <div
                      style={{ height: `${Math.max(8, qHeight)}%` }}
                      className="w-full max-w-[20px] bg-cyan-500 rounded-t-lg transition-all duration-300 group-hover:bg-cyan-600 relative"
                      title={`Queues: ${item.queues}`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded font-bold transition pointer-events-none">
                        {item.queues}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 truncate text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
