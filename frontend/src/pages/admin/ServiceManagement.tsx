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
  AlertCircle
} from 'lucide-react';

export const ServiceManagement: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  // Default Mon-Fri schedules for appointment services
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([
    { day_of_week: 1, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
    { day_of_week: 2, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
    { day_of_week: 3, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
    { day_of_week: 4, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
    { day_of_week: 5, start_time: '08:00:00', end_time: '17:00:00', slot_duration_mins: 30, max_students_per_slot: 3 },
  ]);

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
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEditModal = (service: Service) => {
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
    if (service.schedules && service.schedules.length > 0) {
      setSchedules(service.schedules);
    }
    setFormError('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const payload = {
        ...formData,
        schedules: formData.service_type === 'appointment' ? schedules : [],
      };

      if (editingService) {
        await api.updateService(editingService.id, payload);
        setEditingService(null);
      } else {
        await api.createService(payload);
        setIsCreateOpen(false);
      }
      loadServices();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save service.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      await api.toggleServiceActive(service.id, service.is_active !== 1);
      loadServices();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle status');
    }
  };

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const filteredServices = services.filter(s =>
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
            Configure institutional student services, time slots, and queue capacities.
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
                <th className="py-4 px-6">Type & Category</th>
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
                      <span className={`w-1.5 h-1.5 rounded-full ${service.is_active === 1 ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
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
                      onClick={() => handleToggleActive(service)}
                      className={`p-1.5 rounded-lg transition ${
                        service.is_active === 1
                          ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                      }`}
                      title={service.is_active === 1 ? 'Deactivate' : 'Activate'}
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
        maxWidth="xl"
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
                onChange={(e) => setFormData({ ...formData, estimated_duration_mins: parseInt(e.target.value) || 15 })}
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
                onChange={(e) => setFormData({ ...formData, max_daily_capacity: parseInt(e.target.value) || 50 })}
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

          {/* If Appointment-Based: Operating Schedule Summary */}
          {formData.service_type === 'appointment' && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                Active Weekly Operating Schedule (Mon-Fri 8:00 AM - 5:00 PM)
              </span>
              <div className="grid grid-cols-5 gap-2 text-center text-xs">
                {schedules.map((s) => (
                  <div key={s.day_of_week} className="p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="font-bold text-slate-800 block">{dayNames[s.day_of_week]}</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">
                      {s.start_time.substring(0, 5)} - {s.end_time.substring(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 flex justify-end gap-2">
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
    </div>
  );
};
