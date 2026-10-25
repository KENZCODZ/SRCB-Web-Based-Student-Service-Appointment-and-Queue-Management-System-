import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
  noPadding?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = 'md',
  noPadding = false,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
  }[maxWidth];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 md:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl border border-slate-200/90 w-full ${maxWidthClass} max-h-[92vh] flex flex-col overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 my-auto`}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER: Always pinned at top with prominent close button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            {icon && (
              <div className="p-2 bg-brand-50 text-brand-600 rounded-xl flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-slate-800 truncate">{title}</h3>
              {subtitle && <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="flex-shrink-0 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 active:bg-slate-200 rounded-xl transition flex items-center justify-center border border-slate-200/70 shadow-2xs group"
            title="Close (Esc)"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform text-slate-500 hover:text-slate-700" />
          </button>
        </div>

        {/* MODAL BODY: Smooth scrollable content */}
        <div className={`flex-1 overflow-y-auto ${noPadding ? 'flex flex-col min-h-0' : 'p-6'}`}>
          {children}
        </div>

        {/* OPTIONAL STICKY FOOTER */}
        {footer && (
          <div className="border-t border-slate-100 px-6 py-3.5 bg-slate-50/90 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
