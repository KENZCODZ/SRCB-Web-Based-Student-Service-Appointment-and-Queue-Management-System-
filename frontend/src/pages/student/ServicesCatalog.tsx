import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Service, TimeSlot, QueueEntry } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNavigate, Link } from 'react-router-dom';
import {
  Layers,
  Calendar,
  Clock,
  MapPin,
  FileCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Info,
  AlertTriangle,
  XCircle
} from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORTS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ServicesCatalog: React.FC = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'appointment' | 'queue'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [bookingService, setBookingService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState(dateToString(new Date()));
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [purpose, setPurpose] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Queue Join State
  const [activeTickets, setActiveTickets] = useState<QueueEntry[]>([]);
  const [queueModalService, setQueueModalService] = useState<Service | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState('');
  const [cancellingTicket, setCancellingTicket] = useState<QueueEntry | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

  // Local-safe date string formatter (YYYY-MM-DD) avoiding UTC offset shifts
  function dateToString(d: Date): string {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Parse YYYY-MM-DD into day of week (0=Sun, 1=Mon, ..., 6=Sat) in local time
  const getSelectedDayOfWeek = (dateStr: string): number => {
    if (!dateStr) return -1;
    const parts = dateStr.split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]).getDay();
    }
    return new Date(dateStr).getDay();
  };

  const getNextOperationalDate = (service: Service): string => {
    const activeDays = (service.schedules || []).map((s) => s.day_of_week);
    const now = new Date();
    if (activeDays.length === 0) {
      if (now.getDay() === 0) now.setDate(now.getDate() + 1);
      else if (now.getDay() === 6) now.setDate(now.getDate() + 2);
      return dateToString(now);
    }

    const testDate = new Date();
    for (let i = 0; i < 14; i++) {
      if (activeDays.includes(testDate.getDay())) {
        return dateToString(testDate);
      }
      testDate.setDate(testDate.getDate() + 1);
    }
    return dateToString(now);
  };

  const isOperatingDate = (service: Service | null, dateStr: string): boolean => {
    if (!service || !service.schedules || service.schedules.length === 0) return true;
    const day = getSelectedDayOfWeek(dateStr);
    return service.schedules.some((s) => s.day_of_week === day);
  };

  const getOperatingDaysList = (service: Service | null): string => {
    if (!service || !service.schedules || service.schedules.length === 0) return 'Monday to Friday';
    const activeDays = service.schedules.map((s) => DAY_NAMES[s.day_of_week]);
    return activeDays.join(', ');
  };

  const loadServices = async () => {
    try {
      const [servicesRes, ticketsRes] = await Promise.all([
        api.getServices({ all: false }),
        api.getMyActiveTickets()
      ]);
      setServices(servicesRes.data || []);
      setActiveTickets(ticketsRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // When date changes in booking modal, load available slots
  useEffect(() => {
    if (bookingService && selectedDate) {
      loadSlots(bookingService.id, selectedDate);
    }
  }, [bookingService, selectedDate]);

  const loadSlots = async (serviceId: number, date: string) => {
    setSlotsLoading(true);
    try {
      const res = await api.getAvailableSlots(serviceId, date);
      setAvailableSlots(res.data || []);
      setSelectedSlot(null);
    } catch (e: any) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleOpenBooking = (service: Service) => {
    setBookingService(service);
    const initialDate = getNextOperationalDate(service);
    setSelectedDate(initialDate);
    setSelectedSlot(null);
    setPurpose('');
    setBookingError('');
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingService || !selectedSlot) {
      setBookingError('Please select an available time slot.');
      return;
    }
    if (!purpose.trim()) {
      setBookingError('Please state the purpose of your appointment.');
      return;
    }

    setBookingLoading(true);
    setBookingError('');

    try {
      const res = await api.bookAppointment({
        service_id: bookingService.id,
        appointment_date: selectedDate,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        purpose: purpose.trim(),
      });
      setBookingSuccess(res.data);
    } catch (err: any) {
      setBookingError(err.message || 'Failed to book appointment.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleJoinQueue = async () => {
    if (!queueModalService) return;
    setQueueLoading(true);
    setQueueError('');

    try {
      await api.joinQueue(queueModalService.id);
      setQueueModalService(null);
      navigate('/queue');
    } catch (err: any) {
      setQueueError(err.message || 'Failed to join queue.');
    } finally {
      setQueueLoading(false);
    }
  };

  const handleConfirmCancelTicket = async () => {
    if (!cancellingTicket) return;
    setCancelLoading(true);
    try {
      await api.cancelQueueTicket(cancellingTicket.id);
      setCancellingTicket(null);
      await loadServices();
    } catch (err: any) {
      setQueueError(err.message || 'Failed to cancel queue ticket.');
    } finally {
      setCancelLoading(false);
    }
  };

  const handleCancelAndJoinNew = async (newServiceId: number) => {
    const currentTicket = activeTickets.find(
      (t) => t.status === 'waiting' || t.status === 'calling' || t.status === 'serving'
    );
    if (!currentTicket) return;

    setSwitchLoading(true);
    setQueueError('');
    try {
      await api.cancelQueueTicket(currentTicket.id);
      await api.joinQueue(newServiceId);
      setQueueModalService(null);
      navigate('/queue');
    } catch (err: any) {
      setQueueError(err.message || 'Failed to switch queue service.');
    } finally {
      setSwitchLoading(false);
    }
  };

  // Filter logic
  const categories = ['all', ...Array.from(new Set(services.map((s) => s.category)))];

  const filteredServices = services.filter((s) => {
    const matchesTab = activeTab === 'all' || s.service_type === activeTab || s.service_type === 'both';
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTab && matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Student Services Directory
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Select a service to book a scheduled appointment or join an active walk-in queue.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search services or codes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 transition"
          />
        </div>
      </div>

      {/* Active Ticket Banner */}
      {(() => {
        const activeTicket = activeTickets.find(
          (t) => t.status === 'waiting' || t.status === 'calling' || t.status === 'serving'
        );
        if (!activeTicket) return null;
        return (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <strong className="text-sm font-bold text-amber-950">
                    Active Ticket in Line: #{activeTicket.queue_number}
                  </strong>
                  <Badge status={activeTicket.status} />
                </div>
                <p className="text-xs text-amber-900/80 mt-0.5">
                  You are currently queued for <strong>{activeTicket.service_name}</strong> ({activeTicket.location_or_counter}). Students cannot join multiple lines at once. You may cancel your ticket anytime if you wish to switch.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <Link
                to="/queue"
                className="px-3 py-1.5 rounded-xl bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs border border-slate-200 transition shadow-2xs"
              >
                View Ticket
              </Link>
              <button
                type="button"
                onClick={() => setCancellingTicket(activeTicket)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-2xs"
              >
                Cancel Ticket
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tabs & Category Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
        {/* Service Type Tabs */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('appointment')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'appointment'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-brand-600" />
            <span>Appointment-Based</span>
          </button>
          <button
            onClick={() => setActiveTab('queue')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
              activeTab === 'queue' ? 'bg-white text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-cyan-600" />
            <span>Walk-In / Queue</span>
          </button>
        </div>

        {/* Category Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Department:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Departments' : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-sm">
          Loading student services...
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No services found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="font-mono text-xs font-black px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                    {service.code}
                  </span>
                  <Badge status={service.service_type} />
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">
                  {service.name}
                </h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{service.category}</p>

                {service.description && (
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-2">
                    {service.description}
                  </p>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{service.location_or_counter || 'Main Office'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>~{service.estimated_duration_mins} mins per student</span>
                  </div>
                  {(service.service_type === 'appointment' || service.service_type === 'both') && (
                    <div className="flex items-center gap-2 text-brand-700">
                      <Calendar className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                      <span className="font-medium truncate">
                        {service.schedules && service.schedules.length > 0
                          ? `Schedule: ${service.schedules
                              .map((s) => DAY_SHORTS[s.day_of_week])
                              .join(', ')} (${service.schedules[0].start_time.substring(0, 5)} - ${service.schedules[0].end_time.substring(0, 5)})`
                          : 'Schedule: Mon - Fri'}
                      </span>
                    </div>
                  )}
                  {service.requirements && (
                    <div className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <FileCheck className="w-3.5 h-3.5 text-brand-600 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] text-slate-600 line-clamp-2">
                        <strong>Reqs:</strong> {service.requirements}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                {(() => {
                  const activeTicket = activeTickets.find(
                    (t) => t.status === 'waiting' || t.status === 'calling' || t.status === 'serving'
                  );
                  const isCurrentActiveQueueService = activeTicket && activeTicket.service_id === service.id;

                  if (service.service_type === 'both') {
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => handleOpenBooking(service)}
                          className="py-2.5 px-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book</span>
                        </button>
                        {isCurrentActiveQueueService ? (
                          <Link
                            to="/queue"
                            className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>In Line (#{activeTicket.queue_number})</span>
                          </Link>
                        ) : (
                          <button
                            onClick={() => {
                              setQueueModalService(service);
                              setQueueError('');
                            }}
                            className="py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Queue</span>
                          </button>
                        )}
                      </div>
                    );
                  }

                  if (service.service_type === 'appointment') {
                    return (
                      <button
                        onClick={() => handleOpenBooking(service)}
                        className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                      >
                        <Calendar className="w-4 h-4" />
                        <span>Book Appointment</span>
                      </button>
                    );
                  }

                  if (isCurrentActiveQueueService) {
                    return (
                      <Link
                        to="/queue"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>In Line (#{activeTicket.queue_number})</span>
                      </Link>
                    );
                  }

                  return (
                    <button
                      onClick={() => {
                        setQueueModalService(service);
                        setQueueError('');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                    >
                      <Clock className="w-4 h-4" />
                      <span>Join Queue Ticket</span>
                    </button>
                  );
                })()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BOOK APPOINTMENT MODAL */}
      <Modal
        isOpen={!!bookingService}
        onClose={() => {
          setBookingService(null);
          setBookingSuccess(null);
        }}
        title={`Book Appointment: ${bookingService?.name || ''}`}
        maxWidth="lg"
      >
        {bookingSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Request Submitted Successfully</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your appointment is now pending verification. An in-app confirmation and email notification have been generated.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Appointment Code:</span>
                <strong className="text-slate-900 font-mono">{bookingSuccess.appointment_code}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <strong className="text-slate-900">
                  {new Date(bookingSuccess.appointment_date).toLocaleDateString()}
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time Window:</span>
                <strong className="text-slate-900">
                  {bookingSuccess.start_time} - {bookingSuccess.end_time}
                </strong>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setBookingService(null);
                  navigate('/appointments');
                }}
                className="flex-1 py-2.5 rounded-xl bg-brand-600 text-white font-bold text-xs hover:bg-brand-700 transition"
              >
                View My Appointments
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConfirmBooking} className="space-y-4">
            {bookingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            {/* Institutional Operating Schedule Banner */}
            <div className="p-3 bg-brand-50/70 border border-brand-100 rounded-2xl flex items-center gap-2 text-xs text-brand-900">
              <Calendar className="w-4 h-4 text-brand-600 flex-shrink-0" />
              <div>
                <span className="font-bold block">Institutional Operating Schedule</span>
                <span className="text-[11px] text-brand-700">
                  Open on: <strong>{getOperatingDaysList(bookingService)}</strong>
                  {bookingService?.schedules?.[0] &&
                    ` (${bookingService.schedules[0].start_time.substring(0, 5)} - ${bookingService.schedules[0].end_time.substring(0, 5)})`}
                </span>
              </div>
            </div>

            {/* Select Date */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Select Date *
              </label>
              <input
                type="date"
                required
                min={dateToString(new Date())}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            {/* Non-operating Day Warning */}
            {bookingService && !isOperatingDate(bookingService, selectedDate) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>
                    Closed on <strong>{DAY_NAMES[getSelectedDayOfWeek(selectedDate)] || 'this day'}</strong>. Operating days are {getOperatingDaysList(bookingService)}.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (bookingService) {
                      setSelectedDate(getNextOperationalDate(bookingService));
                    }
                  }}
                  className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-900 font-bold rounded-lg text-[10px] whitespace-nowrap transition"
                >
                  Jump to Open Day
                </button>
              </div>
            )}

            {/* Time Slot Selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Select Time Slot *
                </label>
                {availableSlots.length > 0 && (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {availableSlots.filter((s) => s.is_available).length} available of {availableSlots.length} slots
                  </span>
                )}
              </div>

              {slotsLoading ? (
                <div className="p-6 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600 animate-spin" />
                  <span>Loading available operational slots...</span>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500 space-y-2">
                  <p>
                    {!isOperatingDate(bookingService, selectedDate)
                      ? `No operational slots on ${DAY_NAMES[getSelectedDayOfWeek(selectedDate)] || 'this day'}. This service operates on ${getOperatingDaysList(bookingService)}.`
                      : 'No operational slots available on this date. Please choose another weekday.'}
                  </p>
                  {bookingService && !isOperatingDate(bookingService, selectedDate) && (
                    <button
                      type="button"
                      onClick={() => setSelectedDate(getNextOperationalDate(bookingService))}
                      className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-lg text-xs transition inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Select Next Available Day</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.start_time}
                      type="button"
                      disabled={!slot.is_available}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold text-center transition flex flex-col items-center justify-center ${
                        !slot.is_available
                          ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                          : selectedSlot?.start_time === slot.start_time
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm ring-2 ring-brand-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <span>{slot.start_time_human}</span>
                      <span className="text-[10px] mt-0.5 opacity-80">
                        {slot.is_available ? `${slot.available_capacity} slots left` : 'Full / Passed'}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Purpose / Remarks *
              </label>
              <textarea
                required
                rows={2}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Briefly state your purpose or required document details..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setBookingService(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={bookingLoading || !selectedSlot}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {bookingLoading ? 'Submitting...' : 'Confirm Appointment'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* JOIN QUEUE CONFIRMATION & CONFLICT MODAL */}
      <Modal
        isOpen={!!queueModalService}
        onClose={() => !queueLoading && !switchLoading && setQueueModalService(null)}
        title={`Join Walk-In Queue: ${queueModalService?.name || ''}`}
        maxWidth="md"
      >
        {queueModalService && (() => {
          const activeTicket = activeTickets.find(
            (t) => t.status === 'waiting' || t.status === 'calling' || t.status === 'serving'
          );

          if (activeTicket) {
            return (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Active Ticket Already in Line</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-amber-200/60 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Current Ticket
                      </span>
                      <div className="text-xl font-black font-mono text-slate-900">
                        {activeTicket.queue_number}
                      </div>
                      <p className="text-xs font-semibold text-slate-700">
                        {activeTicket.service_name} • {activeTicket.location_or_counter}
                      </p>
                    </div>
                    <Badge status={activeTicket.status} />
                  </div>
                  <p className="text-xs text-amber-900/80 leading-relaxed pt-1">
                    To maintain fair queue service, each student can only hold one active ticket in line at a time. Would you like to cancel your current ticket to join <strong>{queueModalService.name}</strong>, or keep your place?
                  </p>
                </div>

                {queueError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{queueError}</span>
                  </div>
                )}

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={switchLoading}
                    onClick={() => setQueueModalService(null)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
                  >
                    Keep Current Ticket
                  </button>
                  <button
                    type="button"
                    disabled={switchLoading}
                    onClick={() => handleCancelAndJoinNew(queueModalService.id)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{switchLoading ? 'Switching Queues...' : `Cancel #${activeTicket.queue_number} & Join ${queueModalService.code}`}</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div className="space-y-4">
              {queueError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{queueError}</span>
                </div>
              )}

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Target Counter:</span>
                  <strong className="text-slate-900">{queueModalService?.location_or_counter || 'Window Desk'}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Est. Serving Time:</span>
                  <strong className="text-slate-900">~{queueModalService?.estimated_duration_mins} mins</strong>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                A digital queue ticket will be issued. You will receive real-time notifications when your ticket is called. You may cancel your ticket anytime if your plans change.
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setQueueModalService(null)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinQueue}
                  disabled={queueLoading}
                  className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
                >
                  {queueLoading ? 'Generating Ticket...' : 'Get Queue Ticket'}
                </button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* CONFIRM TICKET CANCELLATION MODAL */}
      <Modal
        isOpen={!!cancellingTicket}
        onClose={() => !cancelLoading && setCancellingTicket(null)}
        title="Cancel Queue Ticket"
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
                <p className="text-[11px] text-slate-400">
                  {cancellingTicket.location_or_counter}
                </p>
              </div>
              <Badge status={cancellingTicket.status} />
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to cancel this ticket? Your place in line will be surrendered, and subsequent students will move ahead.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                disabled={cancelLoading}
                onClick={() => setCancellingTicket(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Keep My Place
              </button>
              <button
                type="button"
                disabled={cancelLoading}
                onClick={handleConfirmCancelTicket}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                <span>{cancelLoading ? 'Cancelling...' : 'Yes, Cancel Ticket'}</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
