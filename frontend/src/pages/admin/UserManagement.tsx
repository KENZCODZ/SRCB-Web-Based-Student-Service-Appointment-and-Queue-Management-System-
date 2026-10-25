import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, UserRole, Service } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  Pencil,
  ShieldCheck,
  UserCheck,
  Sparkles,
  Lock
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastError, setToastError] = useState('');

  // Account Toggle Confirmation Modal State
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Auto-dismiss toast message after 5 seconds
  useEffect(() => {
    if (toastMessage || toastError) {
      const timer = setTimeout(() => {
        setToastMessage('');
        setToastError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, toastError]);

  // Standard student courses & year levels
  const courses = [
    'BS Information Technology',
    'BS Computer Science',
    'BS Business Administration',
    'BS Hospitality Management',
    'Bachelor of Elementary Education',
    'Bachelor of Secondary Education',
    'BS Criminology',
    'Senior High School',
  ];
  const yearLevels = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Grade 11', 'Grade 12'];

  // Base list of campus offices; will also merge unique categories from active services
  const defaultOffices = [
    'Registrar Office',
    'Finance / Cashier Office',
    'IT Department',
    'Guidance Office',
    'Dean Office',
    'Library',
    'All Offices / System Administration'
  ];

  // Form states for creating a new account
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'staff' as UserRole,
    student_id_number: '',
    contact_number: '',
    department_or_course: 'Registrar Office',
    year_level: '',
    password: 'password123',
  });
  const [customOffice, setCustomOffice] = useState('');
  const [isCustomOffice, setIsCustomOffice] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Form states for editing an existing account
  const [editFormData, setEditFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    role: 'staff' as UserRole,
    student_id_number: '',
    contact_number: '',
    department_or_course: '',
    year_level: '',
    password: '',
  });
  const [editCustomOffice, setEditCustomOffice] = useState('');
  const [isEditCustomOffice, setIsEditCustomOffice] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const loadData = async () => {
    try {
      const [usersRes, servicesRes] = await Promise.all([
        api.getUsers({
          role: roleFilter || undefined,
          search: search || undefined,
        }),
        api.getServices({ all: true })
      ]);
      setUsers(usersRes.data || []);
      setServices(servicesRes.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  // Derive dynamic registered offices from services
  const registeredOffices = Array.from(
    new Set([
      ...defaultOffices,
      ...services.map(s => {
        if (!s.category) return '';
        const cat = s.category.trim();
        if (cat.toLowerCase().includes('office') || cat.toLowerCase().includes('department') || cat.toLowerCase().includes('library')) {
          return cat;
        }
        return `${cat} Office`;
      }).filter(Boolean)
    ])
  );

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      const officeOrCourse =
        formData.role === 'student'
          ? formData.department_or_course
          : isCustomOffice
          ? customOffice.trim() || 'General Operations'
          : formData.department_or_course;

      await api.createUser({
        ...formData,
        department_or_course: officeOrCourse,
      });

      setIsCreateOpen(false);
      setToastMessage(`Account for ${formData.first_name} ${formData.last_name} (${formData.email}) provisioned successfully.`);
      setFormData({
        email: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        role: 'staff',
        student_id_number: '',
        contact_number: '',
        department_or_course: 'Registrar Office',
        year_level: '',
        password: 'password123',
      });
      setIsCustomOffice(false);
      setCustomOffice('');
      loadData();
    } catch (err: any) {
      setFormError(err.message || 'Failed to provision user account.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    const isCustom =
      user.role !== 'student' &&
      !!user.department_or_course &&
      !registeredOffices.includes(user.department_or_course);

    setEditFormData({
      first_name: user.first_name || '',
      middle_name: user.middle_name || '',
      last_name: user.last_name || '',
      role: user.role,
      student_id_number: user.student_id_number || '',
      contact_number: user.contact_number || '',
      department_or_course: isCustom ? 'custom' : user.department_or_course || (user.role === 'student' ? courses[0] : registeredOffices[0]),
      year_level: user.year_level || yearLevels[0],
      password: '',
    });
    setIsEditCustomOffice(isCustom);
    setEditCustomOffice(isCustom ? (user.department_or_course || '') : '');
    setEditError('');
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditLoading(true);
    setEditError('');

    try {
      const officeOrCourse =
        editFormData.role === 'student'
          ? editFormData.department_or_course
          : isEditCustomOffice
          ? editCustomOffice.trim() || 'General Operations'
          : editFormData.department_or_course;

      await api.updateUser(editingUser.id, {
        ...editFormData,
        department_or_course: officeOrCourse,
        password: editFormData.password ? editFormData.password : undefined,
      });

      setEditingUser(null);
      setToastMessage(`Account for ${editFormData.first_name} ${editFormData.last_name} updated successfully.`);
      loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update user account.');
    } finally {
      setEditLoading(false);
    }
  };

  const handleConfirmToggleActive = async () => {
    if (!togglingUser) return;
    setToggleLoading(true);
    try {
      const newStatus = togglingUser.is_active !== 1;
      await api.toggleUserActive(togglingUser.id, newStatus);
      setToastMessage(
        `User ${togglingUser.first_name} ${togglingUser.last_name} account has been ${newStatus ? 'activated' : 'disabled'}.`
      );
      setTogglingUser(null);
      loadData();
    } catch (e: any) {
      setToastError(e.message || 'Failed to toggle account status.');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span>User Provisioning & Accounts</span>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-brand-50 text-brand-700 border border-brand-200 rounded-md uppercase">
              Admin Governance
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Provision staff to registered campus offices, manage role permissions, and govern active accounts.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError('');
          }}
          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision Account</span>
        </button>
      </div>

      {/* Toast Feedback Banners */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage('')} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {toastError && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span className="font-semibold">{toastError}</span>
          </div>
          <button onClick={() => setToastError('')} className="text-rose-600 hover:text-rose-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search email, name, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                loadData();
              }}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              title="Clear search"
            >
              ✕
            </button>
          )}
        </form>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none w-full md:w-48"
        >
          <option value="">All Roles ({users.length})</option>
          <option value="admin">Administrators</option>
          <option value="staff">Staff Personnel</option>
          <option value="student">Students</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-4 px-6">User / Name</th>
                <th className="py-4 px-6">Role</th>
                <th className="py-4 px-6">Assigned Office / Course</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No users found matching search criteria.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-6">
                      <div className="font-bold text-slate-900 text-sm">
                        {u.first_name} {u.middle_name ? `${u.middle_name} ` : ''}{u.last_name}
                      </div>
                      <div className="text-slate-400 text-xs font-mono">
                        {u.email} {u.student_id_number ? `• ${u.student_id_number}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={u.role} />
                    </td>
                    <td className="py-4 px-6">
                      {u.role === 'student' ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <GraduationCap className="w-3.5 h-3.5 text-brand-600 flex-shrink-0" />
                          <span>{u.department_or_course || '—'} {u.year_level ? `(${u.year_level})` : ''}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-800 font-semibold">
                          <Building2 className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span>{u.department_or_course || 'Institutional Superadmin'}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 font-mono">
                      {u.contact_number || '—'}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.is_active === 1 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${u.is_active === 1 ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        {u.is_active === 1 ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition"
                          title="Edit User Provisioning"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setTogglingUser(u)}
                          className={`p-1.5 rounded-lg transition ${
                            u.is_active === 1
                              ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                          title={u.is_active === 1 ? 'Disable Account' : 'Enable Account'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* PROVISION NEW USER MODAL */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Provision New User Account"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Account Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => {
                const newRole = e.target.value as UserRole;
                setFormData(prev => ({
                  ...prev,
                  role: newRole,
                  department_or_course: newRole === 'student' ? courses[0] : registeredOffices[0],
                  year_level: newRole === 'student' ? yearLevels[0] : '',
                }));
                setIsCustomOffice(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
            >
              <option value="staff">Staff Personnel (Office Operations)</option>
              <option value="admin">Administrator (System Governance)</option>
              <option value="student">Student Account</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Middle Name
                </label>
                <span className="text-[10px] text-slate-400 lowercase italic">optional</span>
              </div>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
                placeholder="Optional"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Last Name *
              </label>
              <input
                type="text"
                required
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@srcb.edu.ph"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Mobile / Contact Number
              </label>
              <input
                type="tel"
                value={formData.contact_number}
                onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                placeholder="09123456789"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Dynamic Office Dropdown for Staff / Admin */}
          {formData.role !== 'student' ? (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Assigned Office / Department *
              </label>
              <select
                value={isCustomOffice ? 'custom' : formData.department_or_course}
                onChange={(e) => {
                  if (e.target.value === 'custom') {
                    setIsCustomOffice(true);
                  } else {
                    setIsCustomOffice(false);
                    setFormData({ ...formData, department_or_course: e.target.value });
                  }
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
              >
                {registeredOffices.map((office) => (
                  <option key={office} value={office}>
                    {office}
                  </option>
                ))}
                <option value="custom">+ Other / Custom Office...</option>
              </select>

              {isCustomOffice && (
                <input
                  type="text"
                  required
                  value={customOffice}
                  onChange={(e) => setCustomOffice(e.target.value)}
                  placeholder="Enter custom office / department name..."
                  className="w-full px-4 py-2 rounded-xl border border-brand-300 text-sm bg-brand-50/30"
                />
              )}
              <p className="text-[11px] text-slate-400">
                Staff members operate appointments and queue counters designated for this office.
              </p>
            </div>
          ) : (
            /* Program and Year Level for Student */
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Student ID Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.student_id_number}
                    onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                    placeholder="2026-0001"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Year Level
                  </label>
                  <select
                    value={formData.year_level}
                    onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {yearLevels.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Program / Course
                </label>
                <select
                  value={formData.department_or_course}
                  onChange={(e) => setFormData({ ...formData, department_or_course: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                >
                  {courses.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Initial Password *
            </label>
            <input
              type="text"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formLoading}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {formLoading ? 'Provisioning...' : 'Provision Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER PROVISIONING MODAL */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Update User Provisioning"
        maxWidth="md"
      >
        {editingUser && (
          <form onSubmit={handleUpdateUser} className="space-y-4">
            {editError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs flex items-center justify-between">
              <div>
                <span className="text-slate-400 font-medium">Account Email:</span>
                <strong className="block text-slate-900 font-mono text-sm">{editingUser.email}</strong>
              </div>
              <Badge status={editingUser.role} />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Role *
              </label>
              <select
                value={editFormData.role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setEditFormData(prev => ({
                    ...prev,
                    role: newRole,
                    department_or_course: newRole === 'student' ? courses[0] : registeredOffices[0],
                    year_level: newRole === 'student' ? (prev.year_level || yearLevels[0]) : '',
                  }));
                  setIsEditCustomOffice(false);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
              >
                <option value="staff">Staff Personnel (Office Operations)</option>
                <option value="admin">Administrator (System Governance)</option>
                <option value="student">Student Account</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.first_name}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Middle Name
                  </label>
                  <span className="text-[10px] text-slate-400 lowercase italic">optional</span>
                </div>
                <input
                  type="text"
                  value={editFormData.middle_name}
                  onChange={(e) => setEditFormData({ ...editFormData, middle_name: e.target.value })}
                  placeholder="Optional"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.last_name}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact Number
              </label>
              <input
                type="tel"
                value={editFormData.contact_number}
                onChange={(e) => setEditFormData({ ...editFormData, contact_number: e.target.value })}
                placeholder="09123456789"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            {/* Office Dropdown for Staff / Admin in Edit */}
            {editFormData.role !== 'student' ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Assigned Office / Department *
                </label>
                <select
                  value={isEditCustomOffice ? 'custom' : editFormData.department_or_course}
                  onChange={(e) => {
                    if (e.target.value === 'custom') {
                      setIsEditCustomOffice(true);
                    } else {
                      setIsEditCustomOffice(false);
                      setEditFormData({ ...editFormData, department_or_course: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white font-medium"
                >
                  {registeredOffices.map((office) => (
                    <option key={office} value={office}>
                      {office}
                    </option>
                  ))}
                  <option value="custom">+ Other / Custom Office...</option>
                </select>

                {isEditCustomOffice && (
                  <input
                    type="text"
                    required
                    value={editCustomOffice}
                    onChange={(e) => setEditCustomOffice(e.target.value)}
                    placeholder="Enter custom office / department name..."
                    className="w-full px-4 py-2 rounded-xl border border-brand-300 text-sm bg-brand-50/30"
                  />
                )}
              </div>
            ) : (
              /* Student details in Edit */
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Student ID Number
                    </label>
                    <input
                      type="text"
                      value={editFormData.student_id_number}
                      onChange={(e) => setEditFormData({ ...editFormData, student_id_number: e.target.value })}
                      placeholder="2026-0001"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Year Level
                    </label>
                    <select
                      value={editFormData.year_level}
                      onChange={(e) => setEditFormData({ ...editFormData, year_level: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                    >
                      {yearLevels.map((y) => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Program / Course
                  </label>
                  <select
                    value={editFormData.department_or_course}
                    onChange={(e) => setEditFormData({ ...editFormData, department_or_course: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
                  >
                    {courses.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Reset Password <span className="text-slate-400 font-normal lowercase">(leave blank to keep current)</span>
              </label>
              <input
                type="text"
                value={editFormData.password}
                onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                placeholder="Enter new password if changing..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* TOGGLE ACTIVE STATUS CONFIRMATION MODAL */}
      <Modal
        isOpen={!!togglingUser}
        onClose={() => setTogglingUser(null)}
        title={togglingUser?.is_active === 1 ? 'Disable User Account' : 'Reactivate User Account'}
        maxWidth="md"
      >
        {togglingUser && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Target User Account
                </span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  {togglingUser.first_name} {togglingUser.middle_name ? `${togglingUser.middle_name} ` : ''}{togglingUser.last_name}
                </div>
                <p className="text-xs text-slate-500 font-mono">
                  {togglingUser.email} {togglingUser.student_id_number ? `• ${togglingUser.student_id_number}` : ''}
                </p>
              </div>
              <Badge status={togglingUser.role} />
            </div>

            {togglingUser.is_active === 1 ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <span>
                  <strong>Warning:</strong> Disabling this account will immediately revoke access. This user will not be able to log in until an administrator reactivates their credentials.
                </span>
              </div>
            ) : (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  Reactivating this account will immediately restore login and portal permissions for this user.
                </span>
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setTogglingUser(null)}
                className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={toggleLoading}
                onClick={handleConfirmToggleActive}
                className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 ${
                  togglingUser.is_active === 1
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                <Power className="w-4 h-4" />
                <span>
                  {toggleLoading
                    ? 'Updating...'
                    : togglingUser.is_active === 1
                    ? 'Yes, Disable Account'
                    : 'Yes, Reactivate Account'}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
