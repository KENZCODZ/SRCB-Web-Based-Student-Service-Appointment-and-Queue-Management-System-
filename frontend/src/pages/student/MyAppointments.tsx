import React, { useState, useEffect } from 'react';
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
  Plus
} from 'lucide-react';

export const MyAppointments: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  // Cancel Modal State
  const [cancellingApt, setCancellingApt] = useState<Appointment | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

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

  const filteredAppointments = appointments.filter(a => {
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl w-fit">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All ({appointments.length})
        </button>
        <button
          onClick={() => setStatusFilter('active')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            statusFilter === 'active' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Upcoming / Active
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            statusFilter === 'completed' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Completed
        </button>
        <button
          onClick={() => setStatusFilter('cancelled')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
            statusFilter === 'cancelled' ? 'bg-white text-rose-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Declined / Cancelled
        </button>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading your appointments...
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No appointments found</h3>
          <p className="text-xs text-slate-400 mt-1">You do not have any appointments matching the selected filter.</p>
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
                  <span className="font-mono text-xs font-black px-2.5 py-1 bg-brand-50 text-brand-800 rounded-lg border border-brand-200">
                    {apt.appointment_code}
                  </span>
                  <Badge status={apt.status} />
                  <span className="text-xs text-slate-400">
                    Booked on {new Date(apt.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {apt.service_name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <strong>Purpose:</strong> {apt.purpose}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span><strong>Date:</strong> {new Date(apt.appointment_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span><strong>Time:</strong> {apt.start_time} - {apt.end_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                    <span className="truncate">{apt.location_or_counter}</span>
                  </div>
                </div>

                {/* Admin notes or rejection alert if applicable */}
                {apt.status === 'rejected' && apt.rejection_reason && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Decline Reason:</strong> {apt.rejection_reason}
                    </div>
                  </div>
                )}

                {apt.admin_notes && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-800 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Staff Instructions:</strong> {apt.admin_notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 md:flex-col md:justify-center border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                {['pending', 'approved'].includes(apt.status) && (
                  <button
                    onClick={() => {
                      setCancellingApt(apt);
                      setCancelError('');
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CANCELLATION CONFIRMATION MODAL */}
      <Modal
        isOpen={!!cancellingApt}
        onClose={() => setCancellingApt(null)}
        title="Cancel Appointment"
        maxWidth="sm"
      >
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <XCircle className="w-6 h-6" />
          </div>

          <h3 className="text-base font-bold text-slate-900">Are you sure?</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Do you really want to cancel your appointment for <strong>{cancellingApt?.service_name}</strong> on{' '}
            {cancellingApt && new Date(cancellingApt.appointment_date).toLocaleDateString()}?
          </p>

          {cancelError && (
            <div className="p-2.5 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">
              {cancelError}
            </div>
          )}

          <div className="pt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => setCancellingApt(null)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Keep Appointment
            </button>
            <button
              type="button"
              disabled={cancelLoading}
              onClick={handleCancelConfirm}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
