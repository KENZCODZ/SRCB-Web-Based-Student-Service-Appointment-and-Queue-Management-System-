import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { DashboardStats } from '../../types';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  Radio,
  Users,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Activity,
  Layers,
  Building2,
  User,
  Sparkles,
  PhoneCall,
  Filter
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [adminOfficeFilter, setAdminOfficeFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadStats = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.getDashboardStats({
        office: user?.role === 'admin' && adminOfficeFilter !== 'all' ? adminOfficeFilter : undefined
      });
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
    // Real-time live polling every 5 seconds
    const interval = setInterval(() => {
      loadStats(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [adminOfficeFilter]);

  return (
    <div className="space-y-6">
      {/* Header with Live Status & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Operations Command Center
            </h1>
            {user?.role === 'staff' && user.department_or_course && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>{user.department_or_course}</span>
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/70">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Updates</span>
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {user?.role === 'staff'
              ? `Real-time monitoring of ${user.department_or_course || 'your office'} service appointments, walk-in queues, and counter throughput.`
              : 'Real-time monitoring of campus service appointments, walk-in queues, and counter flow.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-200 flex items-center gap-1.5 transition active:scale-95"
            title="Refresh now"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-600' : 'text-slate-500'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            <span className="text-[10px] text-slate-400 hidden sm:inline">
              ({lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
            </span>
          </button>

          <Link
            to="/admin/queue"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <Radio className="w-4 h-4" />
            <span>Open Queue Counter</span>
          </Link>

          <Link
            to="/admin/appointments"
            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition"
          >
            <Calendar className="w-4 h-4" />
            <span>Review Appointments</span>
          </Link>
        </div>
      </div>

      {/* Admin Office Filter Pill Bar */}
      {user?.role === 'admin' && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mr-1 whitespace-nowrap">
            <Building2 className="w-3.5 h-3.5 text-brand-600" />
            <span>Office Filter:</span>
          </span>
          {['all', 'Registrar', 'Finance', 'IT Department', 'Guidance', 'Dean Office', 'Library'].map((off) => (
            <button
              key={off}
              onClick={() => setAdminOfficeFilter(off)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
                adminOfficeFilter === off
                  ? 'bg-brand-600 text-white border-brand-600 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {off === 'all' ? 'All Campus Offices' : `${off} Office`}
            </button>
          ))}
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pending Appointments */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-amber-300 transition-all">
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
            <span className="text-slate-500">Awaiting staff decision</span>
            <Link to="/admin/appointments?status=pending" className="font-bold text-brand-600 hover:underline">
              Process →
            </Link>
          </div>
        </div>

        {/* Live Queue Waiting */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-cyan-300 transition-all">
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
            <span className="text-slate-500">
              Calling: <strong className="text-amber-600 font-bold">{stats?.queues?.currently_calling ?? 0}</strong> • Serving: <strong className="text-cyan-700 font-bold">{stats?.queues?.currently_serving ?? 0}</strong>
            </span>
            <Link to="/admin/queue" className="font-bold text-cyan-600 hover:underline">
              Call Next →
            </Link>
          </div>
        </div>

        {/* Today's Completed Transactions */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-emerald-300 transition-all">
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
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats?.appointments?.today_completed_appointments ?? 0} Appts + {stats?.queues?.today_completed ?? 0} Queues</span>
            <span className="text-emerald-600 font-semibold">Today</span>
          </div>
        </div>

        {/* Total Registered Students */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden group hover:border-indigo-300 transition-all">
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
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>{stats?.services?.total_services ?? 0} Institutional Services</span>
            <Link to="/admin/users" className="font-bold text-indigo-600 hover:underline">
              Manage →
            </Link>
          </div>
        </div>
      </div>

      {/* Live Counter Summaries Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-600" />
            <span>Service Counters Status</span>
          </h2>
          <span className="text-xs text-slate-400">
            Current queue status across campus service points
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats?.counter_summaries && stats.counter_summaries.length > 0 ? (
            stats.counter_summaries.map((counter) => (
              <div
                key={counter.service_id}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs hover:border-brand-200 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {counter.service_code}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 mt-1 truncate" title={counter.service_name}>
                      {counter.service_name}
                    </h3>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5" title={counter.location_or_counter}>
                      {counter.location_or_counter}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black text-brand-700 bg-brand-50 px-2 py-1 rounded-lg">
                      {counter.waiting_count} waiting
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block">Now Serving</span>
                    {counter.current_ticket ? (
                      <span className="font-mono font-bold text-brand-700 flex items-center gap-1">
                        <PhoneCall className="w-3 h-3 text-emerald-600 animate-pulse" />
                        {counter.current_ticket}
                      </span>
                    ) : (
                      <span className="text-slate-400 italic text-[11px]">No active call</span>
                    )}
                  </div>
                  <Link
                    to={`/admin/queue?service_id=${counter.service_id}`}
                    className="text-xs font-bold text-brand-600 hover:text-brand-800 transition"
                  >
                    Manage →
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-4 p-6 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-400">
              No service counters configured.
            </div>
          )}
        </div>
      </div>

      {/* Main Operations Split: Live Active Queue Tickets & Today's Appointments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Live Queue Calling Board */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>Live Active Queue Feed</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Students currently being called or waiting in queue today
              </p>
            </div>
            <Link
              to="/admin/queue"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Counter View <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.live_queue_entries && stats.live_queue_entries.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.live_queue_entries.map((ticket) => (
                <div
                  key={ticket.id}
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="font-mono font-black text-sm px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-800 border border-slate-200/60 flex-shrink-0">
                      {ticket.queue_number}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 font-semibold">
                          {ticket.first_name} {ticket.last_name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ticket.student_id_number}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate max-w-[200px] sm:max-w-xs">
                        {ticket.service_name} • <span className="text-slate-400">{ticket.counter_number || ticket.location_or_counter}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={ticket.status} />
                    <Link
                      to={`/admin/queue?service_id=${ticket.service_id}`}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                      title="Manage Ticket"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No active tickets waiting in queue right now</p>
              <p className="text-[11px] text-slate-400 mt-1">Walk-in tickets will appear here live when students join.</p>
              <Link
                to="/admin/queue"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 rounded-xl hover:bg-emerald-100 transition"
              >
                <span>Issue Walk-in Ticket</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Today's Appointments & Pending Actions */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>Today's & Pending Appointments</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Appointments booked for today and pending review
              </p>
            </div>
            <Link
              to="/admin/appointments"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              All Appointments <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.today_appointments_list && stats.today_appointments_list.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.today_appointments_list.map((apt) => (
                <div
                  key={apt.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-brand-800 flex-shrink-0">
                      <span className="text-[10px] font-bold uppercase leading-none">
                        {apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString([], { month: 'short' }) : 'TODAY'}
                      </span>
                      <span className="text-sm font-black leading-tight">
                        {apt.appointment_date ? new Date(apt.appointment_date).getDate() : ''}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 font-semibold">
                          {apt.first_name} {apt.last_name}
                        </strong>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {apt.appointment_code}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium truncate max-w-[200px] sm:max-w-xs">
                        {apt.service_name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)} • {apt.location_or_counter}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={apt.status} />
                    <Link
                      to={`/admin/appointments?status=${apt.status}`}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs transition"
                      title="Process Appointment"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No appointments scheduled for today</p>
              <p className="text-[11px] text-slate-400 mt-1">Bookings from students will appear here automatically.</p>
              <Link
                to="/admin/appointments"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition"
              >
                <span>View Full Calendar</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Operational Volume Breakdown Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-brand-600" />
              <span>7-Day Service Volume Trend</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Daily volume of scheduled appointments vs. walk-in queue tickets
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
              const maxVal = Math.max(1, ...(stats?.trends_7days?.map(t => Math.max(t.appointments, t.queues)) || [1]));
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
