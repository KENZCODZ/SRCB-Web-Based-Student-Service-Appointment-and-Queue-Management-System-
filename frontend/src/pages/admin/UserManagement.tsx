import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User, UserRole } from '../../types';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import {
  Users,
  UserPlus,
  Power,
  Search,
  CheckCircle2,
  AlertCircle,
  Shield,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Account Toggle Confirmation Modal State (Heuristic 5: Error Prevention)
  const [togglingUser, setTogglingUser] = useState<User | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Auto-dismiss toast message after 5 seconds (Heuristic 1: Visibility of System Status)
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'staff' as UserRole,
    student_id_number: '',
    contact_number: '',
    department_or_course: 'Registrar Office',
    year_level: '',
    password: 'password123',
  });

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const loadUsers = async () => {
    try {
      const res = await api.getUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      setUsers(res.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError('');

    try {
      await api.createUser(formData);
      setIsCreateOpen(false);
      setToastMessage(`Account for ${formData.first_name} ${formData.last_name} (${formData.email}) created successfully.`);
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        role: 'staff',
        student_id_number: '',
        contact_number: '',
        department_or_course: 'Registrar Office',
        year_level: '',
        password: 'password123',
      });
      loadUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user account.');
    } finally {
      setFormLoading(false);
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
      loadUsers();
    } catch (e: any) {
      alert(e.message || 'Failed to toggle account status.');
    } finally {
      setToggleLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Account Management
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Administer student, staff, and administrator credentials and access permissions.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError('');
          }}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Provision User Account</span>
        </button>
      </div>

      {/* Toast Feedback Banner (Heuristic 1: Visibility of System Status) */}
      {toastMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-bold text-sm">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage('')}
            className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100/50"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filters Bar with Clear Option (Heuristic 7: Flexibility & Efficiency) */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
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
                loadUsers();
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
                <th className="py-4 px-6">Department / Program</th>
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
                        {u.first_name} {u.last_name}
                      </div>
                      <div className="text-slate-400 text-xs">
                        {u.email} {u.student_id_number ? `• ${u.student_id_number}` : ''}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <Badge status={u.role} />
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      {u.department_or_course || '—'} {u.year_level ? `(${u.year_level})` : ''}
                    </td>
                    <td className="py-4 px-6 text-slate-500">
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
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE USER MODAL */}
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
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm bg-white"
            >
              <option value="staff">Staff Personnel</option>
              <option value="admin">Administrator</option>
              <option value="student">Student</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                First Name *
              </label>
              <input
                type="text"
                required
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
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
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Student ID (if Student)
              </label>
              <input
                type="text"
                value={formData.student_id_number}
                onChange={(e) => setFormData({ ...formData, student_id_number: e.target.value })}
                placeholder="2026-0001"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Department / Program
              </label>
              <input
                type="text"
                value={formData.department_or_course}
                onChange={(e) => setFormData({ ...formData, department_or_course: e.target.value })}
                placeholder="e.g. Registrar Office or BSIT"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Initial Password
              </label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-sm font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2">
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
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm transition disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* TOGGLE ACTIVE STATUS CONFIRMATION MODAL (Heuristic 5: Error Prevention & Heuristic 6: Recognition) */}
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
                  {togglingUser.first_name} {togglingUser.last_name}
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
