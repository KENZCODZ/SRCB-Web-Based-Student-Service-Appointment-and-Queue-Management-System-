import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Service, TimeSlot } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNavigate } from 'react-router-dom';
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
  Info
} from 'lucide-react';

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
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState<any>(null);

  // Queue Join State
  const [queueModalService, setQueueModalService] = useState<Service | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [queueError, setQueueError] = useState('');

  function dateToString(d: Date) {
    return d.toISOString().split('T')[0];
  }

  const loadServices = async () => {
    try {
      const res = await api.getServices({ all: false });
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

  // When date changes in booking modal, load available slots
  useEffect(() => {
    if (bookingService && selectedDate) {
      loadSlots(bookingService.id, selectedDate);
    }
  }, [bookingService, selectedDate]);

  const loadSlots = async (serviceId: number, date: string) => {
    try {
      const res = await api.getAvailableSlots(serviceId, date);
      setAvailableSlots(res.data || []);
      setSelectedSlot(null);
    } catch (e: any) {
      setAvailableSlots([]);
    }
  };

  const handleOpenBooking = (service: Service) => {
    setBookingService(service);
    setSelectedDate(dateToString(new Date()));
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

  // Filter logic
  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter(s => {
    const matchesTab = activeTab === 'all' || s.service_type === activeTab;
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
              activeTab === 'appointment' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
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
            {categories.map(c => (
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
                {service.service_type === 'appointment' ? (
                  <button
                    onClick={() => handleOpenBooking(service)}
                    className="w-full py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Book Appointment</span>
                  </button>
                ) : (
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
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* APPOINTMENT BOOKING MODAL */}
      <Modal
        isOpen={!!bookingService}
        onClose={() => setBookingService(null)}
        title={bookingSuccess ? 'Appointment Booked!' : `Book Appointment: ${bookingService?.name}`}
        maxWidth="lg"
      >
        {bookingSuccess ? (
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Request Submitted Successfully</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Your appointment is now pending verification. An email notification will be sent once approved.
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

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Select Time Slot *
              </label>

              {availableSlots.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500">
                  No operational slots available on this date. Please choose another weekday.
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
                          ? 'bg-brand-600 border-brand-600 text-white shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-brand-300 hover:bg-brand-50/50'
                      }`}
                    >
                      <span>{slot.start_time_human}</span>
                      <span className="text-[10px] mt-0.5 opacity-80">
                        {slot.is_available ? `${slot.available_capacity} slots left` : 'Full / Closed'}
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

      {/* JOIN QUEUE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!queueModalService}
        onClose={() => setQueueModalService(null)}
        title="Join Service Queue"
        maxWidth="sm"
      >
        <div className="space-y-4">
          {queueError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{queueError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-cyan-50/50 border border-cyan-100 text-xs space-y-2">
            <div>
              <span className="text-slate-400 block font-medium">Service:</span>
              <strong className="text-slate-900 text-sm">{queueModalService?.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Counter / Window:</span>
              <strong className="text-slate-800">{queueModalService?.location_or_counter}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Estimated Time:</span>
              <strong className="text-slate-800">~{queueModalService?.estimated_duration_mins} mins</strong>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            A digital ticket number will be generated for you today. You can monitor your position in line in real-time.
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
              type="button"
              disabled={queueLoading}
              onClick={handleJoinQueue}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {queueLoading ? 'Issuing Ticket...' : 'Get Queue Ticket'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
