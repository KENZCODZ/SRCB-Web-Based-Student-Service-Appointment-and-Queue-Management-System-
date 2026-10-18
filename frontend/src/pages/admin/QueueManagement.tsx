import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Service, QueueEntry } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Radio,
  Clock,
  Users,
  CheckCircle2,
  PhoneCall,
  UserX,
  Play,
  RotateCcw,
  Sparkles,
  AlertCircle,
  Building2,
  RefreshCw,
  Copy,
  Check,
  X
} from 'lucide-react';

export const QueueManagement: React.FC = () => {
  const [queueServices, setQueueServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  const [counterNumber, setCounterNumber] = useState('Window Counter 1');
  const [tickets, setTickets] = useState<QueueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [callingLoading, setCallingLoading] = useState(false);
  const [callError, setCallError] = useState('');
  const [toastMessage, setToastMessage] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Skip (No-Show) Confirmation Modal State (Heuristic 5: Error Prevention)
  const [skippingTicket, setSkippingTicket] = useState<QueueEntry | null>(null);
  const [skipLoading, setSkipLoading] = useState(false);

  // Auto-dismiss toast message after 5 seconds (Heuristic 1: Visibility of System Status)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const handleCopyTicket = (ticket: QueueEntry) => {
    navigator.clipboard.writeText(ticket.queue_number);
    setCopiedId(ticket.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 1. Load available queue services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await api.getServices({ type: 'queue', all: false });
        const svcs = res.data || [];
        setQueueServices(svcs);
        if (svcs.length > 0 && !selectedServiceId) {
          setSelectedServiceId(svcs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchServices();
  }, []);

  // 2. Load tickets for currently selected service
  const loadQueueTickets = async () => {
    if (!selectedServiceId) return;
    try {
      const res = await api.getActiveQueueForService(selectedServiceId);
      setTickets(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedServiceId) {
      setLoading(true);
      loadQueueTickets();
      const interval = setInterval(loadQueueTickets, 4000);
      return () => clearInterval(interval);
    }
  }, [selectedServiceId]);

  // 3. Call Next Ticket in Line
  const handleCallNext = async () => {
    if (!selectedServiceId) return;
    setCallingLoading(true);
    setCallError('');
    try {
      const res = await api.callNextTicket(selectedServiceId, counterNumber);
      setToastMessage(`Called Ticket: ${res.data.queue_number}`);
      loadQueueTickets();
    } catch (err: any) {
      setCallError(err.message || 'No waiting students in queue.');
    } finally {
      setCallingLoading(false);
    }
  };

  // 4. Update status of ticket
  const handleUpdateStatus = async (ticketId: number, newStatus: string) => {
    try {
      await api.updateQueueStatus(ticketId, {
        status: newStatus,
        counter_number: counterNumber,
      });
      loadQueueTickets();
    } catch (e: any) {
      alert(e.message || 'Failed to update ticket status.');
    }
  };

  const currentCallingOrServing = tickets.find(t => t.status === 'calling' || t.status === 'serving');
  const waitingTickets = tickets.filter(t => t.status === 'waiting');
  const selectedService = queueServices.find(s => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>Queue Counter Terminal</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage live walk-in queues, call waiting students, and track service counter throughput.
          </p>
        </div>

        {/* Counter Desk Selector */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400">Desk / Counter:</span>
            <input
              type="text"
              value={counterNumber}
              onChange={(e) => setCounterNumber(e.target.value)}
              className="font-bold text-slate-800 bg-transparent border-none focus:outline-none w-36"
              placeholder="e.g. Window 1"
            />
          </div>
        </div>
      </div>

      {/* Toast Feedback Banner (Heuristic 1: Visibility of System Status) */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Service Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {queueServices.map((svc) => (
          <button
            key={svc.id}
            onClick={() => setSelectedServiceId(svc.id)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition border ${
              selectedServiceId === svc.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span>{svc.name}</span>
            <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-slate-100/20 font-mono">
              {svc.code}
            </span>
          </button>
        ))}
      </div>

      {/* Main Terminal View Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Active Call Desk & Controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Call Next Student Big Card */}
          <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-3xl p-6 text-white shadow-xl shadow-brand-600/20 text-center">
            <span className="text-xs uppercase font-bold text-brand-200 tracking-wider block">
              Waiting in Queue: {waitingTickets.length} Student{waitingTickets.length !== 1 ? 's' : ''}
            </span>

            <button
              onClick={handleCallNext}
              disabled={callingLoading || waitingTickets.length === 0}
              className="w-full mt-4 py-4 px-6 rounded-2xl bg-white hover:bg-brand-50 text-brand-900 font-extrabold text-base shadow-lg transition flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <PhoneCall className="w-5 h-5 text-brand-600 group-hover:animate-bounce" />
              <span>{callingLoading ? 'Calling...' : 'Call Next Student'}</span>
            </button>

            {callError && (
              <p className="text-xs text-rose-200 mt-2 bg-rose-950/40 p-2 rounded-xl border border-rose-400/20">
                {callError}
              </p>
            )}
          </div>

          {/* Current Ticket Under Action */}
          {currentCallingOrServing ? (
            <div className="bg-white rounded-3xl p-6 border-2 border-brand-500 shadow-lg shadow-brand-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Current Ticket in Focus
                </span>
                <Badge status={currentCallingOrServing.status} />
              </div>

              <div className="text-center py-2">
                <div className="text-4xl sm:text-5xl font-black font-mono text-slate-900">
                  {currentCallingOrServing.queue_number}
                </div>
                <h3 className="text-base font-bold text-slate-800 mt-2">
                  {currentCallingOrServing.first_name} {currentCallingOrServing.last_name}
                </h3>
                <p className="text-xs text-slate-400">
                  ID: {currentCallingOrServing.student_id_number || 'N/A'} • {currentCallingOrServing.department_or_course}
                </p>
              </div>

              {/* Action Buttons for Current Ticket */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                {currentCallingOrServing.status === 'calling' && (
                  <button
                    onClick={() => handleUpdateStatus(currentCallingOrServing.id, 'serving')}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Play className="w-4 h-4" />
                    <span>Start Serving (Student Arrived)</span>
                  </button>
                )}

                {currentCallingOrServing.status === 'serving' && (
                  <button
                    onClick={() => handleUpdateStatus(currentCallingOrServing.id, 'completed')}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Complete Transaction</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleCallNext()}
                    className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    title="Re-call current ticket"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-Call</span>
                  </button>
                  <button
                    onClick={() => setSkippingTicket(currentCallingOrServing)}
                    className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    title="Mark skipped if no-show"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Skip No-Show</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 text-center text-slate-400 text-xs py-8">
              No ticket currently called at this counter. Click <strong>"Call Next Student"</strong> to pull the next ticket in line.
            </div>
          )}
        </div>

        {/* Right Column (2 cols): Live Queue Waiting Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-600" />
              <span>Waiting Students Line ({waitingTickets.length})</span>
            </h2>
            <span className="text-xs text-slate-400">
              Service: <strong>{selectedService?.name}</strong>
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-4 px-6">Queue Ticket</th>
                    <th className="py-4 px-6">Student Name & ID</th>
                    <th className="py-4 px-6">Program / Year</th>
                    <th className="py-4 px-6">Joined Time</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
                  {tickets.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No active queue tickets for this service today.
                      </td>
                    </tr>
                  ) : (
                    tickets.map((t) => (
                      <tr
                        key={t.id}
                        className={`transition ${
                          t.status === 'calling'
                            ? 'bg-amber-50/50'
                            : t.status === 'serving'
                            ? 'bg-blue-50/50'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-4 px-6 font-mono text-sm font-black text-slate-900">
                          {t.queue_number}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900">
                            {t.first_name} {t.last_name}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            {t.student_id_number || t.student_email}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {t.department_or_course || 'General'}
                        </td>
                        <td className="py-4 px-6 text-slate-500">
                          {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-4 px-6">
                          <Badge status={t.status} />
                        </td>
                        <td className="py-4 px-6 text-right space-x-1">
                          {t.status === 'waiting' && (
                            <button
                              onClick={() => {
                                handleUpdateStatus(t.id, 'calling');
                              }}
                              className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg transition text-xs"
                            >
                              Call
                            </button>
                          )}
                          {t.status === 'calling' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'serving')}
                              className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition text-xs"
                            >
                              Serve
                            </button>
                          )}
                          {t.status === 'serving' && (
                            <button
                              onClick={() => handleUpdateStatus(t.id, 'completed')}
                              className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition text-xs"
                            >
                              Done
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRM SKIP NO-SHOW MODAL (Heuristic 5: Error Prevention & Heuristic 6: Recognition) */}
      <Modal
        isOpen={!!skippingTicket}
        onClose={() => setSkippingTicket(null)}
        title="Confirm Student No-Show (Skip Ticket)"
        maxWidth="md"
      >
        {skippingTicket && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Ticket in Focus
                </span>
                <div className="text-3xl font-black font-mono text-slate-900">
                  {skippingTicket.queue_number}
                </div>
                <p className="text-xs font-bold text-slate-800 mt-0.5">
                  {skippingTicket.first_name} {skippingTicket.last_name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono">
                  ID: {skippingTicket.student_id_number || 'N/A'} • {skippingTicket.department_or_course || 'General'}
                </p>
              </div>
              <Badge status={skippingTicket.status} />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Marking this ticket as <strong>Skipped</strong> indicates the student did not arrive after repeated calls. They will be removed from the active queue.
              </span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSkippingTicket(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancel & Keep Active
              </button>
              <button
                type="button"
                disabled={skipLoading}
                onClick={async () => {
                  setSkipLoading(true);
                  try {
                    await handleUpdateStatus(skippingTicket.id, 'skipped');
                    setToastMessage(`Ticket ${skippingTicket.queue_number} marked as skipped (no-show).`);
                    setSkippingTicket(null);
                  } finally {
                    setSkipLoading(false);
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <UserX className="w-4 h-4" />
                <span>{skipLoading ? 'Skipping...' : 'Confirm Skip (No-Show)'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
