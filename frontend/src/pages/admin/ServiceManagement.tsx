import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../../services/api';
import { Service, ServiceSchedule, ServiceType } from '../../types';
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
  Check,
  Building2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2
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

const timeToSeconds = (timeStr: string) => {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
};

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

  // Standard registered campus office categories
  const standardOfficeCategories = [
    'Registrar',
    'Finance',
    'IT Department',
    'Guidance',
    'Dean Office',
    'Library',
  ];

  // Derived unique categories from existing services and standard campus offices
  const availableCategories = useMemo(() => {
    const list = [...standardOfficeCategories];
    services.forEach((s) => {
      if (s.category && s.category.trim() && !list.includes(s.category.trim())) {
        list.push(s.category.trim());
      }
    });
    return list;
  }, [services]);

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    service_type: 'appointment' as ServiceType,
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

  // Active Tab for Service Create / Edit Modal (Details vs Schedule)
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'schedule'>('details');

  // Computed total weekly appointment slots and student capacity
  const scheduleStats = useMemo(() => {
    let totalSlots = 0;
    let totalCapacity = 0;
    schedules.forEach((s) => {
      const startSec = timeToSeconds(s.start_time);
      const endSec = timeToSeconds(s.end_time);
      const durSec = (s.slot_duration_mins || 30) * 60;
      const daySlots = durSec > 0 && endSec > startSec ? Math.floor((endSec - startSec) / durSec) : 0;
      totalSlots += daySlots;
      totalCapacity += daySlots * (s.max_students_per_slot || 3);
    });
    return { totalSlots, totalCapacity };
  }, [schedules]);

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
    setActiveModalTab('details');
    setIsCustomCategory(false);
    setCustomCategory('');
    setFormData({
      name: '',
      code: '',
      service_type: 'appointment',
      category: availableCategories[0] || 'Registrar',
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
    setActiveModalTab('details');
    const isCustom = !availableCategories.includes(service.category);
    setIsCustomCategory(isCustom);
    setCustomCategory(isCustom ? service.category : '');
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAppointmentOrBoth = formData.service_type === 'appointment' || formData.service_type === 'both';

    if (isAppointmentOrBoth) {
      if (schedules.length === 0) {
        setFormError('Please activate at least one operating day for this appointment/hybrid service.');
        setActiveModalTab('schedule');
        return;
      }
      for (const s of schedules) {
        if (s.start_time >= s.end_time) {
          const dName = WEEK_DAYS.find((d) => d.day === s.day_of_week)?.name || `Day ${s.day_of_week}`;
          setFormError(`End time must be later than start time on ${dName}.`);
          setActiveModalTab('schedule');
          return;
        }
      }
    }

    const finalCategory = isCustomCategory ? customCategory.trim() : formData.category;
    if (!finalCategory) {
      setFormError('Please select or specify a category / department for this service.');
      return;
    }

    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        category: finalCategory,
        schedules: isAppointmentOrBoth ? schedules : [],
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
                    {(service.service_type === 'appointment' || service.service_type === 'both') && (
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
        subtitle={
          editingService
            ? `Updating service #${editingService.id} (${editingService.code})`
            : 'Configure basic details, campus office, and operating schedules'
        }
        icon={<Layers className="w-5 h-5 text-brand-600" />}
        maxWidth="4xl"
        noPadding
      >
        <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
          {/* TAB BAR & FEEDBACK HEADER */}
          <div className="px-6 pt-5 pb-3 bg-white border-b border-slate-100 flex-shrink-0">
            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center justify-between gap-2.5 shadow-2xs animate-in fade-in">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                  <span className="font-semibold">{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError('')}
                  className="text-rose-400 hover:text-rose-700 p-0.5 rounded transition"
                  title="Dismiss error"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
                <button
                  type="button"
                  onClick={() => setActiveModalTab('details')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                    activeModalTab === 'details'
                      ? 'bg-white text-brand-700 shadow-2xs border border-slate-200/50'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-brand-600" />
                  <span>1. Service Details & Office</span>
                </button>

                {(formData.service_type === 'appointment' || formData.service_type === 'both') && (
                  <button
                    type="button"
                    onClick={() => setActiveModalTab('schedule')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                      activeModalTab === 'schedule'
                        ? 'bg-white text-brand-700 shadow-2xs border border-slate-200/50'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-brand-600" />
                    <span>2. Operating Schedule</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        schedules.length > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {schedules.length} {schedules.length === 1 ? 'day' : 'days'}
                    </span>
                  </button>
                )}
              </div>

              {/* Delivery Mode Badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-400 hidden sm:inline">Mode:</span>
                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] flex items-center gap-1.5 ${
                    formData.service_type === 'both'
                      ? 'bg-violet-50 text-violet-800 border border-violet-200'
                      : formData.service_type === 'queue'
                      ? 'bg-teal-50 text-teal-800 border border-teal-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      formData.service_type === 'both'
                        ? 'bg-violet-500'
                        : formData.service_type === 'queue'
                        ? 'bg-teal-500'
                        : 'bg-indigo-500'
                    }`}
                  />
                  <span>
                    {formData.service_type === 'both'
                      ? 'Hybrid (Appointment & Queue)'
                      : formData.service_type === 'queue'
                      ? 'Walk-In Queue Only'
                      : 'Appointment-Based Only'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* SCROLLABLE FORM BODY: Unified single scroll container */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* TAB 1: SERVICE DETAILS & CAMPUS OFFICE */}
            {activeModalTab === 'details' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                {/* Basic Identification */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Layers className="w-4 h-4 text-brand-600" />
                    <span>Basic Information</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Service Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Official Transcript of Records (TOR)"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Unique Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. REG-TOR"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono uppercase bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Description / Student Guidelines
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Briefly describe the purpose of this service, steps for the student, or special instructions..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                    />
                  </div>
                </div>

                {/* Delivery Mode & Campus Office Assignment */}
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700">
                    <Building2 className="w-4 h-4 text-brand-600" />
                    <span>Service Delivery & Office Assignment</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Service Type Option */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Service Type <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value as ServiceType })}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      >
                        <option value="appointment">Appointment-Based (Online Bookings)</option>
                        <option value="queue">Queue-Based (Walk-In Tickets)</option>
                        <option value="both">Both (Appointment & Walk-In Queue)</option>
                      </select>

                      <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200/60">
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 ${
                            formData.service_type === 'both'
                              ? 'bg-violet-500'
                              : formData.service_type === 'queue'
                              ? 'bg-teal-500'
                              : 'bg-indigo-500'
                          }`}
                        />
                        <span>
                          {formData.service_type === 'both'
                            ? 'Hybrid: Students can book appointment slots OR take live walk-in queue tickets.'
                            : formData.service_type === 'queue'
                            ? 'Walk-In: Students request live queue tickets for counter calling during office hours.'
                            : 'Scheduled: Students reserve designated appointment date and time slots.'}
                        </span>
                      </div>
                    </div>

                    {/* Category / Department Office Dropdown (Not free text) */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Category / Department Office <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={isCustomCategory ? '__custom__' : formData.category}
                        onChange={(e) => {
                          if (e.target.value === '__custom__') {
                            setIsCustomCategory(true);
                            setCustomCategory('');
                          } else {
                            setIsCustomCategory(false);
                            setFormData({ ...formData, category: e.target.value });
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      >
                        <optgroup label="Registered Campus Offices">
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="New Department">
                          <option value="__custom__">+ Register New Office / Department...</option>
                        </optgroup>
                      </select>

                      {isCustomCategory ? (
                        <div className="mt-2 animate-in fade-in">
                          <input
                            type="text"
                            required
                            value={customCategory}
                            onChange={(e) => {
                              setCustomCategory(e.target.value);
                              setFormData({ ...formData, category: e.target.value });
                            }}
                            placeholder="Enter new office name (e.g. Clinic, Admissions)..."
                            className="w-full px-4 py-2 rounded-xl border border-brand-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 shadow-2xs"
                            autoFocus
                          />
                          <span className="text-[10px] text-slate-400 mt-0.5 block">
                            This will register a new department category across the system.
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 mt-2 block">
                          Assigned counter staff and displays will filter tickets for this office.
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Counter Desk / Room Location
                      </label>
                      <input
                        type="text"
                        value={formData.location_or_counter}
                        onChange={(e) => setFormData({ ...formData, location_or_counter: e.target.value })}
                        placeholder="e.g. Registrar Window 1"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Est. Duration (Mins)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="180"
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        value={formData.estimated_duration_mins}
                        onChange={(e) =>
                          setFormData({ ...formData, estimated_duration_mins: parseInt(e.target.value) || 15 })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Max Daily Capacity
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1000"
                        onWheel={(e) => (e.target as HTMLElement).blur()}
                        value={formData.max_daily_capacity}
                        onChange={(e) =>
                          setFormData({ ...formData, max_daily_capacity: parseInt(e.target.value) || 50 })
                        }
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Required Documents / Prerequisites
                    </label>
                    <input
                      type="text"
                      value={formData.requirements}
                      onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                      placeholder="e.g. Valid Student ID, Clearance Form, Official Receipt"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-400 mt-1 block">
                      Separate documents with commas. These requirements will be shown to students during booking.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: OPERATING SCHEDULE (FOR APPOINTMENT OR BOTH) */}
            {activeModalTab === 'schedule' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-5 space-y-4 shadow-2xs">
                  {/* Schedule Header & Presets */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-brand-600" />
                        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Weekly Operating Schedule & Time Slots
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        <span
                          className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            schedules.length > 0
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {schedules.length} Active Day{schedules.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-medium text-[11px]">
                          {scheduleStats.totalSlots} Weekly Slots
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-600 font-medium text-[11px]">
                          {scheduleStats.totalCapacity} Total Capacity
                        </span>
                      </div>
                    </div>

                    {/* Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Presets:</span>
                      <button
                        type="button"
                        onClick={() => applyPreset('mon-fri')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-slate-700 rounded-lg transition shadow-2xs"
                      >
                        Mon - Fri
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('mwf')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-slate-700 rounded-lg transition shadow-2xs"
                      >
                        MWF
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('tth')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-300 text-slate-700 rounded-lg transition shadow-2xs"
                      >
                        TTh
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('all')}
                        className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg transition shadow-2xs"
                      >
                        All Days
                      </button>
                      <button
                        type="button"
                        onClick={() => applyPreset('clear')}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-600 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition shadow-2xs"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* 7 Days Selector Buttons */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Click Days to Toggle Service Availability:
                    </label>
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                      {WEEK_DAYS.map((d) => {
                        const daySchedule = schedules.find((s) => s.day_of_week === d.day);
                        const isActive = !!daySchedule;
                        return (
                          <button
                            key={d.day}
                            type="button"
                            onClick={() => toggleDay(d.day)}
                            className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center justify-center relative shadow-2xs ${
                              isActive
                                ? 'bg-brand-600 border-brand-600 text-white shadow-brand-600/20 ring-2 ring-brand-400/30'
                                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
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
                              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-xs"></span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {schedules.length === 0 ? (
                    <div className="p-5 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>
                        No operating days selected. Click <strong>"Mon - Fri"</strong> preset above or click any day buttons to activate schedule slots.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-1">
                      {/* Batch Settings Bar */}
                      <div className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 text-slate-700 font-bold">
                          <Sliders className="w-4 h-4 text-brand-600" />
                          <span>Apply Hours to All Active Days:</span>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">From:</span>
                            <input
                              type="time"
                              value={batchStart}
                              onChange={(e) => setBatchStart(e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">To:</span>
                            <input
                              type="time"
                              value={batchEnd}
                              onChange={(e) => setBatchEnd(e.target.value)}
                              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Slot:</span>
                            <select
                              value={batchSlotMins}
                              onChange={(e) => setBatchSlotMins(Number(e.target.value))}
                              className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:ring-1 focus:ring-brand-500"
                            >
                              <option value="15">15 min</option>
                              <option value="20">20 min</option>
                              <option value="30">30 min</option>
                              <option value="45">45 min</option>
                              <option value="60">60 min</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-slate-500">Max/Slot:</span>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              onWheel={(e) => (e.target as HTMLElement).blur()}
                              value={batchCapacity}
                              onChange={(e) => setBatchCapacity(Number(e.target.value) || 1)}
                              className="w-14 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center font-bold focus:ring-1 focus:ring-brand-500"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={applyBatchHours}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs shadow-2xs transition active:scale-95"
                          >
                            Apply to All
                          </button>
                        </div>
                      </div>

                      {/* Individual Day Cards (Directly rendered, NO nested scroll trap) */}
                      <div className="space-y-2.5">
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
                              className="p-3.5 bg-white border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs hover:border-brand-200 transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-44">
                                <span className="px-3 py-1 bg-brand-50 text-brand-700 font-bold rounded-lg text-xs">
                                  {dayMeta?.name}
                                </span>
                                <span className="text-[11px] text-slate-500 font-medium">
                                  {daySlotsCount} slots • {dayTotalCapacity} capacity
                                </span>
                              </div>

                              <div className="flex items-center gap-2.5 flex-wrap text-xs">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Start:</span>
                                  <input
                                    type="time"
                                    value={s.start_time.substring(0, 5)}
                                    onChange={(e) =>
                                      updateDaySchedule(s.day_of_week, 'start_time', e.target.value)
                                    }
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">End:</span>
                                  <input
                                    type="time"
                                    value={s.end_time.substring(0, 5)}
                                    onChange={(e) =>
                                      updateDaySchedule(s.day_of_week, 'end_time', e.target.value)
                                    }
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-medium"
                                  />
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Duration:</span>
                                  <select
                                    value={s.slot_duration_mins}
                                    onChange={(e) =>
                                      updateDaySchedule(
                                        s.day_of_week,
                                        'slot_duration_mins',
                                        Number(e.target.value)
                                      )
                                    }
                                    className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium"
                                  >
                                    <option value="15">15 min</option>
                                    <option value="20">20 min</option>
                                    <option value="30">30 min</option>
                                    <option value="45">45 min</option>
                                    <option value="60">60 min</option>
                                  </select>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] text-slate-400 font-bold uppercase">Max/Slot:</span>
                                  <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    onWheel={(e) => (e.target as HTMLElement).blur()}
                                    value={s.max_students_per_slot}
                                    onChange={(e) =>
                                      updateDaySchedule(
                                        s.day_of_week,
                                        'max_students_per_slot',
                                        Number(e.target.value) || 1
                                      )
                                    }
                                    className="w-12 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-center font-bold"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={() => toggleDay(s.day_of_week)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                  title={`Remove ${dayMeta?.name}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STICKY FOOTER ACTIONS: Always pinned & visible at bottom without scrolling */}
          <div className="sticky bottom-0 z-20 px-6 py-3.5 bg-slate-50/95 backdrop-blur-sm border-t border-slate-200/90 flex items-center justify-between flex-shrink-0">
            <div className="text-xs text-slate-500 font-medium hidden sm:block">
              {activeModalTab === 'details' ? (
                (formData.service_type === 'appointment' || formData.service_type === 'both') ? (
                  <span>Step 1 of 2 • Next: Schedule ({schedules.length} active days)</span>
                ) : (
                  <span>Walk-in queue service • No schedule configuration needed</span>
                )
              ) : (
                <span>Step 2 of 2 • {scheduleStats.totalSlots} total weekly booking slots</span>
              )}
            </div>

            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingService(null);
                }}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-200/70 active:bg-slate-200 font-semibold text-xs transition border border-transparent hover:border-slate-300"
              >
                Cancel
              </button>

              {activeModalTab === 'details' && (formData.service_type === 'appointment' || formData.service_type === 'both') && (
                <button
                  type="button"
                  onClick={() => setActiveModalTab('schedule')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200"
                >
                  <span>Next: Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}

              {activeModalTab === 'schedule' && (
                <button
                  type="button"
                  onClick={() => setActiveModalTab('details')}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 border border-slate-200"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Details</span>
                </button>
              )}

              <button
                type="submit"
                disabled={formLoading}
                className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-600/20 transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {formLoading ? (
                  <span>Saving Service...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{editingService ? 'Save Changes' : 'Create Service'}</span>
                  </>
                )}
              </button>
            </div>
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
