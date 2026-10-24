import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { QueueEntry, Appointment, DashboardStats } from '../../types';
import {
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles,
  RefreshCw,
  PhoneCall,
  UserCheck,
  Plus,
  Ticket,
  XCircle
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeTickets, setActiveTickets] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [actionError, setActionError] = useState<string>('');
  const [joiningServiceId, setJoiningServiceId] = useState<number | null>(null);
  const [cancellingTicket, setCancellingTicket] = useState<QueueEntry | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getMyActiveTickets()
      ]);
      setStats(statsRes.data);
      setActiveTickets(ticketsRes.data || []);
      setLastUpdated(new Date());
      setActionError('');
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Live real-time polling every 5 seconds
    const interval = setInterval(() => {
      loadData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickJoinQueue = async (serviceId: number) => {
    setJoiningServiceId(serviceId);
    setActionError('');
    try {
      await api.joinQueue(serviceId);
      await loadData(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to join queue.');
    } finally {
      setJoiningServiceId(null);
    }
  };

  const handleConfirmCancelTicket = async () => {
    if (!cancellingTicket) return;
    setCancelLoading(true);
    setActionError('');
    try {
      await api.cancelQueueTicket(cancellingTicket.id);
      setCancellingTicket(null);
      await loadData(true);
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel queue ticket.');
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time Status */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Student Service Portal</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md text-xs font-semibold text-emerald-200 border border-emerald-400/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Live Updates Active</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Hello, {user?.first_name}!
          </h1>
          <p className="text-sm text-brand-100 mt-1 leading-relaxed">
            Welcome to the SRCB Student Services Appointment and Queue Management Portal. Book appointments in advance or join service queues on demand.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-5">
            <Link
              to="/services"
              className="px-4 py-2 bg-white text-brand-800 font-bold text-xs rounded-xl hover:bg-brand-50 transition shadow-md flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4" />
              <span>Browse Services</span>
            </Link>
            <Link
              to="/appointments"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition border border-white/20 flex items-center gap-1.5"
            >
              <Calendar className="w-4 h-4" />
              <span>My Appointments</span>
            </Link>
            <Link
              to="/queue"
              className="px-4 py-2 bg-emerald-500/80 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition border border-emerald-400/40 flex items-center gap-1.5"
            >
              <Ticket className="w-4 h-4" />
              <span>Queue Center</span>
            </Link>

            <button
              type="button"
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl backdrop-blur-md transition border border-white/20 flex items-center gap-1.5"
              title="Refresh live data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="text-[11px]">
                {refreshing ? 'Updating...' : `Synced ${lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
              </span>
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-shrink-0 items-center justify-center p-3.5 bg-white rounded-2xl shadow-xl shadow-brand-950/20 border border-white/30">
          <img
            src="/logo.png"
            alt="St. Rita's College of Balingasag Logo"
            className="h-14 w-auto object-contain"
          />
        </div>
      </div>

      {/* Action Error Banner if any */}
      {actionError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{actionError}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionError('')}
            className="text-rose-600 hover:text-rose-800 font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Queue Ticket Cards (if student is in queue) */}
      {activeTickets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Your Active Queue Tickets Today</span>
            </h2>
            <Link to="/queue" className="text-xs font-bold text-brand-600 hover:underline">
              View Queue Screen →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className={`bg-white rounded-3xl p-6 border-2 shadow-lg relative overflow-hidden transition-all ${ticket.status === 'calling'
                    ? 'border-amber-400 bg-amber-50/20 shadow-amber-500/10'
                    : ticket.status === 'serving'
                      ? 'border-cyan-400 bg-cyan-50/20 shadow-cyan-500/10'
                      : 'border-brand-500/40 shadow-brand-500/5'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {ticket.service_name}
                  </span>
                  <Badge status={ticket.status} />
                </div>

                <div className="my-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-4xl font-black font-mono text-brand-700 tracking-tight">
                      {ticket.queue_number}
                    </div>
                    <p className="text-xs mt-1">
                      {ticket.status === 'calling' ? (
                        <span className="text-amber-700 font-bold flex items-center gap-1.5 animate-pulse">
                          <PhoneCall className="w-4 h-4 text-amber-600" />
                          <span>Now Calling! Proceed to {ticket.counter_number || 'Counter'}</span>
                        </span>
                      ) : ticket.status === 'serving' ? (
                        <span className="text-cyan-700 font-bold flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-cyan-600" />
                          <span>Currently being served at {ticket.counter_number || 'Counter'}</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">
                          <strong>{ticket.ahead_in_line}</strong> student{(ticket.ahead_in_line ?? 0) === 1 ? '' : 's'} ahead of you in line
                        </span>
                      )}
                    </p>
                  </div>

                  {ticket.status === 'waiting' && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-800">
                        ~{ticket.estimated_wait_mins ?? 0} mins
                      </div>
                      <span className="text-[11px] text-slate-400">Est. Wait</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Location: <strong>{ticket.location_or_counter}</strong>
                  </span>
                  <div className="flex items-center gap-3">
                    {ticket.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => setCancellingTicket(ticket)}
                        className="text-rose-600 hover:text-rose-800 font-semibold"
                      >
                        Cancel Ticket
                      </button>
                    )}
                    <Link to="/queue" className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                      Live Status <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Pending Requests
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">
            {stats?.summary?.pending_appointments ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Awaiting staff review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Upcoming Bookings
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">
            {stats?.summary?.upcoming_appointments ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Confirmed appointments</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Completed Services
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-800 mt-2">
            {stats?.summary?.completed_appointments ?? 0}
          </div>
          <p className="text-xs text-slate-500 mt-1">Past completed transactions</p>
        </div>
      </div>

      {/* Next Upcoming Appointment details */}
      {stats?.next_appointment && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-600" />
              <span>Next Scheduled Appointment</span>
            </h2>
            <Badge status={stats.next_appointment.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block">Service</span>
              <strong className="text-slate-800 text-sm">{stats.next_appointment.service_name}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Appointment Code</span>
              <strong className="text-slate-800 font-mono text-sm">{stats.next_appointment.appointment_code}</strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Date & Time</span>
              <strong className="text-slate-800 text-sm">
                {new Date(stats.next_appointment.appointment_date).toLocaleDateString()} • {stats.next_appointment.start_time?.slice(0, 5)}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Location</span>
              <strong className="text-slate-800 text-sm">{stats.next_appointment.location_or_counter}</strong>
            </div>
          </div>
        </div>
      )}

      {/* Main Split: Live Campus Queue Wait Times & My Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Campus Service Queue Wait Times (Live) */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Live Campus Queue Wait Times</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Current queue length and serving status across campus offices
              </p>
            </div>
            <Link
              to="/queue"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Queue Board <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.live_services && stats.live_services.length > 0 ? (
            <div className="space-y-3">
              {stats.live_services.map((service) => (
                <div
                  key={service.id}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200/60 text-slate-600">
                        {service.code}
                      </span>
                      <strong className="text-xs text-slate-900">{service.name}</strong>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {service.location_or_counter} • Est. ~{service.estimated_wait_mins} mins wait
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-800 block">
                        {service.waiting_count} in line
                      </span>
                      {service.now_serving ? (
                        <span className="text-[10px] text-emerald-600 font-mono font-bold block">
                          Serving {service.now_serving}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 block">Available</span>
                      )}
                    </div>

                    <button
                      type="button"
                      disabled={joiningServiceId === service.id}
                      onClick={() => handleQuickJoinQueue(service.id)}
                      className="px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{joiningServiceId === service.id ? 'Joining...' : 'Get Ticket'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No walk-in queue services currently available.
            </div>
          )}
        </div>

        {/* Right: My Recent Appointments & Requests */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-600" />
                <span>My Recent Appointments</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                History and status of your scheduled appointments
              </p>
            </div>
            <Link
              to="/appointments"
              className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              Book New <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recent_appointments && stats.recent_appointments.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {stats.recent_appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 rounded-xl px-2 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-800 flex-shrink-0">
                      <span className="text-[9px] font-bold uppercase leading-none">
                        {apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString([], { month: 'short' }) : ''}
                      </span>
                      <span className="text-sm font-black leading-tight">
                        {apt.appointment_date ? new Date(apt.appointment_date).getDate() : ''}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-xs text-slate-900 font-semibold truncate max-w-[180px] sm:max-w-xs">
                          {apt.service_name}
                        </strong>
                      </div>
                      <p className="text-[10px] text-slate-400">
                        {apt.start_time?.slice(0, 5)} - {apt.end_time?.slice(0, 5)} • {apt.location_or_counter}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge status={apt.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400">
              <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No appointments scheduled</p>
              <p className="text-[11px] text-slate-400 mt-1">Book a slot with the Registrar, Dean, or Guidance office.</p>
              <Link
                to="/appointments"
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-brand-700 bg-brand-50 rounded-xl hover:bg-brand-100 transition"
              >
                <span>Book Appointment</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* TICKET CANCELLATION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!cancellingTicket}
        onClose={() => !cancelLoading && setCancellingTicket(null)}
        title="Leave Service Queue"
        maxWidth="md"
      >
        {cancellingTicket && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket to Cancel
                </span>
                <div className="text-2xl font-black font-mono text-slate-900 mt-0.5">
                  {cancellingTicket.queue_number}
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {cancellingTicket.service_name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {cancellingTicket.location_or_counter}
                </p>
              </div>
              <Badge status={cancellingTicket.status} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this ticket? Your place in line will be surrendered, and subsequent students will move ahead.
            </p>

            <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancellingTicket(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition disabled:opacity-50"
              >
                Keep My Place
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancelTicket}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelLoading ? 'Cancelling...' : 'Yes, Cancel Ticket'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
