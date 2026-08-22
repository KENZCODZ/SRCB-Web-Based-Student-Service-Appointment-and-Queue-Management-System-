import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Appointment } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Clock3,
  Search,
  Check,
  X,
  AlertCircle,
  Send,
  HelpCircle,
  FileCheck,
  User,
  Filter
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Modals State
  const [rejectingApt, setRejectingApt] = useState<Appointment | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [reschedulingApt, setReschedulingApt] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    start_time: '',
    end_time: '',
    admin_notes: '',
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadAppointments = async () => {
    try {
      const res = await api.getAppointments({
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        search: search || undefined,
      });
      setAppointments(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [statusFilter, dateFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAppointments();
  };

  const handleApprove = async (apt: Appointment) => {
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateAppointmentStatus(apt.id, { status: 'approved' });
      setSuccessToast(`Appointment ${apt.appointment_code} approved! Email notification dispatched to ${apt.student_email}.`);
      loadAppointments();
    } catch (e: any) {
      alert(e.message || 'Failed to approve appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (apt: Appointment) => {
    setActionLoading(true);
    try {
      await api.updateAppointmentStatus(apt.id, { status: 'completed' });
      setSuccessToast(`Appointment ${apt.appointment_code} marked as completed.`);
      loadAppointments();
    } catch (e: any) {
      alert(e.message || 'Failed to complete transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingApt || !rejectionReason.trim()) return;

    setActionLoading(true);
    setActionError('');
    try {
      await api.updateAppointmentStatus(rejectingApt.id, {
        status: 'rejected',
        rejection_reason: rejectionReason.trim(),
      });
      setSuccessToast(`Appointment ${rejectingApt.appointment_code} declined. Notification sent.`);
      setRejectingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to reject appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRescheduleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reschedulingApt || !rescheduleData.date || !rescheduleData.start_time) return;

    setActionLoading(true);
    setActionError('');
    try {
      await api.updateAppointmentStatus(reschedulingApt.id, {
        status: 'rescheduled',
        appointment_date: rescheduleData.date,
        start_time: rescheduleData.start_time,
        end_time: rescheduleData.end_time || rescheduleData.start_time,
        admin_notes: rescheduleData.admin_notes.trim(),
      });
      setSuccessToast(`Appointment ${reschedulingApt.appointment_code} rescheduled. Email notification sent.`);
      setReschedulingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to reschedule appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Appointment Processing & Review
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review student booking requests, approve with automated email confirmation, or reschedule slots.
          </p>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast('')} className="text-emerald-600 hover:text-emerald-800 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search student ID, name, code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full md:w-auto"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rescheduled">Rescheduled</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full md:w-auto"
          />

          {(statusFilter || dateFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setSearch('');
              }}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              title="Reset Filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Appointments List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Code & Student</th>
                <th className="py-4 px-6">Requested Service</th>
                <th className="py-4 px-6">Date & Schedule</th>
                <th className="py-4 px-6">Purpose / Notes</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Process Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading appointments...
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No appointments found matching filter criteria.
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-black text-brand-700">
                        {apt.appointment_code}
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-0.5">
                        {apt.first_name} {apt.last_name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {apt.student_id_number || apt.student_email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900">{apt.service_name}</div>
                      <div className="text-[11px] text-slate-400">{apt.service_category}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800">
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {apt.start_time} - {apt.end_time}
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      <p className="line-clamp-2 text-slate-600">{apt.purpose}</p>
                      {apt.rejection_reason && (
                        <p className="text-[11px] text-rose-600 mt-1">Reason: {apt.rejection_reason}</p>
                      )}
                      {apt.admin_notes && (
                        <p className="text-[11px] text-blue-600 mt-1">Notes: {apt.admin_notes}</p>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={apt.status} />
                    </td>
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(apt)}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold rounded-lg transition"
                            title="Approve & Send Confirmation Email"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              setRejectingApt(apt);
                              setRejectionReason('');
                              setActionError('');
                            }}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-lg transition"
                            title="Decline Request"
                          >
                            Decline
                          </button>
                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setRescheduleData({
                                date: apt.appointment_date,
                                start_time: apt.start_time,
                                end_time: apt.end_time,
                                admin_notes: '',
                              });
                              setActionError('');
                            }}
                            disabled={actionLoading}
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-lg transition"
                            title="Move to another date/time"
                          >
                            Reschedule
                          </button>
                        </>
                      )}

                      {['approved', 'rescheduled'].includes(apt.status) && (
                        <button
                          onClick={() => handleComplete(apt)}
                          disabled={actionLoading}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg transition flex items-center gap-1 inline-flex"
                          title="Mark student visit as completed"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete</span>
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

      {/* REJECT MODAL */}
      <Modal
        isOpen={!!rejectingApt}
        onClose={() => setRejectingApt(null)}
        title="Decline Appointment Request"
        maxWidth="sm"
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-500">
            Provide a clear reason for declining. This explanation will be automatically emailed to{' '}
            <strong>{rejectingApt?.student_email}</strong>.
          </p>

          {actionError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reason for Decline *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Missing prerequisite clearance stamp, please settle library obligations first."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejectingApt(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading || !rejectionReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {actionLoading ? 'Sending...' : 'Confirm Decline & Email'}
            </button>
          </div>
        </form>
      </Modal>

      {/* RESCHEDULE MODAL */}
      <Modal
        isOpen={!!reschedulingApt}
        onClose={() => setReschedulingApt(null)}
        title="Reschedule Appointment"
        maxWidth="md"
      >
        <form onSubmit={handleRescheduleConfirm} className="space-y-4">
          <p className="text-xs text-slate-500">
            Set the new appointment schedule for <strong>{reschedulingApt?.first_name} {reschedulingApt?.last_name}</strong>. An email notification will be dispatched with the revised time.
          </p>

          {actionError && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              New Date *
            </label>
            <input
              type="date"
              required
              value={rescheduleData.date}
              onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={rescheduleData.start_time}
                onChange={(e) => setRescheduleData({ ...rescheduleData, start_time: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                End Time
              </label>
              <input
                type="time"
                value={rescheduleData.end_time}
                onChange={(e) => setRescheduleData({ ...rescheduleData, end_time: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Staff Notes / Reason for Reschedule
            </label>
            <textarea
              rows={2}
              value={rescheduleData.admin_notes}
              onChange={(e) => setRescheduleData({ ...rescheduleData, admin_notes: e.target.value })}
              placeholder="e.g. Moved due to department faculty meeting."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setReschedulingApt(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {actionLoading ? 'Updating...' : 'Save & Send Notice'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
