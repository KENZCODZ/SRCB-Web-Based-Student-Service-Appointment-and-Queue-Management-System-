import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { QueueEntry } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Link } from 'react-router-dom';
import {
  Clock,
  Radio,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle2,
  BellRing,
  Plus,
  RefreshCw
} from 'lucide-react';

export const MyQueueStatus: React.FC = () => {
  const [tickets, setTickets] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTickets = async () => {
    try {
      const res = await api.getMyActiveTickets();
      setTickets(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    loadTickets();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Live Queue Status</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Real-time status of your active walk-in service tickets today ({new Date().toLocaleDateString()}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
          </button>
          <Link
            to="/services"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Join New Queue</span>
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading your active queue status...
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Active Queue Tickets</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              You are not currently in any walk-in queues today. Browse our services to get a digital queue number.
            </p>
          </div>
          <Link
            to="/services"
            className="inline-flex px-5 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 shadow-md transition"
          >
            Browse Available Services
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className={`rounded-3xl p-6 sm:p-8 bg-white border-2 shadow-lg transition-all duration-300 relative overflow-hidden ${
                ticket.status === 'calling'
                  ? 'border-amber-400 shadow-amber-500/10'
                  : ticket.status === 'serving'
                  ? 'border-blue-500 shadow-blue-500/10'
                  : 'border-slate-200/80 shadow-slate-200/50'
              }`}
            >
              {/* Animated Call Alert */}
              {ticket.status === 'calling' && (
                <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 animate-bounce">
                  <BellRing className="w-6 h-6 text-amber-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <strong className="text-sm text-amber-900 block font-black">
                      YOUR TURN! PROCEED TO {ticket.counter_number || 'COUNTER'}
                    </strong>
                    <span className="text-xs text-amber-700">
                      Staff is now calling your ticket number.
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase text-slate-400 tracking-wider">
                  {ticket.service_code}
                </span>
                <Badge status={ticket.status} />
              </div>

              {/* Huge Ticket Display */}
              <div className="my-6 text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest block">
                  Your Queue Ticket
                </span>
                <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 my-2">
                  {ticket.queue_number}
                </div>
                <h3 className="text-sm font-bold text-slate-700">
                  {ticket.service_name}
                </h3>
              </div>

              {/* Waiting metrics */}
              {ticket.status === 'waiting' && (
                <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-50 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Ahead of You</span>
                    <strong className="text-xl font-extrabold text-slate-800">
                      {ticket.ahead_in_line} student{ticket.ahead_in_line !== 1 ? 's' : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Estimated Wait</span>
                    <strong className="text-xl font-extrabold text-brand-600">
                      ~{ticket.estimated_wait_mins} mins
                    </strong>
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{ticket.location_or_counter}</span>
                </div>
                <div>
                  Joined: <strong>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
