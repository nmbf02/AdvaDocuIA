import React from 'react';
import { AlertTriangle, RotateCcw, Info, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Sí, continuar",
  cancelText = "Cancelar",
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getIconAndColors = () => {
    switch (type) {
      case 'info':
        return {
          icon: <RotateCcw className="w-5 h-5" />,
          iconBg: 'bg-blue-100 border-blue-200 text-[#0A3D62]',
          buttonBg: 'bg-[#0A3D62] hover:bg-[#1E5F8A] border-[#0A3D62]',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-amber-100 border-amber-200 text-amber-600',
          buttonBg: 'bg-amber-600 hover:bg-amber-700 border-amber-700',
        };
      case 'danger':
      default:
        return {
          icon: <AlertTriangle className="w-5 h-5" />,
          iconBg: 'bg-red-100 border-red-200 text-red-600',
          buttonBg: 'bg-red-600 hover:bg-red-700 border-red-700',
        };
    }
  };

  const styleConfig = getIconAndColors();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${styleConfig.iconBg}`}>
              {styleConfig.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Confirmación requerida</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="px-5 py-3 text-sm text-slate-600 leading-relaxed border-t border-b border-slate-100 bg-slate-50/50">
          {message}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl shadow-sm transition-colors"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 text-xs font-bold text-white active:scale-95 transition-all rounded-xl shadow-sm border ${styleConfig.buttonBg}`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
