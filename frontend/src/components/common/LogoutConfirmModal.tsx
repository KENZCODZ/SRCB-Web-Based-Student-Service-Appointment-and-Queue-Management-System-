import React from 'react';
import { Modal } from './Modal';
import { LogOut } from 'lucide-react';
import { User as UserType } from '../../types';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  loading?: boolean;
  user?: UserType | null;
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  user,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={loading ? () => {} : onClose}
      title="Sign Out Confirmation"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Warning Icon & Prompt (HCI Heuristic 5: Error Prevention) */}
        <div className="flex items-center gap-3.5 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs">
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-950">
              Are you sure you want to sign out?
            </h4>
            <p className="text-xs text-amber-800/80 mt-0.5">
              Your active session will be ended securely.
            </p>
          </div>
        </div>

        {/* User Account Card Preview (HCI Heuristic 6: Recognition rather than Recall) */}
        {user && (
          <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-bold text-sm flex items-center justify-center border border-brand-200/60 shadow-xs">
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user.first_name} {user.middle_name ? `${user.middle_name} ` : ''}{user.last_name}
                </p>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-700'
                      : user.role === 'staff'
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                {user.student_id_number || user.email}
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 leading-relaxed px-1">
          You will need your login credentials to sign in again. For security, your session and saved inputs on this device will be cleared.
        </p>

        {/* Action Buttons (HCI Heuristic 3: User Control & Freedom) */}
        <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-semibold text-xs transition disabled:opacity-50"
          >
            Stay Signed In
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 flex items-center gap-2 transition disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" />
            <span>{loading ? 'Signing out...' : 'Yes, Sign Out'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
