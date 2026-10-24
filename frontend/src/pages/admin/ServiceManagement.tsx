import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Service, ServiceSchedule } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Layers,
  Plus,
  Edit2,
  Power,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  Check
} from 'lucide-react';

const WEEK_DAYS = [
  { day: 1, name: 'Monday', short: 'Mon' },
  { day: 2, name: 'Tuesday', short: 'Tue' },
  { day: 3, name: 'Wednesday', short: 'Wed' },
  { day: 4, name: 'Thursday', short: 'Thu' },
  { day: 5, name: 'Friday', short: 'Fri' },
  { day: 6, name: 'Saturday', short: 'Sat' },
  { day: 0, name: 'Sunday', short: 'Sun' },
];

const getDefaultSchedules = (): ServiceSchedule[] => [
  { day_of_week: 1, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
  { day_of_week: 2, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
  { day_of_week: 3, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
  { day_of_week: 4, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
  { day_of_week: 5, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
];

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState('');

  // Service Active Toggle Confirmation Modal State (HCI Heuristic 5: Error Prevention)
  const [togglingService, setTogglingService] = useState<Service | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Auto-dismiss feedback banner after 5 seconds (HCI Heuristic 1: Visibility of System Status)
  useEffect(() => {
    if (toastMessage || toastError) {
      const timer = setTimeout(() => {
        setToastMessage('');
        setToastError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toastError]);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    service_type: 'appointment',
    category: 'Registrar',
    location_or_counter: '',
    estimated_duration_mins: 15,
    max_daily_capacity: 50,
    requirements: '',
    description: '',
  });

  // Operating schedules for appointment services
  const [schedules, setSchedules] = useState<ServiceSchedule[]>(getDefaultSchedules());

  // Batch operating hours controls
  const [batchStart, setBatchStart] = useState('08:00');
  const [batchEnd, setBatchEnd] = useState('17:00');
  const [batchSlotMins, setBatchSlotMins] = useState(30);
  const [batchCapacity, setBatchCapacity] = useState(3);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadServices = async () => {
    try {
      const res = await api.getServices({ all: true });
      setServices(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      name: '',
      code: '',
      service_type: 'appointment',
      category: 'Registrar',
      location_or_counter: '',
      estimated_duration_mins: 15,
      max_daily_capacity: 50,
      requirements: '',
      description: '',
    });
    setSchedules(getDefaultSchedules());
    setBatchStart('08:00');
    setBatchEnd('17:00');
    setBatchSlotMins(30);
    setBatchCapacity(3);
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEditModal = async (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      code: service.code,
      service_type: service.service_type,
      category: service.category,
      location_or_counter: service.location_or_counter || '',
      estimated_duration_mins: service.estimated_duration_mins,
      max_daily_capacity: service.max_daily_capacity,
      requirements: service.requirements || '',
      description: service.description || '',
    });
    setFormError('');
    setIsCreateOpen(false);

    if (service.schedules && service.schedules.length > 0) {
      setSchedules(service.schedules);
      const first = service.schedules[0];
      setBatchStart(first.start_time.substring(0, 5));
      setBatchEnd(first.end_time.substring(0, 5));
      setBatchSlotMins(first.slot_duration_mins);
      setBatchCapacity(first.max_students_per_slot);
    } else {
      try {
        const res = await api.getServiceById(service.id);
        if (res.data?.schedules && res.data.schedules.length > 0) {
          setSchedules(res.data.schedules);
          const first = res.data.schedules[0];
          setBatchStart(first.start_time.substring(0, 5));
          setBatchEnd(first.end_time.substring(0, 5));
          setBatchSlotMins(first.slot_duration_mins);
          setBatchCapacity(first.max_students_per_slot);
        } else {
          setSchedules(getDefaultSchedules());
        }
      } catch {
        setSchedules(getDefaultSchedules());
      }
    }
  };

  // Toggle individual day schedule active/closed
  const toggleDay = (dayNum: number) => {
    const exists = schedules.find((s) => s.day_of_week === dayNum);
    if (exists) {
      setSchedules(schedules.filter((s) => s.day_of_week !== dayNum));
    } else {
      const newSchedule: ServiceSchedule = {
        day_of_week: dayNum,
        start_time: batchStart.length === 5 ? `${batchStart}:00` : batchStart,
        end_time: batchEnd.length === 5 ? `${batchEnd}:00` : batchEnd,
        slot_duration_mins: batchSlotMins,
        max_students_per_slot: batchCapacity,
      };
      const updated = [...schedules, newSchedule].sort((a, b) => {
        const orderA = a.day_of_week === 0 ? 7 : a.day_of_week;
        const orderB = b.day_of_week === 0 ? 7 : b.day_of_week;
        return orderA - orderB;
      });
      setSchedules(updated);
    }
  };

  // Quick schedule presets
  const applyPreset = (preset: 'mon-fri' | 'mwf' | 'tth' | 'all' | 'clear') => {
    if (preset === 'clear') {
      setSchedules([]);
      return;
    }
    let days: number[] = [];
    if (preset === 'mon-fri') days = [1, 2, 3, 4, 5];
    else if (preset === 'mwf') days = [1, 3, 5];
    else if (preset === 'tth') days = [2, 4];
    else if (preset === 'all') days = [1, 2, 3, 4, 5, 6, 0];

    const newSchedules: ServiceSchedule[] = days.map((d) => ({
      day_of_week: d,
      start_time: batchStart.length === 5 ? `${batchStart}:00` : batchStart,
      end_time: batchEnd.length === 5 ? `${batchEnd}:00` : batchEnd,
      slot_duration_mins: batchSlotMins,
      max_students_per_slot: batchCapacity,
    }));
    setSchedules(newSchedules);
  };

  // Batch update all active days with the batch settings
  const applyBatchHours = () => {
    if (schedules.length === 0) return;
    setSchedules((prev) =>
      prev.map((s) => ({
        ...s,
        start_time: batchStart.length === 5 ? `${batchStart}:00` : batchStart,
        end_time: batchEnd.length === 5 ? `${batchEnd}:00` : batchEnd,
        slot_duration_mins: batchSlotMins,
        max_students_per_slot: batchCapacity,
      }))
    );
  };

  // Fine-tune single day settings
  const updateDaySchedule = (dayNum: number, field: keyof ServiceSchedule, value: any) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day_of_week === dayNum) {
          if (field === 'start_time' || field === 'end_time') {
            const formatted = typeof value === 'string' && value.length === 5 ? `${value}:00` : value;
            return { ...s, [field]: formatted };
          }
          return { ...s, [field]: value };
        }
        return s;
      })
    );
  };

  const timeToSeconds = (timeStr: string) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.service_type === 'appointment') {
      if (schedules.length === 0) {
        setFormError('Please activate at least one operating day for this appointment service.');
        return;
      }
      for (const s of schedules) {
        if (s.start_time >= s.end_time) {
          const dName = WEEK_DAYS.find((d) => d.day === s.day_of_week)?.name || `Day ${s.day_of_week}`;
          setFormError(`End time must be later than start time on ${dName}.`);
          return;
        }
      }
    }

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        schedules: formData.service_type === 'appointment' ? schedules : [],
      };

      if (editingService) {
        await api.updateService(editingService.id, payload);
        setToastMessage(`Service "${formData.name}" (${formData.code}) updated successfully.`);
        setEditingService(null);
      } else {
        await api.createService(payload);
        setToastMessage(`New service "${formData.name}" (${formData.code}) created successfully.`);
        setIsCreateOpen(false);
      }
      loadServices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save service.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!togglingService) return;
    setToggleLoading(true);
    setToastError('');
    try {
      const willBeActive = togglingService.is_active !== 1;
      await api.toggleServiceActive(togglingService.id, willBeActive);
      setToastMessage(
        `Service "${togglingService.name}" (${togglingService.code}) has been ${
          willBeActive ? 'activated for bookings & queue' : 'deactivated and hidden from new tickets'
        }.`
      );
      setTogglingService(null);
      loadServices();
    } catch (e: any) {
      setToastError(e.message || 'Failed to change service status.');
    } finally {
      setToggleLoading(false);
    }
  };

  const filteredServices = services.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.code.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Service & Schedule Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Configure institutional student services, weekly operational schedules, and slot capacities.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Service</span>
        </button>
      </div>

      {/* Toast Feedback Banner (HCI Heuristic 1: Visibility of System Status) */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50"
            aria-label="Dismiss message"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {toastError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-bold text-sm">{toastError}</span>
          </div>
          <button
            onClick={() => setToastError('')}
            className="text-rose-600 hover:text-rose-900 p-1 rounded-lg hover:bg-rose-100/50"
            aria-label="Dismiss error"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative w-full sm:w-80">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Filter by name, code or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">Service Code & Name</th>
                <th className="py-4 px-6">Type & Schedule</th>
                <th className="py-4 px-6">Location / Window</th>
                <th className="py-4 px-6">Est. Duration</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {filteredServices.map((service) => (
                <tr key={service.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-800 rounded">
                        {service.code}
                      </span>
                      <span>{service.name}</span>
                    </div>
                    {service.description && (
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1 max-w-sm">
                        {service.description}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Badge status={service.service_type} />
                      <span className="text-slate-500 text-xs">{service.category}</span>
                    </div>
                    {service.service_type === 'appointment' && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                        <Clock className="w-3 h-3 text-brand-600 flex-shrink-0" />
                        <span>
                          {service.schedules && service.schedules.length > 0 ? (
                            `${service.schedules
                              .map((s) => WEEK_DAYS.find((d) => d.day === s.day_of_week)?.short)
                              .filter(Boolean)
                              .join(', ')} (${service.schedules[0].start_time.substring(0, 5)} - ${service.schedules[0].end_time.substring(0, 5)})`
                          ) : (
                            <span className="text-amber-600 font-semibold">No active schedule</span>
                          )}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {service.location_or_counter || '—'}
                  </td>
                  <td className="py-4 px-6">
                    ~{service.estimated_duration_mins} mins
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        service.is_active === 1
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          service.is_active === 1 ? 'bg-emerald-500' : 'bg-slate-400'
                        }`}
                      ></span>
                      {service.is_active === 1 ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(service)}
                      className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition"
                      title="Edit Service & Schedule"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setTogglingService(service)}
                      className={`p-1.5 rounded-lg transition ${
                        service.is_active === 1
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={service.is_active === 1 ? 'Deactivate Service' : 'Activate Service'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE & EDIT SERVICE MODAL */}
      <Modal
        isOpen={isCreateOpen || !!editingService}
        onClose={() => {
          setIsCreateOpen(false);
          setEditingService(null);
        }}
        title={editingService ? `Edit Service: ${editingService.name}` : 'Create New Student Service'}
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Official Transcript of Records"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unique Service Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. REG-TOR"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Service Type *
              </label>
              <select
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
              >
                <option value="appointment">Appointment-Based</option>
                <option value="queue">Queue-Based (Walk-In)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Category / Department *
              </label>
              <input
                type="text"
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g. Registrar, Finance, Guidance"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Est. Duration (Mins)
              </label>
              <input
                type="number"
                min="5"
                max="120"
                value={formData.estimated_duration_mins}
                onChange={(e) =>
                  setFormData({ ...formData, estimated_duration_mins: parseInt(e.target.value) || 15 })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Location / Counter Desk
              </label>
              <input
                type="text"
                value={formData.location_or_counter}
                onChange={(e) => setFormData({ ...formData, location_or_counter: e.target.value })}
                placeholder="e.g. Registrar Window 1"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Daily Capacity
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={formData.max_daily_capacity}
                onChange={(e) =>
                  setFormData({ ...formData, max_daily_capacity: parseInt(e.target.value) || 50 })
                }
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Required Documents / Prerequisites
            </label>
            <input
              type="text"
              value={formData.requirements}
              onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
              placeholder="e.g. Valid Student ID, Clearance Form, Official Receipt"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Notes
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Service purpose and additional student guidelines..."
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          {/* Interactive Weekly Schedule Configuration (Appointment-Based Services) */}
          {formData.service_type === 'appointment' && (
            <div className="pt-4 border-t border-slate-100 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-brand-600" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Active Weekly Operating Schedule
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        schedules.length > 0
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {schedules.length} Day{schedules.length !== 1 ? 's' : ''} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Click day buttons to toggle operating days, or adjust hours and slot capacities below.
                  </p>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                  <button
                    type="button"
                    onClick={() => applyPreset('mon-fri')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition"
                  >
                    Mon - Fri
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('mwf')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition"
                  >
                    MWF
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('tth')}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 rounded-lg transition"
                  >
                    TTh
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('all')}
                    className="px-2 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                  >
                    All Days
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('clear')}
                    className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Day Toggle Buttons */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {WEEK_DAYS.map((d) => {
                  const daySchedule = schedules.find((s) => s.day_of_week === d.day);
                  const isActive = !!daySchedule;
                  return (
                    <button
                      key={d.day}
                      type="button"
                      onClick={() => toggleDay(d.day)}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${
                        isActive
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-white hover:border-slate-300'
                      }`}
                    >
                      <span className="font-extrabold text-xs">{d.short}</span>
                      <span
                        className={`text-[10px] mt-0.5 font-medium ${
                          isActive ? 'text-brand-100' : 'text-slate-400'
                        }`}
                      >
                        {isActive
                          ? `${daySchedule.start_time.substring(0, 5)} - ${daySchedule.end_time.substring(0, 5)}`
                          : 'Closed'}
                      </span>
                      {isActive && (
                        <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {schedules.length === 0 ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center text-xs text-amber-800 flex items-center justify-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    No operational days active. Please click one or more day buttons above to configure schedules.
                  </span>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Batch Settings Bar */}
                  <div className="p-3 bg-slate-50/80 border border-slate-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <Sliders className="w-3.5 h-3.5 text-brand-600" />
                      <span>Batch Hours & Slot Settings:</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">From:</span>
                        <input
                          type="time"
                          value={batchStart}
                          onChange={(e) => setBatchStart(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">To:</span>
                        <input
                          type="time"
                          value={batchEnd}
                          onChange={(e) => setBatchEnd(e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">Slot:</span>
                        <select
                          value={batchSlotMins}
                          onChange={(e) => setBatchSlotMins(Number(e.target.value))}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="15">15 min</option>
                          <option value="20">20 min</option>
                          <option value="30">30 min</option>
                          <option value="45">45 min</option>
                          <option value="60">60 min</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">Max/Slot:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={batchCapacity}
                          onChange={(e) => setBatchCapacity(Number(e.target.value) || 1)}
                          className="w-14 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono text-center"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={applyBatchHours}
                        className="px-3 py-1 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-sm transition"
                      >
                        Apply to All Active Days
                      </button>
                    </div>
                  </div>

                  {/* Individual Day Cards */}
                  <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                    {schedules.map((s) => {
                      const dayMeta = WEEK_DAYS.find((d) => d.day === s.day_of_week);
                      const startSec = timeToSeconds(s.start_time);
                      const endSec = timeToSeconds(s.end_time);
                      const durSec = (s.slot_duration_mins || 30) * 60;
                      const daySlotsCount =
                        durSec > 0 && endSec > startSec ? Math.floor((endSec - startSec) / durSec) : 0;
                      const dayTotalCapacity = daySlotsCount * (s.max_students_per_slot || 3);

                      return (
                        <div
                          key={s.day_of_week}
                          className="p-3 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs hover:border-slate-300 transition"
                        >
                          <div className="flex items-center gap-2 min-w-36">
                            <span className="px-2.5 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg text-xs">
                              {dayMeta?.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {daySlotsCount} slots • {dayTotalCapacity} capacity
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-xs">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">Start:</span>
                              <input
                                type="time"
                                value={s.start_time.substring(0, 5)}
                                onChange={(e) =>
                                  updateDaySchedule(s.day_of_week, 'start_time', e.target.value)
                                }
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">End:</span>
                              <input
                                type="time"
                                value={s.end_time.substring(0, 5)}
                                onChange={(e) =>
                                  updateDaySchedule(s.day_of_week, 'end_time', e.target.value)
                                }
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                              />
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">Duration:</span>
                              <select
                                value={s.slot_duration_mins}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    s.day_of_week,
                                    'slot_duration_mins',
                                    Number(e.target.value)
                                  )
                                }
                                className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                              >
                                <option value="15">15 min</option>
                                <option value="20">20 min</option>
                                <option value="30">30 min</option>
                                <option value="45">45 min</option>
                                <option value="60">60 min</option>
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-slate-400 font-semibold">Max:</span>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={s.max_students_per_slot}
                                onChange={(e) =>
                                  updateDaySchedule(
                                    s.day_of_week,
                                    'max_students_per_slot',
                                    Number(e.target.value) || 1
                                  )
                                }
                                className="w-12 px-1.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleDay(s.day_of_week)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title={`Remove ${dayMeta?.name}`}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setEditingService(null);
              }}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {formLoading ? 'Saving...' : 'Save Service'}
            </button>
          </div>
        </form>
      </Modal>

      {/* SERVICE TOGGLE CONFIRMATION MODAL (HCI Heuristic 5: Error Prevention & Heuristic 6: Recognition) */}
      <Modal
        isOpen={!!togglingService}
        onClose={() => setTogglingService(null)}
        title={
          togglingService?.is_active === 1
            ? 'Deactivate Service Confirmation'
            : 'Activate Service Confirmation'
        }
        maxWidth="md"
      >
        {togglingService && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target Service
                </span>
                <div className="text-lg font-black text-slate-900 mt-0.5">
                  {togglingService.name}
                </div>
                <div className="text-xs font-mono font-semibold text-brand-600">
                  {togglingService.code} • {togglingService.category}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Location: {togglingService.location_or_counter || 'Standard Counter'}
                </p>
              </div>

              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                  togglingService.is_active === 1
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-slate-100 text-slate-500'
                }`}
              >
                {togglingService.is_active === 1 ? 'Currently Active' : 'Currently Disabled'}
              </span>
            </div>

            {togglingService.is_active === 1 ? (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold mb-0.5">Deactivation Consequence:</strong>
                  Students will no longer see this service in their catalog to book appointments or join walk-in queues. Existing confirmed appointments will not be deleted.
                </div>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="block font-bold mb-0.5">Activation Effect:</strong>
                  This service will become immediately available in the student portal for online scheduling and counter ticketing during its configured operational hours.
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTogglingService(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancel & Keep Status
              </button>
              <button
                type="button"
                disabled={toggleLoading}
                onClick={handleConfirmToggleActive}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 ${
                  togglingService.is_active === 1
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>
                  {toggleLoading
                    ? 'Updating...'
                    : togglingService.is_active === 1
                    ? 'Yes, Deactivate Service'
                    : 'Yes, Activate Service'}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
