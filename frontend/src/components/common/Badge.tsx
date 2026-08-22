import React from 'react';
import { AppointmentStatus, QueueStatus, ServiceType } from '../../types';

interface BadgeProps {
  status?: AppointmentStatus | QueueStatus | ServiceType | string;
  className?: string;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '', children }) => {
  const normalized = (status || '').toString().toLowerCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  // Appointment Status Colors
  if (normalized === 'pending' || normalized === 'waiting') {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (normalized === 'approved' || normalized === 'completed' || normalized === 'active') {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (normalized === 'rejected' || normalized === 'cancelled' || normalized === 'failed') {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (normalized === 'rescheduled' || normalized === 'calling' || normalized === 'skipped') {
    colorClasses = 'bg-orange-50 text-orange-700 border-orange-200';
  } else if (normalized === 'serving') {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse';
  } else if (normalized === 'appointment') {
    colorClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
  } else if (normalized === 'queue') {
    colorClasses = 'bg-cyan-50 text-cyan-700 border-cyan-200';
  } else if (normalized === 'admin') {
    colorClasses = 'bg-purple-50 text-purple-700 border-purple-200';
  } else if (normalized === 'staff') {
    colorClasses = 'bg-sky-50 text-sky-700 border-sky-200';
  } else if (normalized === 'student') {
    colorClasses = 'bg-teal-50 text-teal-700 border-teal-200';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${colorClasses} ${className}`}>
      {children || status}
    </span>
  );
};
