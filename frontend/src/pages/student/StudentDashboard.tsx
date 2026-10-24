import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Badge } from '../../components/common/Badge';
import {
  Calendar,
  Clock,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Building2,
  Sparkles
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [activeTickets, setActiveTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getMyActiveTickets()
      ]);
      setStats(statsRes.data);
      setActiveTickets(ticketsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-brand-700 via-brand-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl shadow-brand-900/10 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-brand-200 border border-white/10 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Student Service Portal
          </span>
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

      {/* Active Queue Ticket Banner (if in queue) */}
      {activeTickets.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Active Queue Tickets Today
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-white rounded-3xl p-6 border-2 border-brand-500/40 shadow-lg shadow-brand-500/5 relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {ticket.service_name}
                  </span>
                  <Badge status={ticket.status} />
                </div>
                
                <div className="my-4 flex items-baseline justify-between">
                  <div>
                    <div className="text-4xl font-black font-mono text-brand-700">
                      {ticket.queue_number}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {ticket.status === 'calling' ? (
                        <span className="text-amber-600 font-bold animate-pulse">
                          Now Calling at {ticket.counter_number || 'Front Counter'}!
                        </span>
                      ) : ticket.status === 'serving' ? (
                        <span className="text-blue-600 font-bold">Currently being served</span>
                      ) : (
                        <span>{ticket.ahead_in_line} students ahead of you</span>
                      )}
                    </p>
                  </div>
                  {ticket.status === 'waiting' && (
                    <div className="text-right">
                      <div className="text-xl font-bold text-slate-800">
                        ~{ticket.estimated_wait_mins} mins
                      </div>
                      <span className="text-[11px] text-slate-400">Est. Wait</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Location: <strong>{ticket.location_or_counter}</strong>
                  </span>
                  <Link to="/queue" className="font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1">
                    Live Status <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
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

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
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
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm">
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
                {new Date(stats.next_appointment.appointment_date).toLocaleDateString()} • {stats.next_appointment.start_time}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block">Location</span>
              <strong className="text-slate-800 text-sm">{stats.next_appointment.location_or_counter}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
