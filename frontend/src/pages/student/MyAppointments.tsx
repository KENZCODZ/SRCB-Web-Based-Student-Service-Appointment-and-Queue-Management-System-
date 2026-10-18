import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  AlertCircle,
  XCircle,
  CheckCircle2,
  HelpCircle,
  Plus,
  Eye,
  Check,
  Building,
  Send,
  Ticket,
  Copy,
  RotateCcw
} from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleCopyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Cancel Modal State
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // View Details Modal State (Heuristic 6: Recognition rather than recall)
  const [viewingApt, setViewingApt] = useState<Appointment | null>(null);

  const loadAppointments = async () => {
    try {
      const res = await api.getAppointments();
      setAppointments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancelConfirm = async () => {
    if (!cancellingApt) return;
    setCancelLoading(true);
    setCancelError('');

    try {
      await api.cancelAppointment(cancellingApt.id);
      setCancellingApt(null);
      loadAppointments();
    } catch (err: any) {
      setCancelError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDateHuman = (dateStr: string) => {
    if (!dateStr) return '—';
    try {
      const parts = dateStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString(undefined, {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      }
      return new Date(dateStr).toLocaleDateString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Live count summary (Heuristic 1: Visibility of System Status)
  const counts = useMemo(() => {
    const active = appointments.filter((a) => ['pending', 'approved', 'rescheduled'].includes(a.status)).length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const cancelled = appointments.filter((a) => ['rejected', 'cancelled'].includes(a.status)).length;
    return {
      all: appointments.length,
      active,
      completed,
      cancelled,
    };
  }, [appointments]);

  const filteredAppointments = appointments.filter((a) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['pending', 'approved', 'rescheduled'].includes(a.status);
    if (statusFilter === 'completed') return a.status === 'completed';
    if (statusFilter === 'cancelled') return ['rejected', 'cancelled'].includes(a.status);
    return a.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            My Appointments
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track status, review confirmation details, or manage your scheduled bookings.
          </p>
        </div>

        <Link
          to="/services"
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Appointment</span>
        </Link>
      </div>

      {/* Filter Tabs with Dynamic Live Badges (Heuristic 1 & 7) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            statusFilter === 'all'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>All Appointments</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
            {counts.all}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            statusFilter === 'active'
              ? 'bg-white text-brand-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Upcoming / Active</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand-50 text-brand-700 border border-brand-200">
            {counts.active}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            statusFilter === 'completed'
              ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Completed</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700">
            {counts.completed}
          </span>
        </button>

        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center gap-2 ${
            statusFilter === 'cancelled'
              ? 'bg-white text-rose-700 shadow-sm border border-slate-200'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Declined / Cancelled</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-500">
            {counts.cancelled}
          </span>
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2 animate-spin" />
          <span>Loading your appointments...</span>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-xs">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1">
            You do not have any appointments matching the selected filter.
          </p>
          <Link
            to="/services"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Browse Services & Book</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-3 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="flex items-center gap-1 font-mono text-xs font-black px-2.5 py-1 bg-brand-50 text-brand-800 rounded-lg border border-brand-200">
                    <span>{apt.appointment_code}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyCode(apt.appointment_code, apt.id)}
                      className="p-0.5 text-brand-500 hover:text-brand-800 transition"
                      title="Copy Appointment Code"
                    >
                      {copiedId === apt.id ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  <Badge status={apt.status} />
                  <span className="text-xs text-slate-400">
                    Booked on {formatDateHuman(apt.created_at)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">{apt.service_name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>Purpose:</strong> {apt.purpose}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span>
                      <strong>Date:</strong> {formatDateHuman(apt.appointment_date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span>
                      <strong>Time:</strong> {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span className="truncate">{apt.location_or_counter || 'Window Desk'}</span>
                  </div>
                </div>

                {/* Decline reason banner */}
                {apt.status === 'rejected' && apt.rejection_reason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Decline Reason:</strong> {apt.rejection_reason}
                      </div>
                    </div>
                    <Link
                      to="/services"
                      className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs transition self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Book Another Slot</span>
                    </Link>
                  </div>
                )}

                {/* Staff Instructions banner */}
                {apt.admin_notes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Staff Instructions:</strong> {apt.admin_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons (Heuristic 3: User Control & Freedom) */}
              <div className="flex items-center gap-2 md:flex-col md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 min-w-36">
                <button
                  onClick={() => setViewingApt(apt)}
                  className="w-full px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center justify-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Pass</span>
                </button>

                {['pending', 'approved'].includes(apt.status) && (
                  <button
                    onClick={() => {
                      setCancellingApt(apt);
                      setCancelError('');
                    }}
                    className="w-full px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition text-center"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* VIEW OFFICIAL APPOINTMENT PASS MODAL (Heuristic 6 & 10) */}
      <Modal
        isOpen={!!viewingApt}
        onClose={() => setViewingApt(null)}
        title="Official Appointment Pass"
        maxWidth="lg"
      >
        {viewingApt && (
          <div className="space-y-4">
            <div className="p-4 bg-brand-50/80 border border-brand-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                  Reference Code
                </span>
                <span className="font-mono text-base font-extrabold text-brand-900 block mt-0.5">
                  {viewingApt.appointment_code}
                </span>
                <h3 className="text-sm font-bold text-slate-800 mt-1">{viewingApt.service_name}</h3>
              </div>

              <div className="text-left sm:text-right">
                <Badge status={viewingApt.status} />
                <span className="text-xs text-slate-500 block mt-1 font-mono">
                  {viewingApt.start_time.substring(0, 5)} - {viewingApt.end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            {/* Stepper Status (Heuristic 1: Visibility of System Status) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Processing Milestones
              </span>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. Submitted</span>
                </div>
                <span className="h-0.5 flex-1 bg-slate-200 mx-2"></span>
                <div
                  className={`flex items-center gap-1.5 font-bold ${
                    ['approved', 'completed'].includes(viewingApt.status)
                      ? 'text-emerald-700'
                      : viewingApt.status === 'rejected'
                      ? 'text-rose-600'
                      : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>2. {viewingApt.status === 'rejected' ? 'Declined' : 'Approved'}</span>
                </div>
                <span className="h-0.5 flex-1 bg-slate-200 mx-2"></span>
                <div
                  className={`flex items-center gap-1.5 font-bold ${
                    viewingApt.status === 'completed' ? 'text-emerald-700' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>3. Completed</span>
                </div>
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Appointment Date</span>
                <strong className="text-slate-800 text-sm">
                  {formatDateHuman(viewingApt.appointment_date)}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Assigned Window</span>
                <strong className="text-slate-800 text-sm">
                  {viewingApt.location_or_counter || 'Window Desk'}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Service Category</span>
                <span className="text-slate-700">{viewingApt.service_category}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Time Window</span>
                <span className="text-slate-700 font-mono">
                  {viewingApt.start_time.substring(0, 5)} - {viewingApt.end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            {/* Requirements to Bring */}
            {viewingApt.requirements && (
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                  Documents to Bring On Your Visit
                </span>
                <div className="space-y-1">
                  {viewingApt.requirements.split(',').map((req, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-amber-900">
                      <Check className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                      <span>{req.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Staff instructions */}
            {viewingApt.admin_notes && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <strong className="block text-[11px] uppercase tracking-wider text-blue-700 mb-0.5">
                  Staff Instructions:
                </strong>
                <span>{viewingApt.admin_notes}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingApt(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Close Pass
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* CANCELLATION CONFIRMATION MODAL (Heuristic 5: Error Prevention & Heuristic 6: Recognition) */}
      <Modal
        isOpen={!!cancellingApt}
        onClose={() => setCancellingApt(null)}
        title="Cancel Appointment Confirmation"
        maxWidth="md"
      >
        {cancellingApt && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Appointment Reservation
                </span>
                <div className="text-sm font-black font-mono text-slate-900 mt-0.5">
                  {cancellingApt.appointment_code}
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  {cancellingApt.service_name}
                </h4>
                <p className="text-xs text-slate-500">
                  {cancellingApt.location_or_counter || 'Window Desk'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-slate-800 block">
                  {formatDateHuman(cancellingApt.appointment_date)}
                </span>
                <span className="text-xs font-mono text-brand-700 bg-brand-50 px-2 py-0.5 rounded block mt-1">
                  {cancellingApt.start_time.substring(0, 5)} - {cancellingApt.end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span>
                Cancelling this booking will surrender your scheduled reservation and release the time slot for other students.
              </span>
            </div>

            {cancelError && (
              <div className="p-2.5 bg-rose-100 text-rose-800 text-xs rounded-xl border border-rose-300">
                {cancelError}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancellingApt(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Keep Appointment
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleCancelConfirm}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelLoading ? 'Cancelling...' : 'Yes, Cancel Booking'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
