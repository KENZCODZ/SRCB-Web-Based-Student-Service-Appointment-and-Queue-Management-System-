import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { QueueEntry } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
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
  RefreshCw,
  XCircle,
  Copy,
  Check,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const MyQueueStatus: React.FC = () => {
  const [tickets, setTickets] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingTicket, setCancellingTicket] = useState<QueueEntry | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

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

  const handleCopyTicket = (ticket: QueueEntry) => {
    navigator.clipboard.writeText(ticket.queue_number);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCancelTicketConfirm = async () => {
    if (!cancellingTicket) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await api.cancelQueueTicket(cancellingTicket.id);
      setCancellingTicket(null);
      loadTickets();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel queue ticket.');
    } finally {
      setCancelLoading(false);
    }
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
            Real-time status of your active walk-in service tickets today ({new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition flex items-center gap-1.5 text-xs font-semibold shadow-xs"
            title="Refresh Status"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-brand-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/services"
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Join Another Service Queue</span>
          </Link>
        </div>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2 animate-spin" />
          <span>Loading your active queue status...</span>
        </div>
      ) : tickets.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-4 max-w-md mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-800">No Active Queue Tickets</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              You are not currently waiting in any walk-in service lines today. Browse our services to obtain a live digital queue ticket.
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
          {tickets.map((ticket) => {
            const isCalling = ticket.status === 'calling';
            const isServing = ticket.status === 'serving';

            return (
              <div
                key={ticket.id}
                className={`rounded-3xl p-6 sm:p-8 bg-white border-2 shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isCalling
                    ? 'border-amber-400 shadow-amber-500/10'
                    : isServing
                    ? 'border-blue-500 shadow-blue-500/10'
                    : 'border-slate-200/80 shadow-slate-200/50'
                }`}
              >
                <div>
                  {/* Animated Call Alert (Heuristic 1: Visibility of System Status) */}
                  {isCalling && (
                    <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3 animate-bounce">
                      <BellRing className="w-7 h-7 text-amber-600 flex-shrink-0 animate-pulse" />
                      <div>
                        <strong className="text-sm text-amber-900 block font-black">
                          YOUR TURN! PROCEED TO {ticket.counter_number || 'COUNTER WINDOW'}
                        </strong>
                        <span className="text-xs text-amber-700">
                          Staff is now actively calling your ticket number. Please approach the service window.
                        </span>
                      </div>
                    </div>
                  )}

                  {isServing && (
                    <div className="mb-6 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-blue-600 flex-shrink-0" />
                      <div>
                        <strong className="text-sm text-blue-900 block font-black">
                          CURRENTLY BEING SERVED AT {ticket.counter_number || 'COUNTER WINDOW'}
                        </strong>
                        <span className="text-xs text-blue-700">
                          Your transaction is currently in progress.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Header & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-black uppercase text-slate-400 tracking-wider">
                      {ticket.service_code}
                    </span>
                    <Badge status={ticket.status} />
                  </div>

                  {/* Huge Ticket Display with Copy Button (Heuristic 6 & 7) */}
                  <div className="my-5 text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 relative group">
                    <span className="text-xs uppercase font-bold text-slate-400 tracking-widest block">
                      Your Queue Ticket
                    </span>
                    <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 my-2">
                      {ticket.queue_number}
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">
                      {ticket.service_name}
                    </h3>

                    {/* Quick copy ticket button */}
                    <button
                      type="button"
                      onClick={() => handleCopyTicket(ticket)}
                      className="mt-2 text-[11px] font-semibold text-slate-500 hover:text-brand-600 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 shadow-2xs transition"
                      title="Copy ticket number"
                    >
                      {copiedId === ticket.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Copied to clipboard</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy Ticket #</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Progress Pipeline (Heuristic 1: Visibility of System Status) */}
                  <div className="my-4 px-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-2">
                      <span className={ticket.status === 'waiting' ? 'text-brand-600 font-extrabold' : 'text-slate-400'}>
                        1. In Line
                      </span>
                      <span className={ticket.status === 'calling' ? 'text-amber-600 font-extrabold' : 'text-slate-400'}>
                        2. Called
                      </span>
                      <span className={ticket.status === 'serving' ? 'text-blue-600 font-extrabold' : 'text-slate-400'}>
                        3. Serving
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          ticket.status === 'waiting'
                            ? 'w-1/3 bg-brand-500'
                            : ticket.status === 'calling'
                            ? 'w-2/3 bg-amber-500'
                            : 'w-full bg-blue-600'
                        }`}
                      />
                    </div>
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
                </div>

                {/* Footer Controls & User Control Emergency Exit (Heuristic 3: User control and freedom) */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{ticket.location_or_counter}</span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                    <span>
                      Joined: <strong>{new Date(ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                    </span>

                    {ticket.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => {
                          setCancellingTicket(ticket);
                          setCancelError('');
                        }}
                        className="text-rose-600 hover:text-rose-800 font-semibold text-xs px-2 py-1 rounded-lg hover:bg-rose-50 transition"
                        title="Leave this queue"
                      >
                        Leave Queue
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM LEAVE / CANCEL QUEUE MODAL (Heuristic 3 & 5: Error Prevention & User Control) */}
      <Modal
        isOpen={!!cancellingTicket}
        onClose={() => setCancellingTicket(null)}
        title="Leave Service Queue"
        maxWidth="md"
      >
        {cancellingTicket && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket to Cancel
                </span>
                <div className="text-2xl font-black font-mono text-slate-900">
                  {cancellingTicket.queue_number}
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  {cancellingTicket.service_name}
                </p>
              </div>
              <Badge status={cancellingTicket.status} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to leave this queue? Your ticket position will be surrendered, and other waiting students will move up in line.
            </p>

            {cancelError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{cancelError}</span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingTicket(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Keep My Place
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleCancelTicketConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelLoading ? 'Leaving...' : 'Yes, Leave Queue'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
