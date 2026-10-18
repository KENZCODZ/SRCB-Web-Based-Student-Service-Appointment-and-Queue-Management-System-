import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  FileCheck,
  User,
  Filter,
  Eye,
  Mail,
  Phone,
  GraduationCap,
  Building,
  RotateCcw,
  Sparkles,
  Info,
  Copy
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [dateFilter, setDateFilter] = useState(searchParams.get('date') || '');
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(`${label}-${text}`);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  // Modals State
  const [approvingApt, setApprovingApt] = useState<Appointment | null>(null);
  const [approvalNotes, setApprovalNotes] = useState('');

  const [viewingApt, setViewingApt] = useState<Appointment | null>(null);

  const [completingApt, setCompletingApt] = useState<Appointment | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');

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

  // Auto-dismiss success toast after 6 seconds (Heuristic 1: Visibility of System Status)
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(''), 6000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadAppointments();
  };

  // 1. APPROVE APPOINTMENT CONFIRMATION (Heuristic 5: Error Prevention & Heuristic 6: Recognition)
  const openApproveModal = (apt: Appointment) => {
    setApprovingApt(apt);
    setApprovalNotes('');
    setActionError('');
  };

  const handleApproveConfirm = async () => {
    if (!approvingApt) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateAppointmentStatus(approvingApt.id, {
        status: 'approved',
        admin_notes: approvalNotes.trim() || undefined,
      });
      setSuccessToast(
        `Appointment ${approvingApt.appointment_code} for ${approvingApt.first_name} ${approvingApt.last_name} has been approved! Confirmation email dispatched to ${approvingApt.student_email}.`
      );
      setApprovingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to approve appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. COMPLETE APPOINTMENT CONFIRMATION
  const openCompleteModal = (apt: Appointment) => {
    setCompletingApt(apt);
    setCompletionNotes('');
    setActionError('');
  };

  const handleCompleteConfirm = async () => {
    if (!completingApt) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.updateAppointmentStatus(completingApt.id, {
        status: 'completed',
        admin_notes: completionNotes.trim() || completingApt.admin_notes || undefined,
      });
      setSuccessToast(`Appointment ${completingApt.appointment_code} marked as completed.`);
      setCompletingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to complete appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. DECLINE APPOINTMENT
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
      setSuccessToast(`Appointment ${rejectingApt.appointment_code} declined. Notice sent to ${rejectingApt.student_email}.`);
      setRejectingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to reject appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. RESCHEDULE APPOINTMENT
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
      setSuccessToast(`Appointment ${reschedulingApt.appointment_code} rescheduled. Revised schedule emailed to student.`);
      setReschedulingApt(null);
      loadAppointments();
    } catch (e: any) {
      setActionError(e.message || 'Failed to reschedule appointment.');
    } finally {
      setActionLoading(false);
    }
  };

  // Format date helper
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

  const todayStr = useMemo(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const tomorrowStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const updateStatusFilter = (status: string) => {
    setStatusFilter(status);
    const newParams = new URLSearchParams(searchParams);
    if (status) {
      newParams.set('status', status);
    } else {
      newParams.delete('status');
    }
    setSearchParams(newParams);
  };

  const updateDateFilter = (date: string) => {
    setDateFilter(date);
    const newParams = new URLSearchParams(searchParams);
    if (date) {
      newParams.set('date', date);
    } else {
      newParams.delete('date');
    }
    setSearchParams(newParams);
  };

  // Compute live counts (Heuristic 1: Visibility of System Status)
  const counts = useMemo(() => {
    const pending = appointments.filter((a) => a.status === 'pending').length;
    const approved = appointments.filter((a) => a.status === 'approved').length;
    const completed = appointments.filter((a) => a.status === 'completed').length;
    const rescheduled = appointments.filter((a) => a.status === 'rescheduled').length;
    const rejected = appointments.filter((a) => a.status === 'rejected' || a.status === 'cancelled').length;
    const today = appointments.filter((a) => a.appointment_date === todayStr).length;
    return {
      all: appointments.length,
      pending,
      approved,
      completed,
      rescheduled,
      rejected,
      today,
    };
  }, [appointments, todayStr]);

  const statusTabs = [
    { key: '', label: 'All Requests', count: counts.all },
    { key: 'pending', label: 'Pending Approval', count: counts.pending, alert: counts.pending > 0 },
    { key: 'approved', label: 'Approved & Scheduled', count: counts.approved },
    { key: 'completed', label: 'Completed', count: counts.completed },
    { key: 'rescheduled', label: 'Rescheduled', count: counts.rescheduled },
    { key: 'rejected', label: 'Declined / Cancelled', count: counts.rejected },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Appointment Processing & Review
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Review student booking requests with complete dossier verification, approve with automated confirmation, or reschedule slots.
          </p>
        </div>

        {/* Heuristic 1 & 7: Quick Actions & Status Summary */}
        <div className="flex items-center gap-2">
          {counts.pending > 0 && (
            <button
              onClick={() => updateStatusFilter('pending')}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition animate-pulse"
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{counts.pending} Pending Review</span>
            </button>
          )}
          <button
            onClick={() => loadAppointments()}
            className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs transition"
            title="Refresh appointments"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Success Notification Banner (Heuristic 1: Visibility of System Status) */}
      {successToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-sm animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold text-sm">{successToast}</span>
          </div>
          <button
            onClick={() => setSuccessToast('')}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Heuristic 7: Status Filter Tabs with Live Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80">
        {statusTabs.map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => updateStatusFilter(tab.key)}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  isActive
                    ? 'bg-brand-700/60 text-white'
                    : tab.alert
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Date Controls Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by student name, student ID, appointment code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadAppointments();
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Date Filter & Quick Chips (Heuristic 7: Efficiency of Use) */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => updateDateFilter('')}
              className={`px-2.5 py-1 rounded-lg transition ${
                !dateFilter ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Dates
            </button>
            <button
              onClick={() => updateDateFilter(todayStr)}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === todayStr
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => updateDateFilter(tomorrowStr)}
              className={`px-2.5 py-1 rounded-lg transition ${
                dateFilter === tomorrowStr
                  ? 'bg-white text-brand-700 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(e) => updateDateFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            title="Filter by specific date"
          />

          {(statusFilter || dateFilter || search) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setDateFilter('');
                setSearch('');
                setSearchParams(new URLSearchParams());
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
              title="Reset all filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Appointment & Student</th>
                <th className="py-4 px-6">Service Requested</th>
                <th className="py-4 px-6">Schedule Window</th>
                <th className="py-4 px-6">Purpose / Remarks</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Review & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <Clock className="w-6 h-6 text-slate-300 mx-auto mb-2 animate-spin" />
                    <span>Loading appointments...</span>
                  </td>
                </tr>
              ) : appointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-600">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {statusFilter || dateFilter || search
                        ? 'Try clearing active filters to see all appointments.'
                        : 'No appointment requests have been booked yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                appointments.map((apt) => (
                  <tr key={apt.id} className="hover:bg-slate-50/80 transition group">
                    {/* Code & Student */}
                    <td className="py-4 px-6">
                      <div className="font-mono text-xs font-black text-brand-700 flex items-center gap-1.5">
                        <span>{apt.appointment_code}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(apt.appointment_code, 'apt')}
                          className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-slate-100 transition"
                          title="Copy appointment code"
                        >
                          {copiedItem === `apt-${apt.appointment_code}` ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                      <div className="font-bold text-slate-900 text-xs mt-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>
                          {apt.first_name} {apt.last_name}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 pl-5 flex items-center gap-1.5">
                        {apt.student_id_number ? (
                          <button
                            type="button"
                            onClick={() => handleCopy(apt.student_id_number!, 'student')}
                            className="font-mono font-semibold text-slate-700 hover:text-brand-600 inline-flex items-center gap-1 transition"
                            title="Copy student ID"
                          >
                            <span>ID: {apt.student_id_number}</span>
                            {copiedItem === `student-${apt.student_id_number}` ? (
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-2.5 h-2.5 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span>{apt.student_email}</span>
                        )}
                        {apt.department_or_course && ` • ${apt.department_or_course}`}
                      </div>
                    </td>

                    {/* Service */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-xs">{apt.service_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-400" />
                        <span>
                          {apt.service_category} ({apt.location_or_counter || 'Window Desk'})
                        </span>
                      </div>
                    </td>

                    {/* Schedule */}
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-800 text-xs">
                        {formatDateHuman(apt.appointment_date)}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {apt.start_time.substring(0, 5)} - {apt.end_time.substring(0, 5)}
                        </span>
                      </div>
                    </td>

                    {/* Purpose */}
                    <td className="py-4 px-6 max-w-xs">
                      <p className="line-clamp-2 text-slate-600 text-xs">{apt.purpose}</p>
                      {apt.admin_notes && (
                        <p className="text-[11px] text-brand-700 mt-1 font-medium bg-brand-50/60 p-1.5 rounded-lg border border-brand-100">
                          Staff Note: {apt.admin_notes}
                        </p>
                      )}
                      {apt.rejection_reason && (
                        <p className="text-[11px] text-rose-700 mt-1 font-medium bg-rose-50/60 p-1.5 rounded-lg border border-rose-100">
                          Declined: {apt.rejection_reason}
                        </p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <Badge status={apt.status} />
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right space-x-1.5 whitespace-nowrap">
                      {/* View Details Icon for any status (Heuristic 6 & 7) */}
                      <button
                        onClick={() => setViewingApt(apt)}
                        className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                        title="View Complete Appointment Dossier"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      {apt.status === 'pending' && (
                        <>
                          <button
                            onClick={() => openApproveModal(apt)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs shadow-sm inline-flex items-center gap-1"
                            title="Review complete details and approve"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>

                          <button
                            onClick={() => {
                              setRejectingApt(apt);
                              setRejectionReason('');
                              setActionError('');
                            }}
                            className="px-2.5 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold rounded-xl transition text-xs"
                            title="Decline Request"
                          >
                            Decline
                          </button>

                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setRescheduleData({
                                date: apt.appointment_date,
                                start_time: apt.start_time.substring(0, 5),
                                end_time: apt.end_time.substring(0, 5),
                                admin_notes: '',
                              });
                              setActionError('');
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl transition text-xs"
                            title="Move to another date/time"
                          >
                            Reschedule
                          </button>
                        </>
                      )}

                      {['approved', 'rescheduled'].includes(apt.status) && (
                        <>
                          <button
                            onClick={() => openCompleteModal(apt)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-xs shadow-sm flex items-center gap-1.5 inline-flex"
                            title="Mark student visit as completed"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Completed</span>
                          </button>

                          <button
                            onClick={() => {
                              setReschedulingApt(apt);
                              setRescheduleData({
                                date: apt.appointment_date,
                                start_time: apt.start_time.substring(0, 5),
                                end_time: apt.end_time.substring(0, 5),
                                admin_notes: apt.admin_notes || '',
                              });
                              setActionError('');
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition text-xs"
                            title="Adjust schedule"
                          >
                            Reschedule
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. APPROVE APPOINTMENT CONFIRMATION MODAL WITH COMPLETE DETAILS */}
      {/* (USER REQUIREMENT: Complete details displayed before confirmation) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!approvingApt}
        onClose={() => setApprovingApt(null)}
        title="Review & Approve Appointment Request"
        maxWidth="2xl"
      >
        {approvingApt && (
          <div className="space-y-4">
            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            {/* Service & Schedule Banner */}
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-emerald-800 px-2.5 py-0.5 bg-emerald-100 rounded-md">
                    {approvingApt.appointment_code}
                  </span>
                  <Badge status={approvingApt.status} />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 mt-1">
                  {approvingApt.service_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {approvingApt.service_category} • {approvingApt.location_or_counter || 'Window Desk'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Scheduled Appointment
                </span>
                <span className="text-xs font-extrabold text-slate-900 block mt-0.5">
                  {formatDateHuman(approvingApt.appointment_date)}
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-lg inline-block mt-1 font-mono">
                  {approvingApt.start_time.substring(0, 5)} - {approvingApt.end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            {/* Complete Student Dossier */}
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Student Profile & Contact Information
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Student Name</span>
                  <strong className="text-slate-800 text-sm">
                    {approvingApt.first_name} {approvingApt.last_name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Student ID Number</span>
                  <strong className="text-slate-800 font-mono text-sm">
                    {approvingApt.student_id_number || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="text-slate-700 font-medium break-all">{approvingApt.student_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                  <span className="text-slate-700 font-medium">
                    {approvingApt.contact_number || 'Not provided'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Course / Program</span>
                  <span className="text-slate-700 font-medium">
                    {approvingApt.department_or_course || 'Not specified'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Year Level</span>
                  <span className="text-slate-700 font-medium">
                    {approvingApt.year_level || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Purpose & Required Documents */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Student's Stated Purpose
                </span>
                <p className="text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  "{approvingApt.purpose}"
                </p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs space-y-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Required Documents Checklist
                </span>
                {approvingApt.requirements ? (
                  <div className="space-y-1.5 pt-1">
                    {approvingApt.requirements.split(',').map((req, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-slate-700">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span>{req.trim()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 italic">No specific documents specified for this service.</p>
                )}
              </div>
            </div>

            {/* Optional Staff Instructions for Student */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Staff Note / Preparation Instructions for Student (Optional)
              </label>
              <textarea
                rows={2}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Please proceed directly to Window 1 and bring your printed receipt and 2x2 ID picture..."
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                This note will be included in the automated confirmation email dispatched to the student.
              </span>
            </div>

            {/* Confirmation Banner */}
            <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-2xl text-blue-900 text-xs flex items-center gap-2.5">
              <Send className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Confirming approval will lock this time slot on the calendar and dispatch an official confirmation notice to{' '}
                <strong>{approvingApt.student_email}</strong>.
              </span>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const target = approvingApt;
                  setApprovingApt(null);
                  setRejectingApt(target);
                  setRejectionReason('');
                }}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
              >
                Decline Request Instead
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setApprovingApt(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleApproveConfirm}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm flex items-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{actionLoading ? 'Approving & Sending...' : 'Confirm & Approve Appointment'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 2. COMPLETE DOSSIER INSPECTION MODAL (Viewable for any appointment) */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!viewingApt}
        onClose={() => setViewingApt(null)}
        title={`Appointment Dossier: ${viewingApt?.appointment_code || ''}`}
        maxWidth="2xl"
      >
        {viewingApt && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-black text-slate-800 px-2 py-0.5 bg-slate-200 rounded">
                    {viewingApt.appointment_code}
                  </span>
                  <Badge status={viewingApt.status} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {viewingApt.service_name}
                </h3>
                <p className="text-xs text-slate-500">
                  {viewingApt.service_category} • {viewingApt.location_or_counter || 'Window Desk'}
                </p>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Appointment Date
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-0.5">
                  {formatDateHuman(viewingApt.appointment_date)}
                </span>
                <span className="text-xs text-slate-600 font-mono block mt-0.5">
                  {viewingApt.start_time.substring(0, 5)} - {viewingApt.end_time.substring(0, 5)}
                </span>
              </div>
            </div>

            {/* Student info */}
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Student Applicant Details
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Name</span>
                  <strong className="text-slate-800">
                    {viewingApt.first_name} {viewingApt.last_name}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Student ID</span>
                  <strong className="text-slate-800 font-mono">
                    {viewingApt.student_id_number || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email</span>
                  <span className="text-slate-700 break-all">{viewingApt.student_email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Phone</span>
                  <span className="text-slate-700">{viewingApt.contact_number || 'None'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Course</span>
                  <span className="text-slate-700">{viewingApt.department_or_course || '—'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Year Level</span>
                  <span className="text-slate-700">{viewingApt.year_level || '—'}</span>
                </div>
              </div>
            </div>

            {/* Purpose & Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Purpose / Remarks
                </span>
                <p className="text-slate-700 italic">"{viewingApt.purpose}"</p>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Service Requirements
                </span>
                <p className="text-slate-700">{viewingApt.requirements || 'No specific requirements'}</p>
              </div>
            </div>

            {/* Processing History */}
            {(viewingApt.admin_notes || viewingApt.rejection_reason || viewingApt.processor_first_name) && (
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Processing Information
                </span>
                {viewingApt.processor_first_name && (
                  <p className="text-slate-600">
                    Handled by: <strong>{viewingApt.processor_first_name} {viewingApt.processor_last_name}</strong>
                  </p>
                )}
                {viewingApt.admin_notes && (
                  <p className="text-brand-800">
                    Staff Notes: <em>{viewingApt.admin_notes}</em>
                  </p>
                )}
                {viewingApt.rejection_reason && (
                  <p className="text-rose-800">
                    Decline Reason: <em>{viewingApt.rejection_reason}</em>
                  </p>
                )}
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingApt(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition"
              >
                Close Dossier
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 3. COMPLETE APPOINTMENT CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!completingApt}
        onClose={() => setCompletingApt(null)}
        title="Mark Appointment as Completed"
        maxWidth="md"
      >
        {completingApt && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Confirm that student <strong>{completingApt.first_name} {completingApt.last_name}</strong> attended and completed their scheduled transaction for{' '}
              <strong>{completingApt.service_name}</strong>.
            </p>

            {actionError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Completion Notes / Summary (Optional)
              </label>
              <textarea
                rows={2}
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="e.g. Official Transcript released, official receipt verified."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCompleteConfirm}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {actionLoading ? 'Saving...' : 'Confirm Completion'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* ========================================================================= */}
      {/* 4. DECLINE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!rejectingApt}
        onClose={() => setRejectingApt(null)}
        title="Decline Appointment Request"
        maxWidth="md"
      >
        <form onSubmit={handleRejectConfirm} className="space-y-4">
          <p className="text-xs text-slate-500">
            Provide an explicit reason for declining. This explanation will be automatically emailed to{' '}
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
              placeholder="e.g. Incomplete prerequisite clearance stamps. Please settle library clearance first before booking."
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

      {/* ========================================================================= */}
      {/* 5. RESCHEDULE MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={!!reschedulingApt}
        onClose={() => setReschedulingApt(null)}
        title="Reschedule Appointment"
        maxWidth="md"
      >
        <form onSubmit={handleRescheduleConfirm} className="space-y-4">
          <p className="text-xs text-slate-500">
            Set the revised schedule for{' '}
            <strong>
              {reschedulingApt?.first_name} {reschedulingApt?.last_name}
            </strong>
            . An email notification will be dispatched with the revised time.
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
              placeholder="e.g. Moved due to department faculty assembly."
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
