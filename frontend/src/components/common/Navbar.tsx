import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { NotificationBell } from './NotificationBell';
import { LogOut, Shield, Menu, Monitor } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200/80 shadow-sm">
      <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/20">
              E
            </div>
            <div>
              <div className="font-extrabold text-slate-900 leading-tight text-base tracking-tight flex items-center gap-1.5">
                EduQueue
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-brand-100 text-brand-700 rounded-md uppercase tracking-wider">
                  SRCB
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Student Service Portal</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/display"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 bg-slate-100 hover:bg-brand-50 rounded-xl transition"
            title="Open Live Public Queue Display Screen"
          >
            <Monitor className="w-4 h-4 text-brand-600" />
            <span>Public Screen</span>
          </Link>

          {user && <NotificationBell />}

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
              <Link
                to="/profile"
                className="flex items-center gap-2.5 hover:opacity-80 transition text-left"
              >
                <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-200 flex items-center justify-center text-brand-700 font-bold text-xs">
                  {user.first_name[0]}{user.last_name[0]}
                </div>
                <div className="hidden md:block">
                  <p className="text-xs font-bold text-slate-800 leading-tight">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                    {isAdmin && <Shield className="w-3 h-3 text-purple-600" />}
                    {user.role} {user.student_id_number ? `(${user.student_id_number})` : ''}
                  </p>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-brand-600 transition"
              >
                Log In
              </Link>
              <Link
                to="/register"
                className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition shadow-sm"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
