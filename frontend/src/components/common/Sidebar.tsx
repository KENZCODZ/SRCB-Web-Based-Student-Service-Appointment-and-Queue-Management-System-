import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Layers,
  Users,
  FileText,
  X,
  Radio,
  Sliders
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, isStaff, isStudent, isLogoutModalOpen } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
      isActive
        ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
    }`;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && !isLogoutModalOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-white border-r border-slate-200/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:flex-shrink-0 ${
          isLogoutModalOpen ? 'hidden lg:hidden' : ''
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="SRCB Logo" 
              className="h-8 w-auto object-contain max-w-[140px]"
            />
            <span className="font-extrabold text-slate-800 text-sm">EduQueue</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Student Navigation */}
          {isStudent && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Student Menu
              </div>
              <nav className="space-y-1">
                <NavLink to="/dashboard" onClick={onClose} className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </NavLink>
                <NavLink to="/services" onClick={onClose} className={navLinkClass}>
                  <Layers className="w-4 h-4" />
                  <span>Browse Services</span>
                </NavLink>
                <NavLink to="/appointments" onClick={onClose} className={navLinkClass}>
                  <Calendar className="w-4 h-4" />
                  <span>My Appointments</span>
                </NavLink>
                <NavLink to="/queue" onClick={onClose} className={navLinkClass}>
                  <Clock className="w-4 h-4" />
                  <span>Queue Tickets</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Staff & Admin Operations */}
          {isStaff && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                Staff Operations
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin/dashboard" onClick={onClose} className={navLinkClass}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Operations Overview</span>
                </NavLink>
                <NavLink to="/admin/appointments" onClick={onClose} className={navLinkClass}>
                  <Calendar className="w-4 h-4" />
                  <span>Manage Appointments</span>
                </NavLink>
                <NavLink to="/admin/queue" onClick={onClose} className={navLinkClass}>
                  <Radio className="w-4 h-4 text-emerald-500" />
                  <span>Queue Counter Desk</span>
                </NavLink>
              </nav>
            </div>
          )}

          {/* Admin Management */}
          {isAdmin && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
                System Administration
              </div>
              <nav className="space-y-1">
                <NavLink to="/admin/services" onClick={onClose} className={navLinkClass}>
                  <Sliders className="w-4 h-4" />
                  <span>Services & Schedules</span>
                </NavLink>
                <NavLink to="/admin/users" onClick={onClose} className={navLinkClass}>
                  <Users className="w-4 h-4" />
                  <span>User Accounts</span>
                </NavLink>
                <NavLink to="/admin/audit" onClick={onClose} className={navLinkClass}>
                  <FileText className="w-4 h-4" />
                  <span>Audit & Email Logs</span>
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
