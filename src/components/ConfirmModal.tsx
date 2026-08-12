import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = "Sí, Limpiar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="p-5 pb-3 flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-red-100 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
              <AlertTriangle className="w-5 h-5" />
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
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-xl shadow-sm border border-red-700"
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};
